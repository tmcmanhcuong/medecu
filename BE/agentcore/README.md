# Hướng dẫn thiết lập AWS Bedrock Agent Core cho MedEdu

Thư mục này chứa toàn bộ mã nguồn tích hợp giữa MedEdu Backend (FastAPI) và **AWS Bedrock Agent Core** (`bedrock-agent` và `bedrock-agent-runtime`). Để hệ thống hoạt động chính xác, bạn cần hoàn thành các bước thiết lập tài nguyên trên AWS Management Console dưới đây.

---

## 1. Thiết lập tài nguyên AWS

### Bước 1: Tạo Amazon S3 Bucket
* Tạo một S3 bucket mới (ví dụ: `mededu-rag-content-yourname`) dùng để chứa sách/tài liệu học tập dưới dạng markdown.
* Bật tính năng **Bucket Versioning** (khuyên dùng cho Bedrock Knowledge Base).

### Bước 2: Tạo Amazon Bedrock Knowledge Base
* Truy cập **Amazon Bedrock** Console -> **Knowledge bases** -> Chọn **Create knowledge base**.
* **Data Source:** Chọn S3 làm nguồn dữ liệu và trỏ đường dẫn tới S3 Bucket vừa tạo ở Bước 1.
* **Embeddings Model:** Chọn một mô hình vector hóa phù hợp (ví dụ: `Amazon Titan Multimodal Embeddings` hoặc `Cohere Embed`).
* **Vector Store:** Chọn **Quick create a new vector store** (AWS sẽ tự động tạo một Amazon OpenSearch Serverless collection cho bạn).
* Sau khi tạo xong, ghi lại các giá trị:
  * **Knowledge Base ID**
  * **Data Source ID** (tìm thấy trong mục Data sources của KB)

### Bước 3: Tạo 4 AWS Bedrock Agents
Hãy truy cập **Amazon Bedrock** Console -> **Agents** -> Chọn **Create Agent** cho từng Agent dưới đây:

#### 1. Agent `chat-with-rag`
* **Agent name:** `mededu-chat-with-rag`
* **Model:** Chọn mô hình mong muốn (ví dụ: `Anthropic Claude 3.5 Sonnet` hoặc `Claude 3 Haiku`).
* **Instructions for the Agent:**
  ```text
  Bạn là một trợ lý học tập AI. Nhiệm vụ của bạn là giải đáp câu hỏi của người dùng dựa hoàn toàn vào tài liệu học tập nội bộ.

  <rules>
  1. BẮT BUỘC SỬ DỤNG: Bạn phải luôn gọi công cụ tìm kiếm trong tài liệu học tập (Knowledge Base) TRƯỚC KHI đưa ra bất kỳ câu trả lời nào. Tuyệt đối không tự suy đoán hoặc dùng kiến thức nội tại.
  2. PHÂN TÍCH KẾT QUẢ: Chỉ sử dụng các thông tin được trả về từ tài liệu để tổng hợp câu trả lời. 
  3. XỬ LÝ LỖI: Nếu không tìm thấy thông tin này trong tài liệu, hoặc thông tin trả về không giải quyết được câu hỏi, BẮT BUỘC trả lời chính xác câu sau: "Tôi không tìm thấy thông tin này trong tài liệu." Không giải thích thêm.
  4. ĐỊNH DẠNG: Trả lời ngắn gọn, trực tiếp. KHÔNG dùng các cụm từ mở đầu như "Dựa vào tài liệu tìm được..." hay "Theo ngữ cảnh...".
  </rules>
  ```
* **Knowledge Base:** Liên kết Agent này với **Knowledge Base** vừa tạo ở Bước 2. Cung cấp mô tả hoạt động: *"Sử dụng công cụ này để tra cứu tài liệu học tập nội bộ."*

