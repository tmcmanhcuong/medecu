import os
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload
def test_generating_quizz_forwards_notebook_scope_and_scopes_cache(tmp_path, monkeypatch):
    monkeypatch.setattr("api.v1.endpoints.AI.AGENTCORE_KNOWLEDGE_BASE_ID", "kb-quiz", raising=False)
    monkeypatch.setattr("api.v1.endpoints.AI.AGENTCORE_QUIZ_AGENT_ID", "quiz-agent", raising=False)
    monkeypatch.setattr("api.v1.endpoints.AI.AGENTCORE_QUIZ_AGENT_ALIAS_ID", "quiz-alias", raising=False)
    monkeypatch.setattr("api.v1.endpoints.AI.QUIZZ_PATH", str(tmp_path / "quizz"), raising=False)

    response_payload = {
        "output": '[{"question":"Q1","options":["A","B","C","D"],"correct_index":0,"explanation":"E"}]'
    }

    with patch(
        "api.v1.endpoints.AI.notebook_agent_client.invoke_bedrock_agent",
        return_value=response_payload,
    ) as mock_invoke:
        response = TestClient(app).post(
            "/api/v1/ai/generating-quizz",
            json={
                "chapter_title": "TEST1",
                "notebook_id": "a2ce9d4c-744d-4ab3-b26e-da4d7aebfe2b",
                "source_book_ids": ["e4f2222f-218c-414d-abe3-51170573ece2"],
                "source_file_names": ["XBRAIN_SYLLABUS_FOUNDATION.pdf"],
                "limit": 5,
                "user_id": "d5565ffb-5a42-4c14-b6f7-2f64d38f4092",
            },
        )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Generating successful"
    assert data["data"][0]["question"] == "Q1"
    assert data["cache_file"]
    assert "a2ce9d4c-744d-4ab3-b26e-da4d7aebfe2b" in os.path.basename(data["cache_file"])

    forwarded_call = mock_invoke.call_args.kwargs
    filter_obj = forwarded_call["session_state"]["knowledgeBaseConfigurations"][0]["retrievalConfiguration"]["vectorSearchConfiguration"]["filter"]
    assert forwarded_call["session_id"] == "a2ce9d4c-744d-4ab3-b26e-da4d7aebfe2b"
    assert forwarded_call["agent_id"] == "quiz-agent"
    assert forwarded_call["agent_alias_id"] == "quiz-alias"
    assert filter_obj["andAll"][0]["equals"]["value"] == "a2ce9d4c-744d-4ab3-b26e-da4d7aebfe2b"
    assert filter_obj["andAll"][1]["in"]["value"] == ["e4f2222f-218c-414d-abe3-51170573ece2"]
    assert filter_obj["andAll"][2]["in"]["value"] == ["XBRAIN_SYLLABUS_FOUNDATION.pdf"]
    assert "XBRAIN_SYLLABUS_FOUNDATION.pdf" in forwarded_call["input_text"]


def test_generating_flashcard_rejects_empty_notebook_scope_result(tmp_path, monkeypatch):
    monkeypatch.setattr("api.v1.endpoints.AI.AGENTCORE_KNOWLEDGE_BASE_ID", "kb-flash", raising=False)
    monkeypatch.setattr("api.v1.endpoints.AI.AGENTCORE_FLASHCARD_AGENT_ID", "flash-agent", raising=False)
    monkeypatch.setattr("api.v1.endpoints.AI.AGENTCORE_FLASHCARD_AGENT_ALIAS_ID", "flash-alias", raising=False)
    monkeypatch.setattr("api.v1.endpoints.AI.FLASH_PATH", str(tmp_path / "flash"), raising=False)

    with patch(
        "api.v1.endpoints.AI.notebook_agent_client.invoke_bedrock_agent",
        return_value={"output": "[]"},
    ):
        response = TestClient(app).post(
            "/api/v1/ai/generating-flashcard",
            json={
                "chapter_title": "TEST1",
                "notebook_id": "a2ce9d4c-744d-4ab3-b26e-da4d7aebfe2b",
                "source_book_ids": ["e4f2222f-218c-414d-abe3-51170573ece2"],
                "source_file_names": ["XBRAIN_SYLLABUS_FOUNDATION.pdf"],
                "limit": 5,
                "user_id": "d5565ffb-5a42-4c14-b6f7-2f64d38f4092",
            },
        )

    assert response.status_code == 422
    assert "no items" in response.json()["detail"].lower()
