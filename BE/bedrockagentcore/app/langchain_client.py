import logging
import boto3
import json
import uuid
import re
from typing import Dict, Any, Optional, List
from botocore.exceptions import ClientError
from langchain_core.runnables import RunnableSerializable
try:
    from langchain_core.pydantic_v1 import Field as LCField
except ImportError:
    from pydantic import Field as LCField
from app.config import settings

logger = logging.getLogger("bedrockagentcore.langchain_client")
logger.setLevel(logging.INFO)

class BedrockAgentCoreRunnable(RunnableSerializable[Dict[str, Any], Dict[str, Any]]):
    """
    A custom LangChain Runnable that wraps the AWS Bedrock Agent Runtime.
    This allows integrating the Bedrock Agent Core seamlessly into LangChain workflows.
    """
    agent_id: str = LCField(description="The AWS Bedrock Agent ID")
    agent_alias_id: str = LCField(description="The AWS Bedrock Agent Alias ID")
    session: Any = LCField(default=None, description="boto3 session object")
    runtime_client: Any = LCField(default=None, description="boto3 Bedrock Agent Runtime client")

    def __init__(self, agent_id: str, agent_alias_id: str, session: Optional[boto3.Session] = None, **kwargs):
        super().__init__(agent_id=agent_id, agent_alias_id=agent_alias_id, **kwargs)
        self.session = session or boto3.Session()
        self.runtime_client = self.session.client("bedrock-agent-runtime")

    def _sanitize_session_id(self, session_id: str) -> str:
        """Sanitizes session ID to conform with AWS Bedrock specifications: ^[a-zA-Z0-9_:-]+$"""
        session_id_str = str(session_id)
        clean_id = re.sub(r"[^a-zA-Z0-9_:-]", "_", session_id_str)
        if len(clean_id) > 100:
            clean_id = clean_id[:100]
        elif len(clean_id) < 2:
            clean_id = f"session_{clean_id}"
        return clean_id

    def invoke(self, input: Dict[str, Any], config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Invokes the Bedrock Agent.
        
        Args:
            input: A dictionary containing:
                - "input_text": str - The user prompt
                - "session_id": str - The conversation session ID
                - "session_state": Optional[Dict] - Optional session state to pass to agent
        """
        input_text = input.get("input_text")
        session_id = input.get("session_id", "default-session")
        session_state = input.get("session_state")

        if not input_text:
            raise ValueError("Input dictionary must contain 'input_text'")

        clean_session_id = self._sanitize_session_id(session_id)
        
        try:
            logger.info(f"LangChain Runnable invoking Bedrock Agent {self.agent_id} (Session: {clean_session_id})...")
            
            params = {
                "agentId": self.agent_id,
                "agentAliasId": self.agent_alias_id,
                "sessionId": clean_session_id,
                "inputText": input_text,
                "enableTrace": True
            }
            if session_state:
                params["sessionState"] = session_state

            response = self.runtime_client.invoke_agent(**params)
            event_stream = response.get("completion")
            if not event_stream:
                raise RuntimeError("No completion event stream returned by Bedrock Agent.")

            full_text = []
            traces = []
            return_control_data = None

            for event in event_stream:
                if "chunk" in event:
                    chunk_bytes = event["chunk"].get("bytes", b"")
                    full_text.append(chunk_bytes.decode("utf-8", errors="ignore"))
                elif "trace" in event:
                    traces.append(event["trace"])
                elif "returnControl" in event:
                    logger.info("Agent requested Return Control invocation.")
                    return_control_data = event["returnControl"]

            assembled_text = "".join(full_text)
            
            result = {
                "output": assembled_text,
                "has_trace": len(traces) > 0,
                "traces_count": len(traces),
                "session_id": clean_session_id
            }

            if return_control_data:
                result["return_control"] = return_control_data

            return result

        except ClientError as e:
            logger.error(f"AWS ClientError in Bedrock Agent invocation: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error in Bedrock Agent invocation: {str(e)}")
            raise e


class BedrockAgentCoreClient:
    """
    Main manager for S3 Upload, Knowledge Base sync, and Agent invocation
    using custom LangChain runnables.
    """
    def __init__(self):
        session_kwargs = {}
        if settings.AWS_ACCESS_KEY_ID:
            session_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        if settings.AWS_SECRET_ACCESS_KEY:
            session_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        if settings.AWS_REGION:
            session_kwargs["region_name"] = settings.AWS_REGION

        self.session = boto3.Session(**session_kwargs)
        self._s3_client = None
        self._agent_client = None

    @property
    def s3_client(self):
        if self._s3_client is None:
            self._s3_client = self.session.client("s3")
        return self._s3_client

    @property
    def agent_client(self):
        if self._agent_client is None:
            self._agent_client = self.session.client("bedrock-agent")
        return self._agent_client

    def upload_to_s3_and_sync_kb(self, file_name: str, file_content: bytes, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Uploads file and its companion metadata.json to S3, and triggers Knowledge Base sync job"""
        bucket_name = settings.AWS_S3_BUCKET_NAME
        kb_id = settings.AWS_KB_ID
        ds_id = settings.AWS_KB_DATA_SOURCE_ID

        if not kb_id or not ds_id:
            logger.warning("AWS_KB_ID or AWS_KB_DATA_SOURCE_ID missing. Skipping KB sync.")
            return {
                "status": "partial_success",
                "message": "File uploaded to S3, but Knowledge Base ingestion skipped (config missing).",
                "s3_path": f"s3://{bucket_name}/{file_name}"
            }

        try:
            logger.info(f"Uploading {file_name} to S3 bucket {bucket_name}...")
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=file_name,
                Body=file_content,
                ContentType="text/markdown"
            )

            # Generate and upload companion metadata file to S3 to prevent chunking conflicts
            import os
            import datetime
            import json
            
            _, ext = os.path.splitext(file_name)
            ext_cleaned = ext.lstrip(".").lower() or "md"
            uploaded_at_iso = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
            
            metadata = {
                "metadataAttributes": {
                    "source": "book-upload-api",
                    "file_name": file_name,
                    "document_type": "book",
                    "content_type": "text/markdown",
                    "extension": ext_cleaned,
                    "file_size": len(file_content),
                    "uploaded_at": uploaded_at_iso,
                    "schema_version": "1.0",
                    "user_id": user_id or "default_user"
                }
            }
            
            metadata_bytes = json.dumps(metadata, ensure_ascii=False, indent=2).encode("utf-8")
            metadata_key = f"{file_name}.metadata.json"
            
            logger.info(f"Uploading companion metadata file {metadata_key} to S3 bucket {bucket_name}...")
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=metadata_key,
                Body=metadata_bytes,
                ContentType="application/json"
            )

            logger.info(f"Starting ingestion job for KB: {kb_id}, DS: {ds_id}...")
            try:
                response = self.agent_client.start_ingestion_job(
                    knowledgeBaseId=kb_id,
                    dataSourceId=ds_id,
                    description=f"LangChain Service: Ingestion of {file_name}"
                )
                ingestion_job = response.get("ingestionJob", {})
                return {
                    "status": "success",
                    "message": "Document uploaded and ingestion job started successfully.",
                    "s3_path": f"s3://{bucket_name}/{file_name}",
                    "ingestion_job_id": ingestion_job.get("ingestionJobId"),
                    "ingestion_job_status": ingestion_job.get("status")
                }
            except Exception as e:
                is_conflict = False
                if isinstance(e, ClientError):
                    code = e.response.get("Error", {}).get("Code", "")
                    if code == "ConflictException":
                        is_conflict = True
                if e.__class__.__name__ == "ConflictException" or "ConflictException" in str(e):
                    is_conflict = True
                
                if is_conflict:
                    logger.warning(f"Ingestion job conflict: {str(e)}. Gracefully ignoring since another sync is active.")
                    return {
                        "status": "success",
                        "message": "Document uploaded. Ingestion job is already running for this data source.",
                        "s3_path": f"s3://{bucket_name}/{file_name}",
                        "ingestion_job_id": None,
                        "ingestion_job_status": "IN_PROGRESS"
                    }
                raise e
        except ClientError as e:
            logger.error(f"AWS ClientError during upload and sync: {str(e)}")
            raise e

    def get_runnable(self, mode: str = "chat") -> BedrockAgentCoreRunnable:
        """Returns the specific LangChain BedrockAgentCoreRunnable for the given mode"""
        mode = mode.lower()
        if mode == "quiz":
            agent_id = settings.AGENTCORE_QUIZ_AGENT_ID or settings.AGENTCORE_CHAT_AGENT_ID
            alias_id = settings.AGENTCORE_QUIZ_AGENT_ALIAS_ID or settings.AGENTCORE_CHAT_AGENT_ALIAS_ID
        elif mode == "flashcard":
            agent_id = settings.AGENTCORE_FLASHCARD_AGENT_ID or settings.AGENTCORE_CHAT_AGENT_ID
            alias_id = settings.AGENTCORE_FLASHCARD_AGENT_ALIAS_ID or settings.AGENTCORE_CHAT_AGENT_ALIAS_ID
        else:
            agent_id = settings.AGENTCORE_CHAT_AGENT_ID
            alias_id = settings.AGENTCORE_CHAT_AGENT_ALIAS_ID

        if not agent_id:
            raise ValueError(f"Agent ID is not configured for mode={mode}")

        return BedrockAgentCoreRunnable(
            agent_id=agent_id,
            agent_alias_id=alias_id,
            session=self.session
        )

agent_client = BedrockAgentCoreClient()
