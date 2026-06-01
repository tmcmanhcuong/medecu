import React, { useState } from 'react';
import { Link2, FileText, Send, Loader2, AlertCircle } from 'lucide-react';
import { notebookChat } from '../../../services/AI';

const STARTER_ACTIONS = [
  {
    id: 'summary',
    label: 'Tóm tắt nguồn',
    getPrompt: (title) => `Hãy tóm tắt ngắn gọn các ý chính từ toàn bộ nguồn của notebook "${title}".`,
  },
  {
    id: 'quiz',
    label: 'Tạo câu hỏi quiz',
    getPrompt: (title) => `Tạo 5 câu hỏi quiz từ notebook "${title}" và chỉ trả về JSON array theo schema [{ "question": string, "options": [string, string, string, string], "correct_index": number, "explanation": string }]. Không trả markdown.`,
  },
  {
    id: 'flashcard',
    label: 'Tạo flashcard',
    getPrompt: (title) => `Tạo 8 flashcard từ notebook "${title}" và chỉ trả về JSON array theo schema [{ "front": string, "back": string }]. Không trả markdown.`,
  },
];

const buildCitationLabel = (citation) => {
  const title = citation.book_title || citation.file_name || citation.bookId || 'Nguồn tài liệu';
  const sourceId = citation.source_id ? ` · src ${String(citation.source_id).slice(0, 8)}` : '';
  const excerpt = citation.source_text ? `: ${citation.source_text.slice(0, 120)}` : '';
  return `${title}${sourceId}${excerpt}`;
};

