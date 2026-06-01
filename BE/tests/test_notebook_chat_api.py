import uuid
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

from main import app
from api.deps import get_notebook_repository
from services.notebook_context import NoSourceContextError
from services.bedrock_provider import (
    BedrockAccessError,
    BedrockThrottlingError,
    BedrockValidationError,
    BedrockProviderError,
)


class FakeNotebookRepo:
    """Fake repository for testing notebook ownership validation"""

    def get_notebook_for_user(self, notebook_id, user_id):
        # Simulate ownership check
        if str(user_id) == "11111111-1111-1111-1111-111111111111":
            return {
                "id": notebook_id,
                "title": "Test Notebook",
                "user_id": user_id,
            }
        return None


def build_runtime_mock(result=None, error=None):
    runtime = Mock()
    if error is not None:
        runtime.converse.side_effect = error
    else:
        runtime.converse.return_value = result
    return runtime


@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)


@pytest.fixture
def valid_user_id():
    """Valid user ID for testing"""
    return "11111111-1111-1111-1111-111111111111"


@pytest.fixture
def invalid_user_id():
    """Invalid user ID for testing"""
    return "22222222-2222-2222-2222-222222222222"


@pytest.fixture
def notebook_id():
    """Test notebook ID"""
    return str(uuid.uuid4())


class TestNotebookChatSuccess:
    """Test successful notebook chat operations"""

    def test_valid_chat_request_with_sources(
        self, client, valid_user_id, notebook_id, monkeypatch
    ):
        """Test valid chat request returns Bedrock response with sources"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        # Mock NotebookContextService
        mock_context_result = {
            "context_text": "Sample book content about Python programming.",
            "sources": [
                {
                    "book_id": str(uuid.uuid4()),
                    "title": "Python Basics",
                    "content_count": 1,
                }
            ],
            "total_chars": 45,
            "truncated": False,
        }

        mock_context_service = Mock()
        mock_context_service.build_context_for_notebook.return_value = (
            mock_context_result
        )

        mock_bedrock_response = {
            "answer_text": "Python is a high-level programming language.",
            "provider_metadata": {
                "model_id": "amazon.nova-micro-v1:0",
                "stop_reason": "end_turn",
                "usage": {"input_tokens": 100, "output_tokens": 20},
            },
        }

        mock_runtime = build_runtime_mock(result=mock_bedrock_response)

        with patch(
            "api.v1.endpoints.AI.NotebookContextService",
            return_value=mock_context_service,
        ), patch("api.v1.endpoints.AI.get_notebook_chat_runtime", return_value=mock_runtime):
            response = client.post(
                "/api/v1/ai/notebook-chat",
                params={"user_id": valid_user_id},
                json={
                    "notebook_id": notebook_id,
                    "user_message": "What is Python?",
                },
            )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Chat successful"
        assert "data" in data
        assert data["data"]["answer_text"] == mock_bedrock_response["answer_text"]
        assert data["data"]["sources"] == mock_context_result["sources"]
        assert "provider_metadata" in data["data"]

    def test_chat_with_conversation_history(
        self, client, valid_user_id, notebook_id, monkeypatch
    ):
        """Test chat request with conversation history"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        mock_context_result = {
            "context_text": "Sample content.",
            "sources": [{"book_id": str(uuid.uuid4()), "title": "Book", "content_count": 1}],
            "total_chars": 15,
            "truncated": False,
        }

        mock_context_service = Mock()
        mock_context_service.build_context_for_notebook.return_value = (
            mock_context_result
        )

        mock_bedrock_response = {
            "answer_text": "Follow-up answer.",
            "provider_metadata": {"model_id": "amazon.nova-micro-v1:0"},
        }

        mock_runtime = build_runtime_mock(result=mock_bedrock_response)

        conversation_history = [
            {"role": "user", "content": "First question"},
            {"role": "assistant", "content": "First answer"},
        ]

        with patch(
            "api.v1.endpoints.AI.NotebookContextService",
            return_value=mock_context_service,
        ), patch("api.v1.endpoints.AI.get_notebook_chat_runtime", return_value=mock_runtime):
            response = client.post(
                "/api/v1/ai/notebook-chat",
                params={"user_id": valid_user_id},
                json={
                    "notebook_id": notebook_id,
                    "user_message": "Follow-up question",
                    "conversation_history": conversation_history,
                },
            )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        # Verify converse was called with history
        mock_runtime.converse.assert_called_once()
        call_kwargs = mock_runtime.converse.call_args[1]
        assert call_kwargs["conversation_history"] == conversation_history


