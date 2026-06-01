import os
import uuid
import boto3
from core import DOCUMENT_UPLOAD_DIR, FILE_STORAGE_MODE
from fastapi import UploadFile


async def save_uploaded_document(file: UploadFile) -> tuple[str, int]:
    content = await file.read()
    file_size = len(content)

    if FILE_STORAGE_MODE == "s3":
        bucket = os.getenv("S3_BUCKET_NAME") or os.getenv("AWS_S3_BUCKET_NAME")
        region = os.getenv("AWS_REGION", "us-east-1")
        if not bucket:
            raise RuntimeError("Missing required config for s3 storage mode: S3_BUCKET_NAME or AWS_S3_BUCKET_NAME")
        object_key = f"notebook-uploads/{uuid.uuid4()}-{file.filename}"
        s3_client = boto3.client("s3", region_name=region)
        s3_client.put_object(
            Bucket=bucket,
            Key=object_key,
            Body=content,
            ContentType=file.content_type or "application/pdf",
        )
        return f"s3://{bucket}/{object_key}", file_size

    os.makedirs(DOCUMENT_UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(DOCUMENT_UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as target:
        target.write(content)
    return file_path, file_size
