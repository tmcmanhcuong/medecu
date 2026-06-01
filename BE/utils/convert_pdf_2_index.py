from bs4 import BeautifulSoup
import PyPDF2
import os
import requests
import json
from core import MARKER_URL, BOOK_ENTITIES_INDEX_PATH, N8N_WEBHOOK_URL
from fastapi import HTTPException
from typing import Optional


def get_raw_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style"]):
        tag.decompose()
    return soup.get_text(separator=" ", strip=True)


def extract_text_from_marker_rendered(json_block: dict):
    id_to_raw = {}
    image_encoded_dict = {}
    id_to_bbox = {}

    def interpret_child_block(block: dict, tab_amount: int):
        nonlocal id_to_raw

        # if block.block_type == "Text" and block.html is not None:
        id_to_raw[block["id"]] = get_raw_text(html=block["html"])

        # if block.block_type == "Picture" and block.images is not None:
        #     paragraph_as_html = paragraph_as_html + f'{tab_space}<img id="{block.id}" src="data:image/png;base64, Id was added after adjust form HTML" alt="{block.id}">'
        #     image_encoded_dict[block.id] = block.images[block.id]

        id_to_bbox[block["id"]] = block["bbox"]

        if block["children"] is not None:
            for child in block["children"]:  # type: ignore
                interpret_child_block(child, tab_amount + 1)

    if json_block["children"] is not None:
        for block in json_block["children"]:
            interpret_child_block(block, 0)

    return id_to_raw, image_encoded_dict, id_to_bbox


# from marker.output import text_from_rendered


def convert_pdf_to_dict(start_page: int, end_page: int, file_path: str, user_id: Optional[str] = None):

    post_data = {
        "filepath": file_path,
        "page_range": f"{start_page}-{end_page}",
        "force_ocr": False,
        "paginate_output": False,
        "output_format": "json",
    }

    post_data_2 = {
        "filepath": file_path,
        "page_range": f"{start_page}-{end_page}",
        "force_ocr": False,
        "paginate_output": False,
        "output_format": "markdown",
    }

    output = requests.post(MARKER_URL, json=post_data).json()
    output_2 = requests.post(MARKER_URL, json=post_data_2).json()
    output_filename = BOOK_ENTITIES_INDEX_PATH + "/output.md"

    with open(output_filename, "w") as f:
        f.write(str(output_2["output"]).replace("-", " "))

    with open(output_filename, "rb") as f_upload:
        files_payload = {
            "file": ("output.md", f_upload, "text/markdown")
        }

        params = {}
        if user_id:
            params["user-id"] = user_id

        response = requests.put(
            f"{N8N_WEBHOOK_URL}/uploading-book-content-to-rag",
            files=files_payload,
            params=params,
            timeout=30,
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Error uploading PDF to RAG service: {response.text}",
            )

    parsed = dict(json.loads(output["output"]))
    return extract_text_from_marker_rendered(parsed)


def save_dict_to_file(data_dict: dict, file_path: str):
    with open(file_path, "w") as f:
        for key, value in data_dict.items():
            f.write(f"{key}: {value}\n")


def convert_pdf_to_index(total_pages: int, file_path: str, user_id: Optional[str] = None):

    looping_time = total_pages // 10

    if (total_pages - (looping_time * 10)) > 0:
        looping_time += 1

    entities_path = BOOK_ENTITIES_INDEX_PATH
    book_id = os.path.splitext(os.path.basename(file_path))[0]

    if not os.path.exists(f"{entities_path}/cited_indexes"):
        os.mkdir(f"{entities_path}/cited_indexes")

    if not os.path.exists(f"{entities_path}/cited_indexes/{book_id}"):
        os.mkdir(f"{entities_path}/cited_indexes/{book_id}")

    id_to_bboxes = {}
    id_to_raws = {}

    for idx, i in enumerate(range(looping_time)):
        start_page = i * 10 + 1 - 1
        end_page = min((i + 1) * 10, total_pages) - 1

        id_to_raw, images, id_to_bbox = convert_pdf_to_dict(
            start_page, end_page, file_path, user_id=user_id
        )

        # checking if folder exists
        (
            os.mkdir(f"{entities_path}/cited_indexes/{book_id}")
            if not os.path.exists(f"{entities_path}/cited_indexes/{book_id}")
            else None
        )

        save_dict_to_file(
            id_to_raw,
            f"{entities_path}/cited_indexes/{book_id}/id_to_raw_index_{start_page}_to_{end_page}.txt",
        )
        save_dict_to_file(
            id_to_bbox,
            f"{entities_path}/cited_indexes/{book_id}/id_to_bbox_index_{start_page}_to_{end_page}.txt",
        )
        save_dict_to_file(
            images,
            f"{entities_path}/cited_indexes/{book_id}/images_index_{start_page}_to_{end_page}.txt",
        )
        # print(images)

        id_to_bboxes.update(id_to_bbox)
        id_to_raws.update(id_to_raw)
        del id_to_raw, images, id_to_bbox

    return id_to_bboxes, id_to_raws


def convert_from_path_to_index(file_path: str, user_id: Optional[str] = None):
    """
    Convert a PDF file to an index of its contents.
    Args:
        file_path (str): The path to the PDF file.
    """
    with open(file_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)
        total_pages = len(pdf_reader.pages)
        print(f"Total pages: {total_pages}")
    return convert_pdf_to_index(total_pages, file_path, user_id=user_id)
