import uuid
from typing import Dict, Any, Optional, List
from urllib.parse import urlparse

from botocore.exceptions import ClientError, BotoCoreError

from core import (
    AI_RUNTIME,
    AGENTCORE_CHAT_AGENT_ID,
    AGENTCORE_CHAT_AGENT_ALIAS_ID,
    AGENTCORE_KNOWLEDGE_BASE_ID,
    AGENTCORE_QUIZ_AGENT_ID,
    AGENTCORE_QUIZ_AGENT_ALIAS_ID,
    AGENTCORE_FLASHCARD_AGENT_ID,
    AGENTCORE_FLASHCARD_AGENT_ALIAS_ID,
)
from services.bedrock_provider import (
    BedrockProvider,
)
from agentcore.client import agent_client


class AgentCoreRuntimeError(Exception):
    pass


class AgentCoreAccessError(AgentCoreRuntimeError):
    pass


class AgentCoreThrottlingError(AgentCoreRuntimeError):
    pass


class AgentCoreValidationError(AgentCoreRuntimeError):
    pass


class NotebookChatRuntime:
    def converse(
        self,
        user_message: str,
        notebook_id: uuid.UUID,
        context_text: str,
        conversation_history: Optional[List[Dict[str, str]]],
        action_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        raise NotImplementedError


class BedrockFallbackNotebookChatRuntime(NotebookChatRuntime):
    def __init__(self) -> None:
        self.provider = BedrockProvider()

    def converse(
        self,
        user_message: str,
        notebook_id: uuid.UUID,
        context_text: str,
        conversation_history: Optional[List[Dict[str, str]]],
        action_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        system_prompt = f"""You are a helpful AI assistant for a notebook workspace.
The user has attached source documents to their notebook. Use the following source content to answer their questions accurately.

Source Context:
{context_text}

Instructions:
- Answer based on the provided source content
- Be concise and helpful
- If the answer is not in the sources, say so clearly"""
        return self.provider.converse(
            user_message=user_message,
            system_prompt=system_prompt,
            conversation_history=conversation_history,
        )


class AgentCoreNotebookChatRuntime(NotebookChatRuntime):
    def _filename_from_s3_uri(self, s3_uri: str) -> str:
        if not s3_uri:
            return ""
        parsed = urlparse(s3_uri)
        return parsed.path.rsplit("/", 1)[-1] if parsed.path else ""

    def _build_notebook_kb_session_state(self, notebook_id: uuid.UUID) -> Dict[str, Any]:
        if not AGENTCORE_KNOWLEDGE_BASE_ID:
            return {}
        return {
            "knowledgeBaseConfigurations": [
                {
                    "knowledgeBaseId": AGENTCORE_KNOWLEDGE_BASE_ID,
                    "retrievalConfiguration": {
                        "vectorSearchConfiguration": {
                            "numberOfResults": 8,
                            "filter": {
                                "equals": {
                                    "key": "notebook_id",
                                    "value": str(notebook_id),
                                }
                            },
                        }
                    },
                }
            ]
        }

    def _normalize_citations(self, raw_citations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        citations = []
        seen = set()
        for citation in raw_citations or []:
            response_part = (
                citation.get("generatedResponsePart", {})
                .get("textResponsePart", {})
            )
            for ref in citation.get("retrievedReferences", []) or []:
                metadata = ref.get("metadata", {}) or {}
                location = ref.get("location", {}) or {}
                s3_uri = (
                    location.get("s3Location", {}).get("uri", "")
                    or metadata.get("x-amz-bedrock-kb-source-uri", "")
                    or metadata.get("source_uri", "")
                )
                content_text = ref.get("content", {}).get("text", "") or ""
                source_id = metadata.get("notebook_source_id") or metadata.get("book_id") or s3_uri
                file_name = metadata.get("file_name", "") or self._filename_from_s3_uri(s3_uri)
                key = (
                    source_id,
                    s3_uri,
                    content_text[:120],
                )
                if key in seen:
                    continue
                seen.add(key)
                citations.append(
                    {
                        "text": response_part.get("text", ""),
                        "source_text": content_text[:500],
                        "book_id": metadata.get("book_id", ""),
                        "book_title": metadata.get("book_title", ""),
                        "file_name": file_name,
                        "source_id": source_id,
                        "s3_uri": s3_uri,
                        "metadata": metadata,
                        "span": response_part.get("span", {}),
                    }
                )
        return citations

    def converse(
        self,
        user_message: str,
        notebook_id: uuid.UUID,
        context_text: str,
        conversation_history: Optional[List[Dict[str, str]]],
        action_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        mode = (action_type or "chat").lower()
        if mode == "quiz":
            agent_id = AGENTCORE_QUIZ_AGENT_ID or AGENTCORE_CHAT_AGENT_ID
            alias_id = AGENTCORE_QUIZ_AGENT_ALIAS_ID or AGENTCORE_CHAT_AGENT_ALIAS_ID
        elif mode == "flashcard":
            agent_id = AGENTCORE_FLASHCARD_AGENT_ID or AGENTCORE_CHAT_AGENT_ID
            alias_id = AGENTCORE_FLASHCARD_AGENT_ALIAS_ID or AGENTCORE_CHAT_AGENT_ALIAS_ID
        else:
            agent_id = AGENTCORE_CHAT_AGENT_ID
            alias_id = AGENTCORE_CHAT_AGENT_ALIAS_ID

        if not agent_id:
            raise AgentCoreValidationError(f"Agent Core agent id is not configured for mode={mode}")
        if not alias_id:
            raise AgentCoreValidationError(f"Agent Core alias id is not configured for mode={mode}")

        history_text = ""
        if conversation_history:
            history_lines = [
                f"{item.get('role', 'user')}: {item.get('content', '')}"
                for item in conversation_history
                if item.get("content")
            ]
            history_text = "\n".join(history_lines)

        prompt = (
            f"Notebook ID: {notebook_id}\n"
            f"Knowledge Base ID: {AGENTCORE_KNOWLEDGE_BASE_ID}\n"
            f"Conversation History:\n{history_text}\n\n"
            f"Question:\n{user_message}"
        )
        if not history_text:
            prompt = (
                f"Notebook ID: {notebook_id}\n"
                f"Knowledge Base ID: {AGENTCORE_KNOWLEDGE_BASE_ID}\n\n"
                f"Question:\n{user_message}"
            )

        try:
            agent_response = agent_client.invoke_bedrock_agent(
                agent_id=agent_id,
                agent_alias_id=alias_id,
                session_id=str(notebook_id),
                input_text=prompt,
                session_state=self._build_notebook_kb_session_state(notebook_id),
            )
            return {
                "answer_text": agent_response.get("output", ""),
                "citations": self._normalize_citations(agent_response.get("citations", [])),
                "provider_metadata": {
                    "runtime": "agentcore",
                    "action_type": mode,
                    "agent_id": agent_id,
                    "agent_alias_id": alias_id,
                    "knowledge_base_id": AGENTCORE_KNOWLEDGE_BASE_ID,
                    "has_trace": agent_response.get("has_trace", False),
                    "traces_count": agent_response.get("traces_count", 0),
                },
                "stop_reason": "agentcore_completed",
            }
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            message = exc.response.get("Error", {}).get("Message", str(exc))
            if code == "AccessDeniedException":
                raise AgentCoreAccessError(message) from exc
            if code in {"ThrottlingException", "TooManyRequestsException"}:
                raise AgentCoreThrottlingError(message) from exc
            if code == "ValidationException":
                raise AgentCoreValidationError(message) from exc
            raise AgentCoreRuntimeError(message) from exc
        except BotoCoreError as exc:
            raise AgentCoreRuntimeError(str(exc)) from exc
        except Exception as exc:
            if isinstance(exc, AgentCoreRuntimeError):
                raise
            raise AgentCoreRuntimeError(str(exc)) from exc


def get_notebook_chat_runtime() -> NotebookChatRuntime:
    if AI_RUNTIME.lower() == "agentcore":
        return AgentCoreNotebookChatRuntime()
    return BedrockFallbackNotebookChatRuntime()
