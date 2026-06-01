import os
from fastapi import HTTPException


async def upload_file(
    content: str,
    file_path: str,
    file_type: str = "md",
) -> None:
    """
    Uploads a file with the given content to the specified file path.
    Args:
        content (str): The content to be written to the file.
        file_path (str): The path where the file will be saved.
        file_type (str): The expected file extension (default is "md").
    """
    if not file_path.lower().endswith(file_type):
        raise HTTPException(
            status_code=400,
            detail=f"File must be a .{file_type}",
        )

    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error writing markdown file: {str(e)}",
        )


async def read_file(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return content
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading markdown file: {str(e)}",
        )


async def delete_file(file_path: str) -> None:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting markdown file: {str(e)}",
        )