class TestNotebookChatOwnership:
    """Test notebook ownership validation"""

    def test_invalid_notebook_returns_404(
        self, client, invalid_user_id, notebook_id
    ):
        """Test chat with invalid notebook returns 404"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        response = client.post(
            "/api/v1/ai/notebook-chat",
            params={"user_id": invalid_user_id},
            json={
                "notebook_id": notebook_id,
                "user_message": "Test message",
            },
        )

        app.dependency_overrides.clear()

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_unauthorized_notebook_access(
        self, client, invalid_user_id, notebook_id
    ):
        """Test unauthorized access to notebook returns 404"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        response = client.post(
            "/api/v1/ai/notebook-chat",
            params={"user_id": invalid_user_id},
            json={
                "notebook_id": notebook_id,
                "user_message": "Test message",
            },
        )

        app.dependency_overrides.clear()

        assert response.status_code == 404


class TestNotebookChatNoSourceContext:
    """Test no-source context error handling"""

    def test_no_source_context_returns_400(
        self, client, valid_user_id, notebook_id
    ):
        """Test chat with no sources returns 400 with clear error"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        mock_context_service = Mock()
        mock_context_service.build_context_for_notebook.side_effect = (
            NoSourceContextError("Please attach books to this notebook")
        )

        with patch(
            "api.v1.endpoints.AI.NotebookContextService",
            return_value=mock_context_service,
        ):
            response = client.post(
                "/api/v1/ai/notebook-chat",
                params={"user_id": valid_user_id},
                json={
                    "notebook_id": notebook_id,
                    "user_message": "Test message",
                },
            )

        app.dependency_overrides.clear()

        assert response.status_code == 400
        assert "attach books" in response.json()["detail"].lower()

    def test_no_content_in_sources_returns_400(
        self, client, valid_user_id, notebook_id
    ):
        """Test chat with sources but no content returns 400"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        mock_context_service = Mock()
        mock_context_service.build_context_for_notebook.side_effect = (
            NoSourceContextError("Please ensure attached books have been processed")
        )

        with patch(
            "api.v1.endpoints.AI.NotebookContextService",
            return_value=mock_context_service,
        ):
            response = client.post(
                "/api/v1/ai/notebook-chat",
                params={"user_id": valid_user_id},
                json={
                    "notebook_id": notebook_id,
                    "user_message": "Test message",
                },
            )

        app.dependency_overrides.clear()

        assert response.status_code == 400
        assert "processed" in response.json()["detail"].lower()


