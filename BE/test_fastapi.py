from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import requests
import json
import threading
import time

app = FastAPI()

class Item(BaseModel):
    filepath: str
    page_range: str
    force_ocr: bool
    paginate_output: bool
    output_format: str

@app.post("/marker")
def do_marker(item: Item):
    return {"output": '{"result": "success"}'}

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(1)

post_data = {
    "filepath": "x",
    "page_range": "1-2",
    "force_ocr": False,
    "paginate_output": False,
    "output_format": "json",
}

print("Testing with data=json.dumps(post_data)...")
res = requests.post("http://127.0.0.1:8000/marker", data=json.dumps(post_data))
print(res.json())

print("Testing with json=post_data...")
res2 = requests.post("http://127.0.0.1:8000/marker", json=post_data)
print(res2.json())
