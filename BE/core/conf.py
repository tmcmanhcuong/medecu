import os
from dotenv import load_dotenv

load_dotenv(".env")

DATABASE_URL: str = os.getenv("DATABASE_URL", "")
MARKER_URL: str = os.getenv("MARKER_URL", "http://localhost:8001/marker")
BOOK_ENTITIES_INDEX_PATH: str = os.getenv(
    "BOOK_ENTITIES_INDEX_PATH", "./book_entities_indexes"
)
MARKDOWN_PATH: str = os.getenv("MARKDOWN_PATH", "./cache/markdown_indexes")
QUIZZ_PATH: str = os.getenv("QUIZZ_PATH", "./cache/quizz_indexes")
FILE_STORAGE_MODE: str = os.getenv("FILE_STORAGE_MODE", "local")
DOCUMENT_UPLOAD_DIR: str = os.getenv("DOCUMENT_UPLOAD_DIR", "./cache/documents")
EXTRACTION_MODE: str = os.getenv("EXTRACTION_MODE", "local")
EXTRACTION_SERVICE_URL: str = os.getenv("EXTRACTION_SERVICE_URL", MARKER_URL)
APP_ENV: str = os.getenv("APP_ENV", "development")
FLASH_PATH: str = os.getenv("FLASH_PATH", "./cache/flash_indexes")
# UPLOAD_BOOK_CONTENT_TO_RAG = os.getenv("UPLOAD_BOOK_CONTENT_TO_RAG", "true")
ADMIN_ID = os.getenv("ADMIN_ID", "admin-uuid-placeholder")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")

# AI Provider Configuration
AI_PROVIDER: str = os.getenv("AI_PROVIDER", "n8n")
AI_RUNTIME: str = os.getenv("AI_RUNTIME", "bedrock_provider")
AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
BEDROCK_REGION: str = os.getenv("BEDROCK_REGION", AWS_REGION)
BEDROCK_MODEL_ID: str = os.getenv("BEDROCK_MODEL_ID", "amazon.nova-micro-v1:0")
BEDROCK_MAX_TOKENS: int = int(os.getenv("BEDROCK_MAX_TOKENS", "2048"))
BEDROCK_TEMPERATURE: float = float(os.getenv("BEDROCK_TEMPERATURE", "0.7"))
BEDROCK_TOP_P: float = float(os.getenv("BEDROCK_TOP_P", "0.9"))
BEDROCK_CONTEXT_CHAR_LIMIT: int = int(os.getenv("BEDROCK_CONTEXT_CHAR_LIMIT", "50000"))
AGENTCORE_CHAT_AGENT_ID: str = os.getenv("AGENTCORE_CHAT_AGENT_ID", "")
AGENTCORE_CHAT_AGENT_ALIAS_ID: str = os.getenv("AGENTCORE_CHAT_AGENT_ALIAS_ID", "TSTALIASID")
AGENTCORE_KNOWLEDGE_BASE_ID: str = os.getenv("AGENTCORE_KNOWLEDGE_BASE_ID", "")
AGENTCORE_QUIZ_AGENT_ID: str = os.getenv("AGENTCORE_QUIZ_AGENT_ID", "")
AGENTCORE_QUIZ_AGENT_ALIAS_ID: str = os.getenv("AGENTCORE_QUIZ_AGENT_ALIAS_ID", "TSTALIASID")
AGENTCORE_FLASHCARD_AGENT_ID: str = os.getenv("AGENTCORE_FLASHCARD_AGENT_ID", "")
AGENTCORE_FLASHCARD_AGENT_ALIAS_ID: str = os.getenv("AGENTCORE_FLASHCARD_AGENT_ALIAS_ID", "TSTALIASID")
AGENTCORE_REQUIRE_INGESTION_READY: bool = os.getenv(
    "AGENTCORE_REQUIRE_INGESTION_READY", "true"
).lower() in {"1", "true", "yes", "on"}


def validate_ai_runtime_config() -> None:
    runtime = AI_RUNTIME.lower()
    if runtime not in {"bedrock_provider", "agentcore"}:
        raise RuntimeError("Invalid AI_RUNTIME. Allowed values: bedrock_provider, agentcore")

    if runtime != "agentcore":
        return

    if not AGENTCORE_CHAT_AGENT_ID:
        raise RuntimeError("Missing required config: AGENTCORE_CHAT_AGENT_ID")
    if not AGENTCORE_CHAT_AGENT_ALIAS_ID:
        raise RuntimeError("Missing required config: AGENTCORE_CHAT_AGENT_ALIAS_ID")
    if not AGENTCORE_KNOWLEDGE_BASE_ID:
        raise RuntimeError("Missing required config: AGENTCORE_KNOWLEDGE_BASE_ID")

if APP_ENV.lower() not in {"dev", "development", "local", "test"}:
    if FILE_STORAGE_MODE == "s3":
        if not os.getenv("S3_BUCKET_NAME"):
            raise RuntimeError("Missing required config: S3_BUCKET_NAME")
    elif not DOCUMENT_UPLOAD_DIR:
        raise RuntimeError("Missing required config: DOCUMENT_UPLOAD_DIR")

    if EXTRACTION_MODE in {"remote", "service"} and not EXTRACTION_SERVICE_URL:
        raise RuntimeError("Missing required config: EXTRACTION_SERVICE_URL")

    if AI_PROVIDER == "bedrock":
        if not os.getenv("BEDROCK_REGION") and not os.getenv("AWS_REGION"):
            raise RuntimeError("Missing required config: BEDROCK_REGION or AWS_REGION")
        if not os.getenv("BEDROCK_MODEL_ID"):
            raise RuntimeError("Missing required config: BEDROCK_MODEL_ID")
