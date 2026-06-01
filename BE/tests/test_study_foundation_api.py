import uuid
from fastapi.testclient import TestClient

from main import app
from api.v1.endpoints.notes import get_note_repository


class FakeBookRepo:
    def __init__(self):
        self.created_payload = None

    def create_uploaded_book(self, **kwargs):
        self.created_payload = kwargs
        return {
            "id": str(uuid.uuid4()),
            "query_id": "sample",
            "title": kwargs["file_name"],
            "description": "",
            "path": kwargs["file_path"],
            "user_id": kwargs["user_id"],
            "file_name": kwargs["file_name"],
            "mime_type": kwargs["mime_type"],
            "file_size": kwargs["file_size"],
            "ingestion_status": "uploaded",
            "ingestion_error": "",
        }

    def get_book_for_user(self, book_id, user_id):
        if str(user_id) != "11111111-1111-1111-1111-111111111111":
            return None
        return {"id": book_id, "title": "owned"}


class FakeNoteRepo:
    async def create_note(self, request, user_id):
        return {
            "id": uuid.uuid4(),
            "title": request.title,
            "content": request.content,
            "book_id": request.book_id,
            "source_page": request.source_page,
            "source_excerpt": request.source_excerpt,
            "created_at": "now",
            "updated_at": None,
        }

    async def get_note(self, note_id):
        return None

    async def get_notes(self, user_id, book_id=None, skip=0, limit=10):
        return []

    async def count_notes(self, user_id, book_id=None):
        return 0


class FakeHistoryRepo:
    def upsert_extracted_content(self, book_id, user_id, payload):
        return type(
            "Record",
            (),
            {
                "id": uuid.uuid4(),
                "book_id": book_id,
                "user_id": user_id,
                "content_text": payload.content_text,
                "content_version": payload.content_version,
                "processing_status": payload.processing_status,
                "processing_error": payload.processing_error or "",
                "created_at": "now",
                "updated_at": None,
            },
        )()

    def mark_extraction_failed(self, book_id, error_message):
        return None

    def create_history(self, user_id, payload):
        return type(
            "History",
            (),
            {
                "id": uuid.uuid4(),
                "artifact_type": payload.artifact_type,
                "activity_type": payload.activity_type,
                "payload": payload.payload,
                "book_id": payload.book_id,
                "user_id": user_id,
                "source_page": payload.source_page,
                "source_excerpt": payload.source_excerpt,
                "created_at": "now",
                "updated_at": None,
            },
        )()

    def get_history(self, user_id, book_id, limit):
        return []


def test_upload_rejects_non_pdf(monkeypatch):
    from api.v1.endpoints.books import get_book_repository

    app.dependency_overrides[get_book_repository] = lambda: FakeBookRepo()
    monkeypatch.setattr(
        "api.v1.endpoints.books.save_uploaded_document",
        lambda _: ("./cache/documents/sample.txt", 10),
    )
    client = TestClient(app)
    response = client.post(
        "/api/v1/books/upload",
        data={"user_id": "11111111-1111-1111-1111-111111111111"},
        files={"pdf_file": ("sample.txt", b"abc", "text/plain")},
    )
    app.dependency_overrides.clear()
    assert response.status_code == 400


def test_upload_accepts_pdf(monkeypatch):
    from api.v1.endpoints.books import get_book_repository

    app.dependency_overrides[get_book_repository] = lambda: FakeBookRepo()

    async def fake_save_uploaded_document(_file):
        return "./cache/documents/sample.pdf", 123

    monkeypatch.setattr("api.v1.endpoints.books.save_uploaded_document", fake_save_uploaded_document)
    client = TestClient(app)
    response = client.post(
        "/api/v1/books/upload",
        data={"user_id": "11111111-1111-1111-1111-111111111111"},
        files={"pdf_file": ("sample.pdf", b"%PDF", "application/pdf")},
    )
    app.dependency_overrides.clear()
    assert response.status_code == 201
    assert response.json()["data"]["mime_type"] == "application/pdf"


def test_document_detail_ownership():
    from api.v1.endpoints.books import get_book_repository

    app.dependency_overrides[get_book_repository] = lambda: FakeBookRepo()
    client = TestClient(app)
    doc_id = str(uuid.uuid4())
    unauthorized = client.get(
        f"/api/v1/books/{doc_id}",
        params={"user_id": "22222222-2222-2222-2222-222222222222"},
    )
    authorized = client.get(
        f"/api/v1/books/{doc_id}",
        params={"user_id": "11111111-1111-1111-1111-111111111111"},
    )
    app.dependency_overrides.clear()
    assert unauthorized.status_code == 404
    assert authorized.status_code == 200


def test_notes_filter_supports_book_id():
    app.dependency_overrides[get_note_repository] = lambda: FakeNoteRepo()
    client = TestClient(app)
    response = client.get(
        "/api/v1/notes/",
        params={
            "user_id": "11111111-1111-1111-1111-111111111111",
            "book_id": str(uuid.uuid4()),
        },
    )
    app.dependency_overrides.clear()
    assert response.status_code == 200


def test_history_save_and_list(monkeypatch):
    from api.v1.endpoints.study_history import get_study_history_repo

    app.dependency_overrides[get_study_history_repo] = lambda: FakeHistoryRepo()
    client = TestClient(app)
    payload = {
        "artifact_type": "summary",
        "activity_type": "generated",
        "payload": "{\"value\":\"ok\"}",
    }
    create_response = client.post(
        "/api/v1/study/history",
        params={"user_id": "11111111-1111-1111-1111-111111111111"},
        json=payload,
    )
    list_response = client.get(
        "/api/v1/study/history",
        params={"user_id": "11111111-1111-1111-1111-111111111111", "limit": 10},
    )
    app.dependency_overrides.clear()
    assert create_response.status_code == 200
    assert list_response.status_code == 200
