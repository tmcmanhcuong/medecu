from fastapi import status, HTTPException
import os


async def upload_pdf_file(pdf_file, path, repo):
    # NOTE: process the uploaded file
    if pdf_file.content_type != "application/pdf":
        return HTTPException(status_code=400, detail="File must be a PDF")
    try:

        # NOTE: Save the uploaded PDF file to BOOK_FILES_PATH
        contents = await pdf_file.read()

        file_path = os.path.join(path, pdf_file.filename)

        with open(file_path, "wb") as f:
            f.write(contents)

        file_name = pdf_file.filename.split(".")[0]

        existing_book = repo.get_book_by_query_id(file_name)

        if existing_book:
                    return HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=(
                            f"Book with query_id '{file_name}' already exists. "
                            f"Use PATCH /books/{file_name} to update."
                        ),
                    )

    except Exception as e:
        return HTTPException(status_code=500, detail=f"Error processing PDF: {e!s}")
