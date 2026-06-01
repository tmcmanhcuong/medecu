import uuid
from datetime import datetime

from fastapi.testclient import TestClient

from api.deps import get_notebook_repository
from main import app


class FakeNotebookSource:
    def __init__(self, notebook_id, book_id, user_id, status="processing", error="", job_id="job-1"):
        self.id = uuid.uuid4()
        self.notebook_id = notebook_id
        self.book_id = book_id
        self.user_id = user_id
        self.ingestion_status = status
        self.ingestion_error = error
        self.ingestion_job_id = job_id
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()


class FakeNotebookRepo:
    def __init__(self):
        self._notebook_id = uuid.uuid4()
        self._book_id = uuid.uuid4()
        self._user_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        self._source = FakeNotebookSource(
            notebook_id=self._notebook_id,
            book_id=self._book_id,
            user_id=self._user_id,
            status="processing",
            error="",
            job_id="job-abc",
        )

    def get_notebook_for_user(self, notebook_id, user_id):
        if notebook_id == self._notebook_id and user_id == self._user_id:
            class Notebook:
                id = notebook_id
                title = "Notebook Test"
                description = ""
                user_id = user_id
                created_at = datetime.utcnow()
                updated_at = datetime.utcnow()
            return Notebook()
        return None

    def list_notebook_sources(self, notebook_id, user_id):
        if notebook_id == self._notebook_id and user_id == self._user_id:
            return [self._source]
        return []

    def retry_source_ingestion(self, notebook_id, book_id, user_id):
        if notebook_id != self._notebook_id or book_id != self._book_id or user_id != self._user_id:
            raise ValueError("not found")
        self._source.ingestion_status = "processing"
        self._source.ingestion_error = ""
        self._source.ingestion_job_id = "job-retry"
        self._source.updated_at = datetime.utcnow()
        return self._source


def test_list_notebook_sources_returns_ingestion_status_fields():
    client = TestClient(app)
    fake_repo = FakeNotebookRepo()
    app.dependency_overrides[get_notebook_repository] = lambda: fake_repo

    response = client.get(
        f"/api/v1/notebooks/{fake_repo._notebook_id}/sources",
        params={"user_id": str(fake_repo._user_id)},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    payload = response.json()
    assert payload["data"][0]["ingestion_status"] == "processing"
    assert payload["data"][0]["ingestion_job_id"] == "job-abc"
    assert "ingestion_error" in payload["data"][0]


def test_retry_notebook_source_ingestion_endpoint():
    client = TestClient(app)
    fake_repo = FakeNotebookRepo()
    app.dependency_overrides[get_notebook_repository] = lambda: fake_repo

    response = client.post(
        f"/api/v1/notebooks/{fake_repo._notebook_id}/sources/{fake_repo._book_id}/retry",
        params={"user_id": str(fake_repo._user_id)},
    )

    app.dependency_overrides.clear()
    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Source ingestion retried"
    assert payload["data"]["ingestion_status"] == "processing"
    assert payload["data"]["ingestion_job_id"] == "job-retry"

