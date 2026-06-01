from fastapi import APIRouter, HTTPException
import os
from fastapi.responses import FileResponse

router = APIRouter()


@router.get("/{file_path:path}")
async def download_file(file_path: str):
    # Security: Prevent directory traversal attacks
    if ".." in file_path:
        raise HTTPException(status_code=400, detail="Invalid file path")

    # Get the project root directory
    current_file = os.path.abspath(__file__)
    project_root = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.dirname(current_file)))
    )

    # Construct full file path (file_path should include cache/ or other subdirectories)
    full_file_path = os.path.join(project_root, file_path)

    # Debug: Print paths (remove this in production)
    print(f"DEBUG - Requested file_path: {file_path}")
    print(f"DEBUG - Project root: {project_root}")
    print(f"DEBUG - Full file path: {full_file_path}")
    print(f"DEBUG - File exists: {os.path.exists(full_file_path)}")

    # List cache directory contents for debugging
    cache_dir = os.path.join(project_root, "cache")
    print(f"DEBUG - Cache dir: {cache_dir}")
    if os.path.exists(cache_dir):
        print(f"DEBUG - Cache dir contents: {os.listdir(cache_dir)}")
    else:
        print("DEBUG - Cache directory does not exist")

    # Ensure the file is within the project directory for security
    if not os.path.abspath(full_file_path).startswith(os.path.abspath(project_root)):
        raise HTTPException(status_code=400, detail="Access denied")

    if not os.path.exists(full_file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Extract filename for the response
    filename = os.path.basename(file_path)
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    return FileResponse(
        path=full_file_path, filename=filename, media_type="application/pdf"
    )
