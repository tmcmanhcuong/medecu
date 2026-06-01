import pytest
from unittest.mock import patch
from botocore.exceptions import ClientError, BotoCoreError
from services.bedrock_provider import (
    BedrockProvider,
    BedrockAccessError,
    BedrockThrottlingError,
    BedrockValidationError,
    BedrockProviderError,
)


@pytest.fixture
def mock_bedrock_client():
    """Fixture for mocked boto3 bedrock-runtime client"""
    with patch("services.bedrock_provider.boto3.client") as mock_client:
        yield mock_client.return_value


@pytest.fixture
def provider(mock_bedrock_client):
    """Fixture for BedrockProvider instance with mocked client"""
    return BedrockProvider(
        region="us-east-1",
        model_id="amazon.nova-micro-v1:0",
        max_tokens=2048,
        temperature=0.7,
        top_p=0.9,
    )


class TestBedrockProviderSuccess:
    """Test successful Bedrock provider operations"""

    def test_converse_success(self, provider, mock_bedrock_client):
        """Test successful converse call returns normalized response"""
        mock_response = {
            "output": {
                "message": {
                    "role": "assistant",
                    "content": [{"text": "This is the answer from Bedrock."}],
                }
            },
            "stopReason": "end_turn",
            "usage": {
                "inputTokens": 50,
                "outputTokens": 20,
                "totalTokens": 70,
            },
            "metrics": {"latencyMs": 1234},
        }
        mock_bedrock_client.converse.return_value = mock_response

        result = provider.converse(user_message="What is AI?")

        assert result["answer_text"] == "This is the answer from Bedrock."
        assert result["stop_reason"] == "end_turn"
        assert result["provider_metadata"]["model_id"] == "amazon.nova-micro-v1:0"
        assert result["provider_metadata"]["input_tokens"] == 50
        assert result["provider_metadata"]["output_tokens"] == 20
        assert result["provider_metadata"]["total_tokens"] == 70
        assert result["provider_metadata"]["latency_ms"] == 1234

    def test_converse_with_system_prompt(self, provider, mock_bedrock_client):
        """Test converse call with system prompt"""
        mock_response = {
            "output": {
                "message": {
                    "role": "assistant",
                    "content": [{"text": "Answer with context."}],
                }
            },
            "stopReason": "end_turn",
            "usage": {"inputTokens": 100, "outputTokens": 30, "totalTokens": 130},
            "metrics": {"latencyMs": 2000},
        }
        mock_bedrock_client.converse.return_value = mock_response

        result = provider.converse(
            user_message="Explain this concept",
            system_prompt="You are a helpful tutor.",
        )

        assert result["answer_text"] == "Answer with context."
        mock_bedrock_client.converse.assert_called_once()
        call_args = mock_bedrock_client.converse.call_args[1]
        assert "system" in call_args
        assert call_args["system"] == [{"text": "You are a helpful tutor."}]

    def test_converse_with_conversation_history(self, provider, mock_bedrock_client):
        """Test converse call with conversation history"""
        mock_response = {
            "output": {
                "message": {
                    "role": "assistant",
                    "content": [{"text": "Follow-up answer."}],
                }
            },
            "stopReason": "end_turn",
            "usage": {"inputTokens": 150, "outputTokens": 40, "totalTokens": 190},
            "metrics": {"latencyMs": 1500},
        }
        mock_bedrock_client.converse.return_value = mock_response

        history = [
            {"role": "user", "content": "First question"},
            {"role": "assistant", "content": "First answer"},
        ]

        result = provider.converse(
            user_message="Follow-up question", conversation_history=history
        )

        assert result["answer_text"] == "Follow-up answer."
        call_args = mock_bedrock_client.converse.call_args[1]
        assert len(call_args["messages"]) == 3


