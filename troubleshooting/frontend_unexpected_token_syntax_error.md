# Troubleshooting: Lỗi "Unexpected token '<', \"<!doctype \"... is not valid JSON" ở Frontend

## 1. Hiện tượng (Symptom)
Khi người dùng thực hiện các thao tác trên Frontend (như Đăng ký tài khoản, Tạo Notebook mới, v.v.), hệ thống không phản hồi đúng mong muốn. Trên DevTools Console của trình duyệt xuất hiện lỗi sau:
```text
Uncaught (in promise) SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

---

## 2. Nguyên nhân (Root Cause)
Lỗi này xuất phát từ sự kết hợp của 3 yếu tố:
1. **Thiếu biến môi trường lúc Build:**
   Biến môi trường API của Frontend `import.meta.env.VITE_SERVER_BACKEND` được biên dịch trực tiếp ở thời điểm chạy lệnh build (`npm run build`). Tệp `.env` chứa biến này bị Git bỏ qua (`.gitignore`). Trong tệp workflow GitHub Actions `deploy-fe.yml`, câu lệnh build chạy không được truyền biến này, dẫn đến giá trị của nó trong tệp build production là `undefined`.
2. **Đường dẫn API bị sai lệch (Relative URL):**
   Thay vì gửi request đến `/api/v1/notebooks`, trình duyệt đã gửi đến đường dẫn tương đối chứa chữ `undefined`:
   `https://d3jk3pehjkqm6y.cloudfront.net/undefined/notebooks`
3. **Cấu hình xử lý lỗi của CloudFront:**
   * CloudFront chỉ chuyển tiếp các request khớp với `/api/*` về phía Application Load Balancer (ALB).
   * Do đường dẫn chứa `/undefined/...` không khớp, CloudFront chuyển tiếp request sang S3 Bucket chứa Frontend tĩnh.
   * S3 không có tệp nào ở đường dẫn đó nên trả về lỗi `403 Access Denied`.
   * Tuy nhiên, CloudFront đã được cấu hình luật **Custom Error Response** (để hỗ trợ Single Page Application React định tuyến): Tự động bắt lỗi 403 và trả về tệp `/index.html` của trang web (bắt đầu bằng thẻ HTML `<!doctype html>`) kèm mã trạng thái **`200 OK`**.
   * Trình duyệt nhận mã trạng thái `200 OK` nên cố gắng thực hiện chuyển đổi nội dung nhận được (chuỗi HTML của `index.html`) thành JSON bằng hàm `.json()`, dẫn tới lỗi phân tích cú pháp (SyntaxError).

*(Lưu ý thêm: Khi sửa tệp workflow `deploy-fe.yml`, do có cấu hình bộ lọc đường dẫn `paths: - 'FE/**'`, GitHub Actions đã không kích hoạt chạy lại job build frontend do không có thay đổi nào nằm trong thư mục `FE/`).*

---

## 3. Giải pháp khắc phục (Resolution)

### Bước 1: Cập nhật tệp `.github/workflows/deploy-fe.yml`
Bổ sung mục `env` vào bước `Build frontend` để truyền giá trị thực tế cho các biến môi trường của Vite khi build:

```yaml
      - name: Build frontend
        env:
          VITE_SERVER_BACKEND: /api/v1
          VITE_QUIZ_FLASH_API_URL: https://duckq1-n8n.duckdns.org/webhook/970e5eb7-c672-475e-9e8c-5e49967d2718/learning
          VITE_CHAT_RAG_API_URL: https://duckq1-n8n.duckdns.org/webhook/f75be7aa-52f0-496d-b8d6-31a1ec1afaaa/chat-with-rag/
          VITE_OUTLINE_API_URL: https://duckq1-n8n.duckdns.org/webhook/970e5eb7-c672-475e-9e8c-5e49967d2718/outline
        run: |
          cd FE
          npm run build
```

### Bước 2: Kích hoạt Deploy trên GitHub Actions
Thêm một thay đổi nhỏ (như dòng comment) vào bất kỳ tệp tin nào thuộc thư mục `FE/` (ví dụ: `FE/src/main.jsx`) để kích hoạt bộ lọc `paths: - 'FE/**'`, sau đó commit và push lên nhánh `master` để kích hoạt quá trình tự động build & deploy lại Frontend lên S3 & CloudFront.