export default function ChatTab({
  chatMessages,
  setChatMessages,
  notebookId,
  activeNotebook,
  sourceDocuments = [],
  onChatSuccess,
  threadId,
  onRecoverNotebookSources,
}) {
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasUserMessages = chatMessages.some((msg) => msg.role === 'user');
  const hasSources = sourceDocuments.length > 0;
  const hasReadySources = sourceDocuments.some((doc) => doc.ingestion_status === 'ready');
  const hasPendingSources = sourceDocuments.some((doc) =>
    ['queued', 'processing', 'uploaded'].includes(doc.ingestion_status)
  );
  const hasFailedSources = sourceDocuments.some((doc) => doc.ingestion_status === 'failed');
  const notebookTitle = activeNotebook?.title || notebookId;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const isIngestionGateError = (error) =>
    error?.status === 400 &&
    /still being ingested/i.test(String(error?.message || ''));

  const submitPrompt = async (prompt, actionId = 'chat') => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isLoading) return;
    if (!hasSources) {
      setError('Notebook này chưa có nguồn tài liệu. Hãy nạp tài liệu trước khi chat.');
      return;
    }

    // Clear any previous error
    setError(null);

    // Add user message
    const userMessageId = crypto.randomUUID();
    setChatMessages((prev) => [...prev, { id: userMessageId, role: 'user', content: trimmedPrompt, citations: [] }]);
    setChatInput('');
    setIsLoading(true);

    // Add loading message
    const loadingMessageId = Date.now();
    setChatMessages((prev) => [...prev, {
      id: loadingMessageId,
      role: 'ai',
      content: '',
      isLoading: true,
    }]);

    try {
      // Build conversation history from existing messages (exclude the loading message)
      const rawConversationHistory = chatMessages
        .filter(msg => msg.role === 'user' || msg.role === 'ai')
        .filter(msg => !msg.isLoading)
        .map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));
      const firstUserIndex = rawConversationHistory.findIndex(
        (msg) => msg.role === 'user'
      );
      const conversationHistory =
        firstUserIndex >= 0
          ? rawConversationHistory.slice(firstUserIndex)
          : [];

      // Call backend API
      let response = null;
      let attemptError = null;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          response = await notebookChat(notebookId, trimmedPrompt, conversationHistory, null, actionId);
          attemptError = null;
          break;
        } catch (error) {
          attemptError = error;
          const canRecoverIngestion = isIngestionGateError(error) && onRecoverNotebookSources;
          if (!canRecoverIngestion || attempt === 2) {
            break;
          }
          await onRecoverNotebookSources();
          await wait(1200);
        }
      }
      if (attemptError || !response) throw attemptError || new Error('Notebook chat failed');
      const answerText = response.data.answer_text || '';
      const assistantMessageId = crypto.randomUUID();
      const assistantMessage = {
        id: assistantMessageId,
        role: 'ai',
        content: answerText,
        citations: (response.data.citations || []).map((source, idx) => ({
          id: idx + 1,
          text: buildCitationLabel(source),
          url: source.s3_uri || '#',
          bookId: source.book_id || source.bookId,
          sourceId: source.source_id,
          sourceText: source.source_text,
        })) || [],
        providerMetadata: response.data.provider_metadata,
      };
      if (onChatSuccess) {
        onChatSuccess({
          providerMetadata: response.data.provider_metadata,
          mode: actionId,
          threadId,
          messages: [
            { id: userMessageId, role: 'user', content: trimmedPrompt, citations: [] },
            assistantMessage,
          ],
        });
      }

      // Remove loading message and add real response
      setChatMessages((prev) => {
        const filtered = prev.filter(msg => msg.id !== loadingMessageId);
        return [...filtered, assistantMessage];
      });
    } catch (err) {
      console.error('Chat error:', err);

      // Remove loading message
      setChatMessages((prev) => prev.filter(msg => msg.id !== loadingMessageId));

      // Set error state
      setError(err.message || 'Không thể kết nối với AI. Vui lòng thử lại.');

      // Add error message to chat
      setChatMessages((prev) => [...prev, {
        role: 'ai',
        content: '',
        isError: true,
        errorMessage: err.message || 'Không thể kết nối với AI. Vui lòng thử lại.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    submitPrompt(chatInput, 'chat');
  };

  const handleRetry = (originalPrompt) => {
    submitPrompt(originalPrompt, 'chat');
  };

  return (
    <div className="h-full min-h-0 flex flex-col bg-white">

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
        {!hasUserMessages && (
          <div className="rounded-[18px] border border-[#e0e0e0] bg-[#f5f5f7] p-5">
            <p className="text-[14px] text-[#7a7a7a] mb-3">
              Bắt đầu nhanh với notebook này:
            </p>
            {hasSources ? (
              <div className="flex flex-wrap gap-2">
                {STARTER_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => submitPrompt(action.getPrompt(notebookTitle), action.id)}
                    disabled={isLoading || !hasReadySources}
                    className="inline-flex items-center rounded-lg border border-[#0066cc] px-4 py-2 text-[14px] text-[#0066cc] hover:bg-[#f0f7ff] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-[#8a5a2b]">
                Notebook này chưa có nguồn tài liệu. Hãy thêm tài liệu ở sidebar trước khi dùng AI quick actions.
              </p>
            )}
            {hasSources && !hasReadySources && hasPendingSources && (
              <p className="text-[14px] text-[#8a5a2b] mt-3">
                Tài liệu đang được ingest vào Knowledge Base. Bạn sẽ chat được khi trạng thái chuyển sang sẵn sàng.
              </p>
            )}
            {hasSources && !hasReadySources && hasFailedSources && (
              <p className="text-[14px] text-[#b42318] mt-3">
                Tài liệu ingest thất bại. Vui lòng retry ở sidebar.
              </p>
            )}
          </div>
        )}
        {chatMessages.map((msg, idx) => (
          <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] rounded-2xl p-4 ${msg.role === 'user'
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-sm shadow-sm border border-blue-500'
                : msg.isError
                  ? 'bg-[#fff5f5] border border-[#ffcccc] rounded-bl-sm shadow-sm'
                  : 'bg-white dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-bl-sm shadow-sm'
              }`}>

              {/* Loading State */}
              {msg.isLoading && (
                <div className="flex items-center gap-3 text-[#1d1d1f]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0066cc]" />
                  <span className="text-[17px] text-[#7a7a7a]">Đang xử lý...</span>
                </div>
              )}

              {/* Error State */}
              {msg.isError && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#ff3b30] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[17px] text-[#1d1d1f] font-semibold mb-1">Đã xảy ra lỗi</p>
                      <p className="text-[14px] text-[#7a7a7a] leading-relaxed">{msg.errorMessage}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Find the previous user message to retry
                      const prevUserMsg = chatMessages[idx - 1];
                      if (prevUserMsg && prevUserMsg.role === 'user') {
                        // Remove error message
                        setChatMessages(prev => prev.filter((_, i) => i !== idx));
                        handleRetry(prevUserMsg.content);
                      }
                    }}
                    className="inline-flex items-center rounded-lg border border-[#0066cc] px-4 py-2 text-[14px] text-[#0066cc] hover:bg-[#f0f7ff] active:scale-95 transition-all"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {/* Normal Message */}
              {!msg.isLoading && !msg.isError && (
                <>
                  <p className={`leading-relaxed text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>{msg.content}</p>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className={`mt-5 pt-4 flex flex-wrap gap-2 ${msg.role === 'user' ? 'border-t border-white/20' : 'border-t border-gray-200 dark:border-slate-700'}`}>
                      <span className={`w-full text-xs font-bold mb-1 flex items-center ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        <Link2 className="w-3 h-3 mr-1" /> NGUỒN TRÍCH DẪN:
                      </span>
                      {msg.citations.map(cite => (
                        <a
                          key={cite.id}
                          href={cite.url}
                          className={`inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${msg.role === 'user'
                              ? 'text-white bg-white dark:bg-slate-900/10 border-white/20 hover:bg-white dark:bg-slate-900/20'
                              : 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
                            }`}
                        >
                          <FileText className="w-3 h-3 mr-1.5" /> {cite.text}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="px-8 py-4 border-t border-[#e0e0e0] bg-[#f5f5f7]">
        <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isLoading}
            placeholder="Đặt câu hỏi để trích xuất thông tin từ tài liệu..."
            className="w-full bg-white border border-[#d2d2d7] text-[#1d1d1f] rounded-lg py-3.5 pl-5 pr-14 focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0071e3]/20 transition-all placeholder:text-[#8a8a8f] text-[17px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isLoading}
            className="absolute right-2 p-2.5 bg-[#0066cc] hover:bg-[#0071e3] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all active:scale-95 flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
