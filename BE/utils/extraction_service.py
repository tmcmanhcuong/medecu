import requests
import PyPDF2

from core import EXTRACTION_SERVICE_URL


def _extract_text_with_pypdf2(file_path: str) -> str:
    chunks = []
    with open(file_path, "rb") as source_file:
        reader = PyPDF2.PdfReader(source_file)
        for page in reader.pages:
            page_text = page.extract_text() or ""
            if page_text.strip():
                chunks.append(page_text.strip())
    return "\n\n".join(chunks).strip()


def extract_text_from_document(file_path: str) -> str:
    payload = {
        "filepath": file_path,
        "force_ocr": False,
        "paginate_output": False,
        "output_format": "markdown",
    }
    try:
        response = requests.post(EXTRACTION_SERVICE_URL, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        output = data.get("output", "")
        if not isinstance(output, str):
            raise ValueError("Extraction output must be a string")
        text = output.strip()
        if text:
            return text
    except Exception:
        pass
    text = _extract_text_with_pypdf2(file_path)
    if not text:
        raise ValueError("Extraction returned empty content")
    return text
