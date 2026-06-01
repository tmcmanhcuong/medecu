import React from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';

export default function ProcessingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="relative w-56 h-56 mb-10">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin shadow-lg shadow-blue-500/10"></div>
        {/* Inner Ring */}
        <div className="absolute inset-6 rounded-full border-4 border-gray-100 border-b-purple-500 animate-[spin_1.5s_linear_infinite_reverse] shadow-lg shadow-purple-500/10"></div>
        {/* Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-full border border-gray-200 dark:border-slate-700 shadow-xl">
            <BrainCircuit className="w-12 h-12 text-blue-600 animate-pulse drop-shadow-md" />
          </div>
        </div>
      </div>
      <h3 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-wide">AI đang xử lý...</h3>
      <div className="flex items-center text-blue-700 bg-blue-50/80 px-6 py-3 rounded-2xl border border-blue-200 backdrop-blur-md shadow-sm">
        <Loader2 className="w-5 h-5 mr-3 animate-spin" />
        <span className="font-semibold tracking-wide">Đang đẩy dữ liệu vào Amazon Bedrock Knowledge Base</span>
      </div>
    </div>
  );
}
