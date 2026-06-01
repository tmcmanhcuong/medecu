import hashlib
import json
import os
import uuid
from typing import Any, Iterable, List, Optional


def normalize_uuid_strings(values: Optional[Iterable[Any]]) -> List[str]:
    if not values:
        return []
    return [str(value) for value in values if value is not None and str(value)]


def build_source_set_hash(source_book_ids: Optional[Iterable[Any]]) -> str:
    normalized_ids = normalize_uuid_strings(source_book_ids)
    digest_source = json.dumps(normalized_ids, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha1(digest_source.encode("utf-8")).hexdigest()[:12]


def build_generation_scope_key(
    user_id: Optional[Any],
    notebook_id: Optional[Any],
    source_book_ids: Optional[Iterable[Any]],
) -> str:
    user_part = str(user_id) if user_id is not None else "default_user"
    notebook_part = str(notebook_id) if notebook_id is not None else "global"
    source_part = build_source_set_hash(source_book_ids)
    return f"{user_part}:{notebook_part}:{source_part}"


def build_generation_cache_path(
    cache_dir: str,
    artifact_prefix: str,
    user_id: Optional[Any],
    notebook_id: Optional[Any],
    source_book_ids: Optional[Iterable[Any]],
) -> tuple[str, str]:
    scope_key = build_generation_scope_key(user_id, notebook_id, source_book_ids)
    file_id = str(uuid.uuid4())
    sanitized_scope = scope_key.replace(":", "_")
    file_name = f"{artifact_prefix}_{sanitized_scope}_{file_id}.json"
    return os.path.join(cache_dir, file_name), scope_key


def build_retrieval_session_state(
    knowledge_base_id: str,
    notebook_id: Optional[Any],
    source_book_ids: Optional[Iterable[Any]] = None,
    source_file_names: Optional[Iterable[str]] = None,
    number_of_results: int = 8,
) -> dict[str, Any]:
    if not knowledge_base_id:
        return {}

    filters: List[dict[str, Any]] = []

    if notebook_id is not None:
        filters.append(
            {
                "equals": {
                    "key": "notebook_id",
                    "value": str(notebook_id),
                }
            }
        )

    normalized_book_ids = normalize_uuid_strings(source_book_ids)
    if normalized_book_ids:
        filters.append(
            {
                "in": {
                    "key": "book_id",
                    "value": normalized_book_ids,
                }
            }
        )

    normalized_file_names = [str(value) for value in (source_file_names or []) if value]
    if normalized_file_names:
        filters.append(
            {
                "in": {
                    "key": "file_name",
                    "value": normalized_file_names,
                }
            }
        )

    if not filters:
        return {}

    retrieval_filter: dict[str, Any]
    if len(filters) == 1:
        retrieval_filter = filters[0]
    else:
        retrieval_filter = {"andAll": filters}

    return {
        "knowledgeBaseConfigurations": [
            {
                "knowledgeBaseId": knowledge_base_id,
                "retrievalConfiguration": {
                    "vectorSearchConfiguration": {
                        "numberOfResults": max(1, number_of_results),
                        "filter": retrieval_filter,
                    }
                },
            }
        ]
    }


def extract_retrieval_preview(rag_response: dict[str, Any], limit: int = 5) -> List[dict[str, Any]]:
    candidate_keys = (
        "sources",
        "citations",
        "documents",
        "retrieved_documents",
        "retrievedReferences",
        "chunks",
    )

    candidates: list[Any] = []
    for key in candidate_keys:
        value = rag_response.get(key)
        if isinstance(value, list) and value:
            candidates = value
            break

    preview: List[dict[str, Any]] = []
    for item in candidates[:limit]:
        if not isinstance(item, dict):
            preview.append({"value": item})
            continue

        metadata = item.get("metadata", {})
        preview.append(
            {
                "book_id": item.get("book_id") or metadata.get("book_id"),
                "notebook_id": item.get("notebook_id") or metadata.get("notebook_id"),
                "file_name": item.get("file_name") or metadata.get("file_name"),
                "source_id": item.get("source_id")
                or metadata.get("notebook_source_id")
                or metadata.get("book_id"),
                "text_preview": (
                    item.get("content")
                    or item.get("text")
                    or metadata.get("text")
                    or ""
                )[:160],
                "metadata": metadata,
            }
        )
    return preview
