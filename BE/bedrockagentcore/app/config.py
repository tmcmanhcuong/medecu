import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # AWS Credentials
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"

    # S3 & Knowledge Base Configs
    AWS_S3_BUCKET_NAME: str = "mededu-rag-content"
    AWS_KB_ID: str = ""
    AWS_KB_DATA_SOURCE_ID: str = ""

    # Bedrock Agent IDs & Aliases
    AGENTCORE_CHAT_AGENT_ID: str = ""
    AGENTCORE_CHAT_AGENT_ALIAS_ID: str = "TSTALIASID"

    AGENTCORE_FLASHCARD_AGENT_ID: str = ""
    AGENTCORE_FLASHCARD_AGENT_ALIAS_ID: str = "TSTALIASID"

    AGENTCORE_QUIZ_AGENT_ID: str = ""
    AGENTCORE_QUIZ_AGENT_ALIAS_ID: str = "TSTALIASID"

    # Local Cache Path for files inside the container
    FLASH_PATH: str = "/app/cache/flash_indexes"
    QUIZZ_PATH: str = "/app/cache/quizz_indexes"

    # Load configuration from .env file at the workspace root or local config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