class TestNotebookChatBedrockErrors:
    """Test Bedrock provider error handling"""

    def test_bedrock_access_error_returns_403(
        self, client, valid_user_id, notebook_id
    ):
        """Test Bedrock access error returns 403"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        mock_context_result = {
            "context_text": "Sample content.",
            "sources": [{"book_id": str(uuid.uuid4()), "title": "Book", "content_count": 1}],
            "total_chars": 15,
            "truncated": False,
        }

        mock_context_service = Mock()
        mock_context_service.build_context_for_notebook.return_value = (
            mock_context_result
        )

        mock_runtime = build_runtime_mock(error=BedrockAccessError("Access denied to model"))

        with patch(
            "api.v1.endpoints.AI.NotebookContextService",
            return_value=mock_context_service,
        ), patch("api.v1.endpoints.AI.get_notebook_chat_runtime", return_value=mock_runtime):
            response = client.post(
                "/api/v1/ai/notebook-chat",
                params={"user_id": valid_user_id},
                json={
                    "notebook_id": notebook_id,
                    "user_message": "Test message",
                },
            )

        app.dependency_overrides.clear()

        assert response.status_code == 403
        assert "access" in response.json()["detail"].lower()

    def test_bedrock_throttling_error_returns_429(
        self, client, valid_user_id, notebook_id
    ):
        """Test Bedrock throttling error returns 429"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        mock_context_result = {
            "context_text": "Sample content.",
            "sources": [{"book_id": str(uuid.uuid4()), "title": "Book", "content_count": 1}],
            "total_chars": 15,
            "truncated": False,
        }

        mock_context_service = Mock()
        mock_context_service.build_context_for_notebook.return_value = (
            mock_context_result
        )

        mock_runtime = build_runtime_mock(error=BedrockThrottlingError("Rate limit exceeded"))

        with patch(
            "api.v1.endpoints.AI.NotebookContextService",
            return_value=mock_context_service,
        ), patch("api.v1.endpoints.AI.get_notebook_chat_runtime", return_value=mock_runtime):
            response = client.post(
                "/api/v1/ai/notebook-chat",
                params={"user_id": valid_user_id},
                json={
                    "notebook_id": notebook_id,
                    "user_message": "Test message",
                },
            )

        app.dependency_overrides.clear()

        assert response.status_code == 429
        assert "throttling" in response.json()["detail"].lower()

    def test_bedrock_validation_error_returns_400(
        self, client, valid_user_id, notebook_id
    ):
        """Test Bedrock validation error returns 400"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        mock_context_result = {
            "context_text": "Sample content.",
            "sources": [{"book_id": str(uuid.uuid4()), "title": "Book", "content_count": 1}],
            "total_chars": 15,
            "truncated": False,
        }

        mock_context_service = Mock()
        mock_context_service.build_context_for_notebook.return_value = (
            mock_context_result
        )

        mock_runtime = build_runtime_mock(error=BedrockValidationError("Invalid request parameters"))

        with patch(
            "api.v1.endpoints.AI.NotebookContextService",
            return_value=mock_context_service,
        ), patch("api.v1.endpoints.AI.get_notebook_chat_runtime", return_value=mock_runtime):
            response = client.post(
                "/api/v1/ai/notebook-chat",
                params={"user_id": valid_user_id},
                json={
                    "notebook_id": notebook_id,
                    "user_message": "Test message",
                },
            )

        app.dependency_overrides.clear()

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()

    def test_bedrock_provider_error_returns_500(
        self, client, valid_user_id, notebook_id
    ):
        """Test generic Bedrock provider error returns 500"""
        app.dependency_overrides[get_notebook_repository] = lambda: FakeNotebookRepo()

        mock_context_result = {
            "context_text": "Sample content.",
            "sources": [{"book_id": str(uuid.uuid4()), "title": "Book", "content_count": 1}],
            "total_chars": 15,
            "truncated": False,
        }

        mock_context_service = Mock()
        mock_context_service.build_context_for_notebook.return_value = (
            mock_context_result
        )

        mock_runtime = build_runtime_mock(error=BedrockProviderError("Unexpected provider error"))

        with patch(
            "api.v1.endpoints.AI.NotebookContextService",
            return_value=mock_context_service,
        ), patch("api.v1.endpoints.AI.get_notebook_chat_runtime", return_value=mock_runtime):
            response = client.post(
                "/api/v1/ai/notebook-chat",
                params={"user_id": valid_user_id},
                json={
                    "notebook_id": notebook_id,
                    "user_message": "Test message",
                },
            )

        app.dependency_overrides.clear()

        assert response.status_code == 500
        assert "provider error" in response.json()["detail"].lower()