#### 2. Agent `generating-flashcard`
* **Agent name:** `mededu-generating-flashcard`
* **Instructions for the Agent:**
  ```text
  Bạn là một chuyên gia trích xuất dữ liệu giáo dục. Nhiệm vụ của bạn là tạo flashcard CHỈ dựa trên thông tin được cung cấp từ tài liệu học tập (Knowledge Base).

  <rules>
  1. TUYỆT ĐỐI KHÔNG sử dụng kiến thức bên ngoài. 
  2. Chỉ trích xuất các khái niệm quan trọng có mặt trong tài liệu thu thập được. 
  3. Nếu tài liệu không chứa đủ thông tin để tạo flashcard, hãy trả về một mảng rỗng: []
  4. Output BẮT BUỘC phải là một mảng JSON (JSON array) hợp lệ, tuân thủ JSON Schema bên dưới.
  5. KHÔNG trả về bất kỳ văn bản, lời chào, hay định dạng markdown (như ```json) nào ngoài chuỗi JSON thuần túy.
  </rules>

  <json_schema>
  {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "front": {
          "type": "string",
          "description": "Thuật ngữ, từ khóa hoặc câu hỏi ngắn gọn"
        },
        "back": {
          "type": "string",
          "description": "Định nghĩa hoặc câu trả lời chi tiết, ngắn gọn dưới 30 từ"
        }
      },
      "required": ["front", "back"],
      "additionalProperties": false
    }
  }
  </json_schema>
  ```
* **Knowledge Base:** Liên kết với **Knowledge Base** tạo ở Bước 2.

#### 3. Agent `generating-quizz`
* **Agent name:** `mededu-generating-quizz`
* **Instructions for the Agent:**
  ```text
  Bạn là một giáo viên chuyên thiết kế bài kiểm tra. Hãy tạo các câu hỏi trắc nghiệm (MCQ) CHỈ dựa trên nội dung trong tài liệu học tập (Knowledge Base).

  <rules>
  1. TUYỆT ĐỐI KHÔNG bịa thông tin. Mọi câu hỏi, đáp án đúng và giải thích phải bám sát 100% vào tài liệu thu thập được.
  2. Nếu tài liệu quá ngắn hoặc không chứa kiến thức trọng tâm để tạo câu hỏi, hãy trả về một mảng rỗng: []
  3. Mỗi câu hỏi phải có chính xác 4 lựa chọn, chỉ 1 lựa chọn đúng. Giải thích dưới 20 từ.
  4. Output BẮT BUỘC phải là một mảng JSON (JSON array) hợp lệ, tuân thủ JSON Schema bên dưới.
  5. KHÔNG bọc JSON trong markdown tag. Bắt đầu ngay với ký tự `[` và kết thúc bằng `]`.
  </rules>

  <json_schema>
  {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "question": {
          "type": "string",
          "description": "Nội dung câu hỏi trắc nghiệm"
        },
        "options": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 4,
          "maxItems": 4,
          "description": "Mảng chứa 4 lựa chọn đáp án"
        },
        "correct_index": {
          "type": "integer",
          "minimum": 0,
          "maximum": 3,
          "description": "Chỉ mục (0-3) của đáp án đúng trong mảng options"
        },
        "explanation": {
          "type": "string",
          "description": "Giải thích ngắn gọn tại sao đáp án đó đúng, dựa theo context"
        }
      },
      "required": ["question", "options", "correct_index", "explanation"],
      "additionalProperties": false
    }
  }
  </json_schema>
  ```
* **Knowledge Base:** Liên kết với **Knowledge Base** tạo ở Bước 2.

#### 4. Agent `uploading-book-content` (Đồng bộ tài liệu tự động)
* Hoạt động của Agent này được xử lý trực tiếp thông qua API đồng bộ Knowledge Base (`start_ingestion_job`) trong `client.py` của chúng tôi khi nhận tệp tải lên từ backend.

*Sau khi tạo xong các Agent, hãy thực hiện **Prepare Agent** và **Create Alias** cho từng Agent (Ví dụ tên Alias: `prod` hoặc dùng alias mặc định nháp là `TSTALIASID`). Ghi lại các giá trị **Agent ID** và **Alias ID**.*

---

## 2. Cấu hình biến môi trường trong `.env`

Hãy thêm/cập nhật các biến môi trường sau vào tệp `.env` ở thư mục gốc của dự án:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1

# S3 & Knowledge Base Configs
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_KB_ID=your-bedrock-kb-id
AWS_KB_DATA_SOURCE_ID=your-bedrock-kb-data-source-id

# Agent IDs & Alias IDs (chuẩn AGENTCORE_*)
AGENTCORE_CHAT_AGENT_ID=your-agent-id-for-chat
AGENTCORE_CHAT_AGENT_ALIAS_ID=TSTALIASID

AGENTCORE_FLASHCARD_AGENT_ID=your-agent-id-for-flashcard
AGENTCORE_FLASHCARD_AGENT_ALIAS_ID=TSTALIASID

AGENTCORE_QUIZ_AGENT_ID=your-agent-id-for-quiz
AGENTCORE_QUIZ_AGENT_ALIAS_ID=TSTALIASID

# CHUYỂN WEBHOOK N8N SANG LOCAL AGENT ROUTER
N8N_WEBHOOK_URL=http://localhost:8000/agentcore

# Notebook chat runtime selector (mới)
AI_RUNTIME=agentcore
AGENTCORE_KNOWLEDGE_BASE_ID=your-bedrock-kb-id
```

---

## 3. Hoạt động của hệ thống (Runtime Flow)

Khi backend giao tiếp qua biến `N8N_WEBHOOK_URL`, tất cả các cuộc gọi API sẽ được định tuyến cục bộ sang router của `./agentcore`:
1. **Upload Book**: `requests.put` gửi đến `/agentcore/uploading-book-content-to-rag` -> Tải file markdown lên S3 -> Khởi chạy Ingestion Job để đồng bộ tài nguyên trong AWS Knowledge Base.
2. **Chat**: `requests.post` gửi đến `/agentcore/chat-with-rag` -> Gọi Bedrock Agent Runtime (`invoke_agent`) -> Đọc phản hồi stream -> Trả về cấu trúc `{ "output": "..." }`.
3. **Flashcard**: `requests.post` gửi đến `/agentcore/generating-flashcard` -> Gọi Flashcard Agent -> Nhận mảng flashcard định dạng JSON thuần túy.
4. **Quiz**: `requests.post` gửi đến `/agentcore/generating-quizz` -> Gọi Quiz Agent -> Nhận mảng MCQ định dạng JSON thuần túy.