class TestBedrockProviderErrors:
    """Test Bedrock provider error handling"""

    def test_access_denied_error(self, provider, mock_bedrock_client):
        """Test AccessDeniedException is converted to BedrockAccessError"""
        error_response = {
            "Error": {
                "Code": "AccessDeniedException",
                "Message": "User is not authorized to perform: bedrock:InvokeModel",
            }
        }
        mock_bedrock_client.converse.side_effect = ClientError(
            error_response, "converse"
        )

        with pytest.raises(BedrockAccessError) as exc_info:
            provider.converse(user_message="Test")

        assert "Bedrock access error" in str(exc_info.value)
        assert "IAM permissions" in str(exc_info.value)

    def test_resource_not_found_error(self, provider, mock_bedrock_client):
        """Test ResourceNotFoundException is converted to BedrockAccessError"""
        error_response = {
            "Error": {
                "Code": "ResourceNotFoundException",
                "Message": "Model not found",
            }
        }
        mock_bedrock_client.converse.side_effect = ClientError(
            error_response, "converse"
        )

        with pytest.raises(BedrockAccessError) as exc_info:
            provider.converse(user_message="Test")

        assert "Bedrock access error" in str(exc_info.value)

    def test_throttling_error(self, provider, mock_bedrock_client):
        """Test ThrottlingException is converted to BedrockThrottlingError"""
        error_response = {
            "Error": {
                "Code": "ThrottlingException",
                "Message": "Rate exceeded",
            }
        }
        mock_bedrock_client.converse.side_effect = ClientError(
            error_response, "converse"
        )

        with pytest.raises(BedrockThrottlingError) as exc_info:
            provider.converse(user_message="Test")

        assert "Bedrock throttling" in str(exc_info.value)

    def test_validation_error(self, provider, mock_bedrock_client):
        """Test ValidationException is converted to BedrockValidationError"""
        error_response = {
            "Error": {
                "Code": "ValidationException",
                "Message": "Invalid parameter",
            }
        }
        mock_bedrock_client.converse.side_effect = ClientError(
            error_response, "converse"
        )

        with pytest.raises(BedrockValidationError) as exc_info:
            provider.converse(user_message="Test")

        assert "Bedrock validation error" in str(exc_info.value)

    def test_generic_client_error(self, provider, mock_bedrock_client):
        """Test generic ClientError is converted to BedrockProviderError"""
        error_response = {
            "Error": {
                "Code": "InternalServerError",
                "Message": "Service error",
            }
        }
        mock_bedrock_client.converse.side_effect = ClientError(
            error_response, "converse"
        )

        with pytest.raises(BedrockProviderError) as exc_info:
            provider.converse(user_message="Test")

        assert "Bedrock service error" in str(exc_info.value)

    def test_botocore_error(self, provider, mock_bedrock_client):
        """Test BotoCoreError is converted to BedrockProviderError"""
        mock_bedrock_client.converse.side_effect = BotoCoreError()

        with pytest.raises(BedrockProviderError) as exc_info:
            provider.converse(user_message="Test")

        assert "Bedrock SDK error" in str(exc_info.value)

    def test_unexpected_error(self, provider, mock_bedrock_client):
        """Test unexpected exceptions are converted to BedrockProviderError"""
        mock_bedrock_client.converse.side_effect = RuntimeError("Unexpected error")

        with pytest.raises(BedrockProviderError) as exc_info:
            provider.converse(user_message="Test")

        assert "Unexpected error calling Bedrock" in str(exc_info.value)


class TestBedrockProviderNormalization:
    """Test response normalization"""

    def test_normalize_empty_content(self, provider, mock_bedrock_client):
        """Test normalization handles empty content gracefully"""
        mock_response = {
            "output": {"message": {"role": "assistant", "content": []}},
            "stopReason": "end_turn",
            "usage": {"inputTokens": 10, "outputTokens": 0, "totalTokens": 10},
            "metrics": {"latencyMs": 500},
        }
        mock_bedrock_client.converse.return_value = mock_response

        result = provider.converse(user_message="Test")

        assert result["answer_text"] == ""
        assert result["stop_reason"] == "end_turn"

    def test_normalize_missing_usage(self, provider, mock_bedrock_client):
        """Test normalization handles missing usage data"""
        mock_response = {
            "output": {
                "message": {
                    "role": "assistant",
                    "content": [{"text": "Answer"}],
                }
            },
            "stopReason": "end_turn",
        }
        mock_bedrock_client.converse.return_value = mock_response

        result = provider.converse(user_message="Test")

        assert result["answer_text"] == "Answer"
        assert result["provider_metadata"]["input_tokens"] == 0
        assert result["provider_metadata"]["output_tokens"] == 0
        assert result["provider_metadata"]["total_tokens"] == 0
        assert result["provider_metadata"]["latency_ms"] == 0

    def test_normalize_missing_stop_reason(self, provider, mock_bedrock_client):
        """Test normalization handles missing stop reason"""
        mock_response = {
            "output": {
                "message": {
                    "role": "assistant",
                    "content": [{"text": "Answer"}],
                }
            },
            "usage": {"inputTokens": 10, "outputTokens": 5, "totalTokens": 15},
            "metrics": {"latencyMs": 1000},
        }
        mock_bedrock_client.converse.return_value = mock_response

        result = provider.converse(user_message="Test")

        assert result["answer_text"] == "Answer"
        assert result["stop_reason"] == "unknown"
