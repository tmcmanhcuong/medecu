# MedEdu Frontend

<div align="center">

**Nền tảng học tập y khoa thông minh với AI**

[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📖 Giới thiệu

**MedEdu Frontend** là một ứng dụng web hiện đại được xây dựng cho giáo dục y khoa, tích hợp công nghệ AI để hỗ trợ học tập thông minh. Ứng dụng cung cấp các tính năng ghi chú, đọc tài liệu PDF, tạo quiz/flashcard tự động, và chatbot hỗ trợ học tập với RAG (Retrieval-Augmented Generation).

### ✨ Điểm nổi bật

- 🤖 **AI-Powered Learning**: Tích hợp AI để tạo quiz, flashcard và hỗ trợ học tập
- 📚 **PDF Viewer**: Đọc và tương tác với tài liệu PDF trực tiếp trong ứng dụng
- 📝 **Smart Note-Taking**: Ghi chú thông minh với khả năng trích dẫn từ PDF
- 💬 **RAG-based Chatbot**: Chatbot thông minh dựa trên nội dung tài liệu
- 🎯 **Interactive Learning**: Quiz và flashcard tương tác với phản hồi tức thì

---

## 🛠️ Công nghệ sử dụng

### Core Technologies
- ⚛️ **React 19.1** - Thư viện UI hiện đại với JSX/TSX
- ⚡ **Vite 7.1** - Build tool nhanh chóng và hiệu quả
- 📘 **TypeScript 5.8** - Type safety và developer experience tốt hơn
- 🎨 **Tailwind CSS 3.4** - Utility-first CSS framework

### UI & Components
- 🎭 **Material-UI (MUI)** - Component library chuyên nghiệp
- 🐜 **Ant Design** - Rich UI components
- 🎯 **Lucide React** - Modern icon library
- 📄 **React-PDF** - PDF viewing và rendering

### Routing & State
- 🔐 **React Router 7.9** - Client-side routing
- 🔄 **React Context** - State management

### AI & Data Processing
- 🤖 **Custom AI Services** - Tích hợp với backend AI
- 📊 **Axios** - HTTP client cho API calls
- 🔍 **RAG Integration** - Retrieval-Augmented Generation

### Development Tools
- 🧪 **Vitest** - Unit testing framework
- 📏 **ESLint** - Code linting
- 🎨 **PostCSS** - CSS processing

---

## 📋 Yêu cầu hệ thống

Trước khi chạy dự án, đảm bảo bạn đã cài đặt:

- **Node.js** ≥ 18.x ([Download](https://nodejs.org/))
- **npm** ≥ 9.x hoặc **Yarn** ≥ 1.22
- **Git** để clone repository

---

## 🚀 Cài đặt và Chạy

### 1. Clone Repository

```bash
git clone https://github.com/MedAgent-PCT/FE-MedEdu.git
cd FE-MedEdu
```

### 2. Cài đặt Dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env` từ template:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=MedEdu
```

### 4. Chạy Development Server

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: **http://localhost:5173**

### 5. Build cho Production

```bash
npm run build
```

### 6. Preview Production Build

```bash
npm run preview
```

### 7. Chạy Tests

```bash
# Run tests once
npm run test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

---

## 📁 Cấu trúc Dự án

```
FE-MedEdu/
├── public/                    # Static assets
├── src/
│   ├── assets/               # Images, logos, icons
│   ├── components/           # Reusable UI components
│   │   ├── Dashboard/        # Dashboard components
│   │   │   ├── LeftSidebar.jsx      # Notes list & search
│   │   │   ├── MainContent.jsx      # Note editor
│   │   │   └── RightSidebar.jsx     # PDF viewer & attachments
│   │   ├── PDFViewer/        # PDF viewing components
│   │   ├── SelectionBox/     # Text selection UI
│   │   ├── Chat/             # Chat interface
│   │   └── layout/           # Layout components
│   ├── config/               # App configuration
│   ├── constants/            # Static constants
│   ├── context/              # React contexts
│   │   └── AuthContext.jsx   # Authentication context
│   ├── guards/               # Route guards
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.js        # Authentication hook
│   │   ├── useChatTextSelection.js
│   │   ├── useManualSelection.js
│   │   └── usePDFTextSelection.js
│   ├── layouts/              # Page layouts
│   ├── middleware/           # Middleware functions
│   ├── pages/                # Page components
│   │   ├── Auth/             # Authentication pages
│   │   │   ├── SigninPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   └── ForgotPasswordPage.jsx
│   │   ├── Home/             # Home pages
│   │   │   ├── Dashboard.jsx
│   │   │   └── RoleSelection.jsx
│   │   ├── HomePage.jsx
│   │   ├── PersonalizedExercises.jsx
│   │   └── SettingsPage.jsx
│   ├── services/             # API services
│   │   ├── AI/               # AI services
│   │   │   ├── aiService.jsx         # RAG chat, AI notes
│   │   │   ├── testQuizFlashcard.js  # Quiz generation
│   │   │   └── flashcardService.js   # Flashcard generation
│   │   ├── book/             # Book/PDF services
│   │   ├── cache/            # Caching services
│   │   ├── mock/             # Mock data for development
│   │   ├── note/             # Note services
│   │   └── user/             # User services
│   ├── tests/                # Test files
│   ├── utils/                # Utility functions
│   ├── App.jsx               # Root component
│   ├── App.css               # App styles
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
├── cors-proxy.cjs            # CORS proxy server
├── index.html                # HTML template
├── package.json              # Dependencies & scripts
├── vite.config.ts            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── vitest.config.js          # Vitest configuration
```

---

## 🎯 Tính năng chính

### 📝 Hệ thống Ghi chú Thông minh

- ✍️ Tạo, chỉnh sửa, xóa và nhân bản ghi chú
- 🔍 Tìm kiếm và lọc ghi chú nhanh chóng
- 🎨 Phân loại ghi chú theo màu sắc
- 📎 Đính kèm file và tài liệu
- 💾 Tự động lưu khi blur
- 🤖 **AI-powered note generation** từ văn bản được chọn
- 📚 Trích dẫn tự động từ PDF với citation bubbles

### 📄 PDF Viewer Tương tác

- 📖 Xem tài liệu PDF trực tiếp trong ứng dụng
- ✂️ Chọn văn bản từ PDF
- 📌 Tạo ghi chú từ văn bản được chọn
- 🔗 Tự động tạo citation với page number
- 🎯 Click vào citation để jump đến trang PDF tương ứng
- 🖱️ Selection box với nhiều tùy chọn:
  - "Add to Note" - Thêm trực tiếp vào ghi chú
  - "Add to Note with AI" - Tạo ghi chú với AI
  - "Generate Citation" - Tạo trích dẫn

### 🎯 Hệ thống Quiz AI

- 🤖 **Tự động tạo quiz từ nội dung** bằng AI
- 📝 Câu hỏi trắc nghiệm đa dạng
- ✅ Chọn đáp án một lần cho mỗi câu hỏi
- 💡 Phản hồi tức thì với giải thích chi tiết
- 📊 Tính điểm và hiển thị kết quả chi tiết
- 🎓 Hỗ trợ nhiều định dạng câu hỏi

### 🎴 Hệ thống Flashcard AI

- 🤖 **Tự động tạo flashcard từ nội dung** bằng AI
- 🔄 Lật thẻ để xem câu hỏi/câu trả lời
- ✅ Đánh dấu "Đã nhớ" hoặc "Chưa nhớ"
- ⏭️ Tự động chuyển sang thẻ tiếp theo
- 📈 Theo dõi tiến độ và tính điểm
- 🎯 Ôn tập thông minh dựa trên kết quả

### 💬 RAG-based Chatbot

- 🤖 Chatbot thông minh với RAG (Retrieval-Augmented Generation)
- 📚 Trả lời dựa trên nội dung tài liệu đã upload
- 💬 Giao diện chat real-time
- ✂️ Chọn văn bản từ chat để thêm vào ghi chú
- 🎯 Chat bubble cố định ở góc dưới phải
- 📝 Tích hợp với hệ thống ghi chú

### 🎨 Giao diện & Trải nghiệm

- 🌓 Hỗ trợ Dark mode
- 📱 Responsive design - hoạt động tốt trên mọi thiết bị
- ✨ Animations và transitions mượt mà
- 🎯 UI/UX hiện đại, trực quan
- ⚡ Performance tối ưu với Vite
- 🎨 Tailwind CSS cho styling linh hoạt

### 🔐 Authentication & Security

- 🔑 Đăng nhập/Đăng ký an toàn
- 👤 Quản lý profile người dùng
- 🛡️ Protected routes với guards
- 🔄 Token-based authentication
- 📧 Forgot password functionality

---

## 🔧 Scripts NPM

```bash
# Development
npm run dev              # Chạy dev server với hot reload

# Build
npm run build            # Build production với TypeScript check

# Preview
npm run preview          # Preview production build

# Testing
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage report

# Linting
npm run lint             # Check code quality với ESLint
```

---

## 🌐 Environment Variables

Tạo file `.env` ở thư mục gốc của project:

```env
# API Configuration
VITE_API_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME=MedEdu

# Add other environment variables as needed
```

⚠️ **Lưu ý quan trọng**: 
- Tất cả environment variables phải bắt đầu với `VITE_` để được expose trong Vite
- Không commit file `.env` lên Git (đã có trong `.gitignore`)
- Sử dụng `.env.example` làm template

---

## 🧪 Testing

Dự án sử dụng **Vitest** cho unit testing:

```bash
# Run all tests
npm run test

# Watch mode - tự động re-run khi file thay đổi
npm run test:watch

# UI mode - giao diện web để xem test results
npm run test:ui

# Coverage report
npm run test:coverage
```

Test files nằm trong thư mục `src/tests/`

---

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng làm theo các bước sau:

1. **Fork** repository này
2. **Clone** fork của bạn về máy local
3. Tạo **branch mới** cho feature/fix của bạn:
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **Commit** các thay đổi:
   ```bash
   git commit -m "Add some amazing feature"
   ```
5. **Push** lên branch:
   ```bash
   git push origin feature/amazing-feature
   ```
6. Tạo **Pull Request** trên GitHub

### Code Style Guidelines

- Sử dụng ESLint để check code quality
- Follow React best practices
- Viết tests cho features mới
- Comment code khi cần thiết
- Sử dụng TypeScript cho type safety

---

## 📝 License

Dự án này được phân phối dưới **MIT License**. Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 👥 Team

**MedAgent-PCT Team**

- GitHub: [@MedAgent-PCT](https://github.com/MedAgent-PCT)
- Repository: [FE-MedEdu](https://github.com/MedAgent-PCT/FE-MedEdu)

---

## 📞 Liên hệ & Hỗ trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng:

- 🐛 Tạo [Issue](https://github.com/MedAgent-PCT/FE-MedEdu/issues) trên GitHub
- 💬 Tham gia discussions
- 📧 Liên hệ team qua GitHub

---

## 🎓 Tài liệu tham khảo

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Material-UI Documentation](https://mui.com/)
- [React Router Documentation](https://reactrouter.com/)

---

<div align="center">

**Made with ❤️ by MedAgent-PCT Team**

⭐ Star this repo if you find it helpful!

</div>
