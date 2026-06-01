import unittest
from unittest.mock import MagicMock

# Define mock clients
mock_s3 = MagicMock()
mock_agent = MagicMock()
mock_runtime = MagicMock()

# Setup MagicMock for Bedrock Agent invoke_agent response to allow tracking call counts
mock_runtime.invoke_agent = MagicMock(return_value={
    "completion": [
        {"trace": {"mock_trace": "value"}},
        {"chunk": {"bytes": b"Mocked text "}},
        {"chunk": {"bytes": b"from Bedrock Agent!"}}
    ]
})

mock_agent.start_ingestion_job.return_value = {
    "ingestionJob": {
        "ingestionJobId": "mock-job-123",
        "status": "STARTING"
    }
}

# Import singleton client, router, app, and override its internals directly
from main import app
from agentcore.config import settings
from agentcore.client import agent_client
from fastapi.testclient import TestClient

# Inject our mocks directly into the singleton agent_client to avoid import sequencing issues
agent_client._s3_client = mock_s3
agent_client._agent_client = mock_agent
agent_client._runtime_client = mock_runtime

class TestBedrockAgentCore(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.settings = settings
        
        # Override settings for tests
        cls.settings.AWS_AGENT_ID_CHAT = "chat-agent-id"
        cls.settings.AWS_AGENT_ID_FLASHCARD = "flash-agent-id"
        cls.settings.AWS_AGENT_ID_QUIZ = "quiz-agent-id"
        cls.settings.AWS_KB_ID = "kb-id"
        cls.settings.AWS_KB_DATA_SOURCE_ID = "ds-id"

        cls.client = TestClient(app)

    def test_upload_and_sync_endpoint(self):
        """Test PUT /agentcore/uploading-book-content-to-rag"""
        mock_s3.reset_mock()
        mock_agent.reset_mock()

        file_payload = {"file": ("test.md", b"# Header\nContent markdown", "text/markdown")}
        response = self.client.put("/agentcore/uploading-book-content-to-rag", files=file_payload)

        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["status"], "success")
        self.assertEqual(json_data["ingestion_job_id"], "mock-job-123")

        # Verify S3 uploads were called (both original content and companion metadata file)
        self.assertEqual(mock_s3.put_object.call_count, 2)
        # Verify Bedrock sync was called
        mock_agent.start_ingestion_job.assert_called_once_with(
            knowledgeBaseId="kb-id",
            dataSourceId="ds-id",
            description="Automated ingestion of test.md via MedEdu backend"
        )

    def test_chat_with_rag_endpoint(self):
        """Test POST /agentcore/chat-with-rag"""
        mock_runtime.reset_mock()

        payload = {
            "user-prompt": "Hello Agent",
            "session-id": "test-session-uuid"
        }
        response = self.client.post("/agentcore/chat-with-rag", json=payload)

        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["output"], "Mocked text from Bedrock Agent!")

        # Verify agent runtime client was invoked with sanitized session_id
        mock_runtime.invoke_agent.assert_called_once()
        call_kwargs = mock_runtime.invoke_agent.call_args[1]
        self.assertEqual(call_kwargs["agentId"], "chat-agent-id")
        self.assertEqual(call_kwargs["sessionId"], "test-session-uuid")
        self.assertEqual(call_kwargs["inputText"], "Hello Agent")

    def test_generating_flashcard_endpoint(self):
        """Test POST /agentcore/generating-flashcard"""
        mock_runtime.reset_mock()

        payload = {
            "chapter-title": "Viêm Phổi",
            "limit": 5
        }
        response = self.client.post("/agentcore/generating-flashcard", json=payload)

        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["output"], "Mocked text from Bedrock Agent!")
        mock_runtime.invoke_agent.assert_called_once()
        
        call_kwargs = mock_runtime.invoke_agent.call_args[1]
        self.assertEqual(call_kwargs["agentId"], "flash-agent-id")
        self.assertIn("Viêm Phổi", call_kwargs["inputText"])

    def test_generating_quizz_endpoint(self):
        """Test POST /agentcore/generating-quizz"""
        mock_runtime.reset_mock()

        payload = {
            "chapter-title": "Sốc phản vệ",
            "limit": 3
        }
        response = self.client.post("/agentcore/generating-quizz", json=payload)

        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["output"], "Mocked text from Bedrock Agent!")
        mock_runtime.invoke_agent.assert_called_once()

        call_kwargs = mock_runtime.invoke_agent.call_args[1]
        self.assertEqual(call_kwargs["agentId"], "quiz-agent-id")
        self.assertIn("Sốc phản vệ", call_kwargs["inputText"])

if __name__ == "__main__":
    unittest.main()
