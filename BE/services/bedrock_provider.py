import boto3
from botocore.exceptions import ClientError, BotoCoreError
from typing import Optional, Dict, Any, List
from core import (
    BEDROCK_REGION,
    BEDROCK_MODEL_ID,
    BEDROCK_MAX_TOKENS,
    BEDROCK_TEMPERATURE,
    BEDROCK_TOP_P,
)


class BedrockProviderError(Exception):
    """Base exception for Bedrock provider errors"""
    pass


class BedrockAccessError(BedrockProviderError):
    """Raised when Bedrock access is denied or model is not available"""
    pass


class BedrockThrottlingError(BedrockProviderError):
    """Raised when Bedrock request is throttled"""
    pass


class BedrockValidationError(BedrockProviderError):
    """Raised when request validation fails"""
    pass


class BedrockProvider:
    """
    Amazon Bedrock Runtime provider for notebook chat.
    Uses the Converse API for consistent message interface across models.
    """

    def __init__(
        self,
        region: Optional[str] = None,
        model_id: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
    ):
        """
        Initialize Bedrock provider with configuration.

        Args:
            region: AWS region for Bedrock (defaults to config)
            model_id: Bedrock model ID (defaults to config)
            max_tokens: Max tokens for generation (defaults to config)
            temperature: Temperature for generation (defaults to config)
            top_p: Top-p for generation (defaults to config)
        """
        self.region = region or BEDROCK_REGION
        self.model_id = model_id or BEDROCK_MODEL_ID
        self.max_tokens = max_tokens or BEDROCK_MAX_TOKENS
        self.temperature = temperature or BEDROCK_TEMPERATURE
        self.top_p = top_p or BEDROCK_TOP_P

        self.client = boto3.client("bedrock-runtime", region_name=self.region)

    def converse(
        self,
        user_message: str,
        system_prompt: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Invoke Bedrock Converse API with user message and optional context.

        Args:
            user_message: The user's message text
            system_prompt: Optional system instructions
            conversation_history: Optional list of prior messages [{"role": "user"|"assistant", "content": "..."}]

        Returns:
            Normalized response dict with:
                - answer_text: str - The generated answer
                - provider_metadata: dict - Model info and usage stats
                - stop_reason: str - Why generation stopped

        Raises:
            BedrockAccessError: Access denied or model not available
            BedrockThrottlingError: Request throttled
            BedrockValidationError: Invalid request parameters
            BedrockProviderError: Other provider errors
        """
        messages = []

        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg["role"],
                    "content": [{"text": msg["content"]}]
                })

        messages.append({
            "role": "user",
            "content": [{"text": user_message}]
        })

        request_params = {
            "modelId": self.model_id,
            "messages": messages,
            "inferenceConfig": {
                "maxTokens": self.max_tokens,
                "temperature": self.temperature,
                "topP": self.top_p,
            }
        }

        if system_prompt:
            request_params["system"] = [{"text": system_prompt}]

        try:
            response = self.client.converse(**request_params)
            return self._normalize_response(response)

        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            error_message = e.response.get("Error", {}).get("Message", str(e))

            if error_code in ("AccessDeniedException", "ResourceNotFoundException"):
                raise BedrockAccessError(
                    f"Bedrock access error: {error_message}. "
                    "Check model access and IAM permissions."
                ) from e
            elif error_code in ("ThrottlingException", "TooManyRequestsException"):
                raise BedrockThrottlingError(
                    f"Bedrock throttling: {error_message}"
                ) from e
            elif error_code == "ValidationException":
                raise BedrockValidationError(
                    f"Bedrock validation error: {error_message}"
                ) from e
            else:
                raise BedrockProviderError(
                    f"Bedrock service error: {error_message}"
                ) from e

        except BotoCoreError as e:
            raise BedrockProviderError(
                f"Bedrock SDK error: {str(e)}"
            ) from e

        except Exception as e:
            raise BedrockProviderError(
                f"Unexpected error calling Bedrock: {str(e)}"
            ) from e

    def _normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize Bedrock converse response into stable output shape.

        Args:
            response: Raw response from bedrock-runtime converse API

        Returns:
            Normalized dict with answer_text, provider_metadata, stop_reason
        """
        output = response.get("output", {})
        message = output.get("message", {})
        content_blocks = message.get("content", [])

        answer_text = ""
        if content_blocks:
            answer_text = content_blocks[0].get("text", "")

        usage = response.get("usage", {})
        metrics = response.get("metrics", {})

        return {
            "answer_text": answer_text,
            "provider_metadata": {
                "model_id": self.model_id,
                "input_tokens": usage.get("inputTokens", 0),
                "output_tokens": usage.get("outputTokens", 0),
                "total_tokens": usage.get("totalTokens", 0),
                "latency_ms": metrics.get("latencyMs", 0),
            },
            "stop_reason": response.get("stopReason", "unknown"),
        }
