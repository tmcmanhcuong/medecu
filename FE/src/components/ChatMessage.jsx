import React from 'react';
import { User, Bot, BookOpen } from 'lucide-react';

/**
 * Component hiển thị một tin nhắn trong chatbot
 * @param {Object} props
 * @param {string} props.role - 'user' hoặc 'assistant'
 * @param {string} props.content - Nội dung tin nhắn
 * @param {Array} props.sources - Mảng các nguồn tài liệu tham khảo (nếu có)
 * @param {boolean} props.isLoading - Trạng thái đang tải
 */
const ChatMessage = ({ role, content, sources = [], isLoading = false }) => {
    const isUser = role === 'user';

    return (
        <div className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                </div>
            )}

            <div className={`flex flex-col max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-5 py-3 rounded-2xl shadow-sm ${isUser
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200'
                        }`}
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                    )}
                </div>

                {/* Hiển thị nguồn tài liệu tham khảo */}
                {!isUser && sources && sources.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Nguồn tham khảo:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {sources.slice(0, 3).map((source, index) => (
                                <div
                                    key={index}
                                    className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs"
                                >
                                    <p className="font-medium text-blue-900 mb-1">
                                        {source.metadata?.title || `Tài liệu ${index + 1}`}
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                        {source.content?.substring(0, 100)}...
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {isUser && (
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatMessage;
