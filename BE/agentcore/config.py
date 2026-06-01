import os
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class Settings:
    # AWS Credentials
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")

    # AWS S3 and Knowledge Base configuration
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME", "mededu-rag-content")
    AWS_KB_ID: str = os.getenv("AWS_KB_ID", "")
    AWS_KB_DATA_SOURCE_ID: str = os.getenv("AWS_KB_DATA_SOURCE_ID", "")

    # Bedrock Agents configuration
    # 1. Chat with RAG Agent
    AWS_AGENT_ID_CHAT: str = os.getenv("AGENTCORE_CHAT_AGENT_ID", os.getenv("AWS_AGENT_ID_CHAT", ""))
    AWS_AGENT_ALIAS_ID_CHAT: str = os.getenv(
        "AGENTCORE_CHAT_AGENT_ALIAS_ID",
        os.getenv("AWS_AGENT_ALIAS_ID_CHAT", "TSTALIASID"),
    ) # TSTALIASID is standard draft alias in AWS

    # 2. Flashcard Generator Agent
    AWS_AGENT_ID_FLASHCARD: str = os.getenv(
        "AGENTCORE_FLASHCARD_AGENT_ID",
        os.getenv("AWS_AGENT_ID_FLASHCARD", ""),
    )
    AWS_AGENT_ALIAS_ID_FLASHCARD: str = os.getenv(
        "AGENTCORE_FLASHCARD_AGENT_ALIAS_ID",
        os.getenv("AWS_AGENT_ALIAS_ID_FLASHCARD", "TSTALIASID"),
    )

    # 3. Quiz Generator Agent
    AWS_AGENT_ID_QUIZ: str = os.getenv(
        "AGENTCORE_QUIZ_AGENT_ID",
        os.getenv("AWS_AGENT_ID_QUIZ", ""),
    )
    AWS_AGENT_ALIAS_ID_QUIZ: str = os.getenv(
        "AGENTCORE_QUIZ_AGENT_ALIAS_ID",
        os.getenv("AWS_AGENT_ALIAS_ID_QUIZ", "TSTALIASID"),
    )

settings = Settings()
