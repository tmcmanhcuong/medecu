import json
import logging
import boto3
from botocore.exceptions import ClientError
from typing import Dict, Any, Optional
from agentcore.config import settings

logger = logging.getLogger("agentcore.client")
logger.setLevel(logging.INFO)

class BedrockAgentCoreClient:
    def __init__(self):
        # Configure AWS session
        # If credentials are explicitly provided in settings, use them; otherwise, let boto3 find them via defaults.
        session_kwargs = {}
        if settings.AWS_ACCESS_KEY_ID:
            session_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        if settings.AWS_SECRET_ACCESS_KEY:
            session_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        if settings.AWS_REGION:
            session_kwargs["region_name"] = settings.AWS_REGION

        self.session = boto3.Session(**session_kwargs)
        
        # Initialize clients lazily to prevent failure during server startup if AWS is not configured
        self._s3_client = None
        self._agent_client = None
        self._runtime_client = None

    @property
    def s3_client(self):
        if self._s3_client is None:
            self._s3_client = self.session.client("s3")
        return self._s3_client

    @property
    def agent_client(self):
        if self._agent_client is None:
            # bedrock-agent handles agent setup, action groups, knowledge bases, and sync
            self._agent_client = self.session.client("bedrock-agent")
        return self._agent_client

    @property
    def runtime_client(self):
        if self._runtime_client is None:
            # bedrock-agent-runtime handles runtime agent invocations (invoke_agent)
            self._runtime_client = self.session.client("bedrock-agent-runtime")
        return self._runtime_client

    def upload_to_s3_and_sync_kb(self, file_name: str, file_content: bytes, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Uploads document content (like output.md) and its companion metadata.json to the RAG S3 bucket,
        then starts an ingestion/sync job on the Bedrock Knowledge Base.
        """
        bucket_name = settings.AWS_S3_BUCKET_NAME
        kb_id = settings.AWS_KB_ID
        ds_id = settings.AWS_KB_DATA_SOURCE_ID

        if not kb_id or not ds_id:
            logger.warning("AWS_KB_ID or AWS_KB_DATA_SOURCE_ID is missing. Skipping Knowledge Base sync.")
            return {
                "status": "partial_success",
                "message": "File uploaded to S3, but Knowledge Base ingestion skipped (KB_ID or DATA_SOURCE_ID not set).",
                "s3_path": f"s3://{bucket_name}/{file_name}"
            }

        try:
            # 1. Upload file to S3
            logger.info(f"Uploading {file_name} to S3 bucket {bucket_name}...")
            self.s3_client.put_object(
                Bucket=bucket_name,
                Key=file_name,
                Body=file_content,
                ContentType="text/markdown"
            )
            
            # 1.1 Generate and upload companion metadata file to S3 to prevent chunking conflicts
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
            
            # 2. Trigger Ingestion/Sync Job in Bedrock
            logger.info(f"Starting ingestion job for KB: {kb_id}, DS: {ds_id}...")
            try:
                response = self.agent_client.start_ingestion_job(
                    knowledgeBaseId=kb_id,
                    dataSourceId=ds_id,
                    description=f"Automated ingestion of {file_name} via MedEdu backend"
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
        except Exception as e:
            logger.error(f"Unexpected error during upload and sync: {str(e)}")
            raise e

    def start_kb_ingestion_job(self) -> Dict[str, Any]:
        kb_id = settings.AWS_KB_ID
        ds_id = settings.AWS_KB_DATA_SOURCE_ID
        if not kb_id or not ds_id:
            raise ValueError("AWS_KB_ID and AWS_KB_DATA_SOURCE_ID must be configured.")
        try:
            response = self.agent_client.start_ingestion_job(
                knowledgeBaseId=kb_id,
                dataSourceId=ds_id,
                description="Automated ingestion for notebook source"
            )
            ingestion_job = response.get("ingestionJob", {})
            return {
                "status": "success",
                "ingestion_job_id": ingestion_job.get("ingestionJobId"),
                "ingestion_job_status": ingestion_job.get("status"),
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
                logger.warning(f"Ingestion job conflict in start_kb_ingestion_job: {str(e)}. Gracefully ignoring.")
                return {
                    "status": "success",
                    "ingestion_job_id": None,
                    "ingestion_job_status": "IN_PROGRESS",
                    "message": "Sync is already in progress."
                }
            raise e

    def get_kb_ingestion_job(self, ingestion_job_id: str) -> Dict[str, Any]:
        kb_id = settings.AWS_KB_ID
        ds_id = settings.AWS_KB_DATA_SOURCE_ID
        if not kb_id or not ds_id:
            raise ValueError("AWS_KB_ID and AWS_KB_DATA_SOURCE_ID must be configured.")
        response = self.agent_client.get_ingestion_job(
            knowledgeBaseId=kb_id,
            dataSourceId=ds_id,
            ingestionJobId=ingestion_job_id,
        )
        ingestion_job = response.get("ingestionJob", {})
        return {
            "ingestion_job_id": ingestion_job.get("ingestionJobId"),
            "ingestion_job_status": ingestion_job.get("status"),
            "failure_reasons": ingestion_job.get("failureReasons", []),
        }

    def _upload_bedrock_metadata(self, object_key: str, metadata_attributes: Dict[str, Any]) -> None:
        metadata = {
            "metadataAttributes": {
                key: str(value) for key, value in metadata_attributes.items() if value is not None
            }
        }
        self.s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=f"{object_key}.metadata.json",
            Body=json.dumps(metadata, ensure_ascii=False, indent=2).encode("utf-8"),
            ContentType="application/json",
        )

    def _start_source_ingestion(self, object_key: str) -> Dict[str, Any]:
        kb_id = settings.AWS_KB_ID
        ds_id = settings.AWS_KB_DATA_SOURCE_ID
        try:
            response = self.agent_client.start_ingestion_job(
                knowledgeBaseId=kb_id,
                dataSourceId=ds_id,
                description=f"Automated ingestion of {object_key} via MedEdu backend",
            )
            ingestion_job = response.get("ingestionJob", {})
            return {
                "status": "success",
                "s3_path": f"s3://{settings.AWS_S3_BUCKET_NAME}/{object_key}",
                "ingestion_job_id": ingestion_job.get("ingestionJobId"),
                "ingestion_job_status": ingestion_job.get("status"),
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
                logger.warning(f"Ingestion job conflict in _start_source_ingestion: {str(e)}. Gracefully ignoring.")
                return {
                    "status": "success",
                    "s3_path": f"s3://{settings.AWS_S3_BUCKET_NAME}/{object_key}",
                    "ingestion_job_id": None,
                    "ingestion_job_status": "IN_PROGRESS",
                    "message": "Source document uploaded. Sync is already in progress."
                }
            raise e

    def upload_source_to_s3_and_sync_kb(
        self,
        object_key: str,
        file_content: bytes,
        content_type: str,
        metadata_attributes: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        bucket_name = settings.AWS_S3_BUCKET_NAME
        kb_id = settings.AWS_KB_ID
        ds_id = settings.AWS_KB_DATA_SOURCE_ID

        if not bucket_name:
            raise ValueError("AWS_S3_BUCKET_NAME must be configured.")
        if not kb_id or not ds_id:
            raise ValueError("AWS_KB_ID and AWS_KB_DATA_SOURCE_ID must be configured.")

        self.s3_client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=file_content,
            ContentType=content_type or "application/octet-stream",
        )

        if metadata_attributes:
            self._upload_bedrock_metadata(object_key, metadata_attributes)

        return self._start_source_ingestion(object_key)

    def copy_source_to_s3_and_sync_kb(
        self,
        source_bucket: str,
        source_key: str,
        target_key: str,
        metadata_attributes: Dict[str, Any],
    ) -> Dict[str, Any]:
        bucket_name = settings.AWS_S3_BUCKET_NAME
        kb_id = settings.AWS_KB_ID
        ds_id = settings.AWS_KB_DATA_SOURCE_ID

        if not bucket_name:
            raise ValueError("AWS_S3_BUCKET_NAME must be configured.")
        if not kb_id or not ds_id:
            raise ValueError("AWS_KB_ID and AWS_KB_DATA_SOURCE_ID must be configured.")

        if source_bucket == bucket_name and source_key == target_key:
            self.s3_client.head_object(Bucket=bucket_name, Key=target_key)
        else:
            self.s3_client.copy_object(
                Bucket=bucket_name,
                Key=target_key,
                CopySource={"Bucket": source_bucket, "Key": source_key},
            )

        self._upload_bedrock_metadata(target_key, metadata_attributes)
        return self._start_source_ingestion(target_key)

    def invoke_bedrock_agent(
        self,
        agent_id: str,
        agent_alias_id: str,
        session_id: str,
        input_text: str,
        session_state: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Invokes an AWS Bedrock Agent using the bedrock-agent-runtime client.
        Iterates over the EventStream completion response, assembling the output.
        """
        if not agent_id:
            raise ValueError("Agent ID must be configured in settings/environment variables.")

        # Ensure session_id is a string
        session_id_str = str(session_id)

        # Sanitize session_id to match AWS Bedrock requirement:
        # alphanumeric, hyphens, colons, and underscores; between 2 and 100 characters.
        # Pattern: ^[a-zA-Z0-9_:-]+$
        # We replace any character not matching the pattern with '_'
        import re
        clean_session_id = re.sub(r"[^a-zA-Z0-9_:-]", "_", session_id_str)
        if len(clean_session_id) > 100:
            clean_session_id = clean_session_id[:100]
        elif len(clean_session_id) < 2:
            clean_session_id = f"session_{clean_session_id}"

        try:
            logger.info(f"Invoking Bedrock Agent {agent_id} (Alias: {agent_alias_id}) with Session: {clean_session_id}...")
            
            params = {
                "agentId": agent_id,
                "agentAliasId": agent_alias_id,
                "sessionId": clean_session_id,
                "inputText": input_text,
                "enableTrace": True
            }
            if session_state:
                params["sessionState"] = session_state

            response = self.runtime_client.invoke_agent(**params)
            
            event_stream = response.get("completion")
            if not event_stream:
                raise RuntimeError("Response from Bedrock Agent did not contain a completion event stream.")

            full_text = []
            traces = []
            citations = []
            return_control_data = None

            # Iterate over the event stream
            for event in event_stream:
                # 1. Standard text chunk event
                if "chunk" in event:
                    chunk = event["chunk"]
                    chunk_bytes = chunk.get("bytes", b"")
                    chunk_text = chunk_bytes.decode("utf-8", errors="ignore")
                    full_text.append(chunk_text)
                    citations.extend(
                        chunk.get("attribution", {}).get("citations", []) or []
                    )

                # 2. Trace event (if enableTrace=True)
                elif "trace" in event:
                    traces.append(event["trace"])

                # 3. Return Control event (external API execution needed)
                elif "returnControl" in event:
                    logger.info("Agent requested Return Control invocation.")
                    return_control_data = event["returnControl"]

            assembled_text = "".join(full_text)
            
            result = {
                "output": assembled_text,
                "has_trace": len(traces) > 0,
                "traces_count": len(traces),
                "citations": citations,
            }

            if return_control_data:
                result["return_control"] = return_control_data

            return result

        except ClientError as e:
            logger.error(f"AWS ClientError during Agent invocation: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error during Agent invocation: {str(e)}")
            raise e

agent_client = BedrockAgentCoreClient()
