import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';

export default function SummaryTab({ selectedDocument, recentHistory = [], notebookId, activeNotebook }) {
  return (
    <div className="space-y-8 overflow-y-auto custom-scrollbar pr-4 h-full animate-in fade-in">
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-2.5 bg-blue-100 rounded-xl border border-blue-200 shadow-sm text-blue-600">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100">Tóm tắt Thông minh</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 font-medium">
            {selectedDocument
              ? `Notebook: ${activeNotebook?.title || notebookId} - Tài liệu: "${selectedDocument.file_name || selectedDocument.title}"`
              : 'Chọn một tài liệu từ notebook để bắt đầu phiên học'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 hover:border-blue-300 hover:bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
          <h3 className="text-blue-700 text-lg font-bold mb-4 flex items-center border-b border-gray-100 pb-3">
            <ChevronRight className="w-5 h-5 mr-1.5" /> Kiến trúc Cơ bản
          </h3>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300 ml-1.5 list-none text-sm">
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-600 mt-2 mr-3 shrink-0 shadow-sm"></div>
              <span className="leading-relaxed">Mô hình Foundation Models (FMs) là nền tảng cốt lõi của GenAI.</span>
            </li>
            <li className="flex items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-600 mt-2 mr-3 shrink-0 shadow-sm"></div>
              <span className="leading-relaxed">Amazon Bedrock cung cấp API Serverless để truy cập các FMs hàng đầu như Claude, Llama 3.</span>
            </li>
          </ul>
        </div>
      </div>
      {recentHistory.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6">
          <h3 className="text-amber-900 text-lg font-bold mb-3">Hoạt động gần đây</h3>
          <div className="space-y-2">
            {recentHistory.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="font-semibold text-amber-900 uppercase">{item.artifact_type}</span>
                <span className="text-amber-700">{item.created_at}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
