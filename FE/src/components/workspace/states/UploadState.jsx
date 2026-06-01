import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

export default function UploadState({ onUpload }) {
  const fileInputRef = useRef(null);

  const handleBoxClick = () => {
    // Mở hộp thoại chọn file của trình duyệt
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Khi user đã chọn file xong, mới bắt đầu chạy hiệu ứng "AI xử lý"
      onUpload(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 py-4">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-black mb-4 text-gray-900 dark:text-gray-100 tracking-tight leading-tight drop-shadow-sm">
          Phân tích Tài liệu bằng <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Amazon Bedrock
          </span>
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium max-w-2xl mx-auto">
          Tải lên tài liệu của bạn. Hệ thống RAG sẽ tự động trích xuất ngữ cảnh, tạo Flashcards, Quiz và hỗ trợ hỏi đáp thời gian thực.
        </p>
      </div>

      <div
        onClick={handleBoxClick}
        className="w-full max-w-3xl p-12 rounded-[2.5rem] border-2 border-dashed border-blue-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800/80 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden backdrop-blur-md"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.pptx"
        />

        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500">
          <UploadCloud className="w-10 h-10 text-white drop-shadow-sm" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Kéo thả tài liệu vào đây</h3>
        <p className="text-blue-700 font-medium bg-blue-50/80 px-6 py-2 rounded-full border border-blue-200 shadow-sm">Hỗ trợ PDF, DOCX, PPTX (Max 50MB)</p>
      </div>
    </div>
  );
}
