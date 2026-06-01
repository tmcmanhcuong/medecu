import React, { useState } from 'react';
import {
  BookOpen,
  File,
  Upload,
  X,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Brain,
  Layers,
  Settings,
} from 'lucide-react';

const RECENT_CHAT_LIMIT = 2;

export default function WorkspaceSidebar({
  workspaceState,
  onSelectDocument,
  onUploadDocument,
  onRemoveDocument,
  documents = [],
  selectedDocument,
  recentHistory = [],
  onSelectRecentChat,
  onDeleteRecentChat,
  onClearRecentChats,
  activeSessionId,
  activeNotebook,
  onRetryDocumentIngestion,
  collapsed = false,
  onToggleCollapse,
  activeTab = 'chat',
  onSelectTab,
  onNewChat,
}) {
  const [activeDoc, setActiveDoc] = useState(1);
  const [openAllDocs, setOpenAllDocs] = useState(false);
  const [openAllChats, setOpenAllChats] = useState(false);

  const normalizedDocs = documents.length
    ? documents.map((doc) => ({
      id: doc.id,
      name: doc.file_name || doc.title || doc.query_id || 'Untitled.pdf',
      status: doc.ingestion_status || 'uploaded',
    }))
    : [];
  const sidebarDocs = normalizedDocs.slice(0, 5);

  const getStatusLabel = (status) => {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    if (['ready', 'indexed', 'completed', 'complete', 'succeeded', 'success'].includes(normalizedStatus)) return 'Sẵn sàng';
    if (['processing', 'ingesting', 'running', 'in_progress'].includes(normalizedStatus)) return 'Đang ingest';
    if (['failed', 'error', 'errored'].includes(normalizedStatus)) return 'Thất bại';
    return 'Đang chờ';
  };

  const handleDeleteSingleChat = async (historyId) => {
    const confirmed = window.confirm('Xóa lịch sử chat này?');
    if (!confirmed || !onDeleteRecentChat) return;
    await onDeleteRecentChat(historyId);
  };

  const handleDeleteAllChats = async () => {
    const confirmed = window.confirm('Xóa toàn bộ lịch sử chat của notebook này?');
    if (!confirmed || !onClearRecentChats) return;
    await onClearRecentChats();
  };

  if (collapsed) {
    return (
      <aside className="w-[72px] border-r border-[#e0e0e0] bg-white flex flex-col items-center py-4 gap-3 z-10">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 rounded-lg border border-[#d2d2d7] text-[#6e6e73] hover:border-[#0066cc]"
          title="Mở rộng sidebar"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('chat')}
          className={`p-2 rounded-lg border ${activeTab === 'chat' ? 'border-[#0066cc] bg-[#f0f7ff] text-[#0066cc]' : 'border-[#d2d2d7] text-[#6e6e73]'}`}
          title="Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('quiz')}
          className={`p-2 rounded-lg border ${activeTab === 'quiz' ? 'border-[#0066cc] bg-[#f0f7ff] text-[#0066cc]' : 'border-[#d2d2d7] text-[#6e6e73]'}`}
          title="Quiz"
        >
          <Brain className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('flashcards')}
          className={`p-2 rounded-lg border ${activeTab === 'flashcards' ? 'border-[#0066cc] bg-[#f0f7ff] text-[#0066cc]' : 'border-[#d2d2d7] text-[#6e6e73]'}`}
          title="Flashcards"
        >
          <Layers className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <>
      <aside className="w-[320px] border-r border-[#e0e0e0] bg-white flex flex-col z-10">
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[#8a8a8f]">Notebook</p>
              <h2 className="text-2xl font-semibold text-[#1d1d1f] mt-2 leading-tight break-words">
                {activeNotebook?.title || 'Notebook'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-lg border border-[#d2d2d7] text-[#6e6e73] hover:border-[#0066cc]"
              title="Thu gọn sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-5 rounded-lg border border-[#e0e0e0] p-2">
            <p className="px-2 pb-2 text-xs font-semibold tracking-[0.1em] uppercase text-[#8a8a8f]">Study</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSelectTab && onSelectTab('chat')}
                className={`px-2 py-2 rounded-md text-xs font-medium border ${activeTab === 'chat' ? 'border-[#0066cc] bg-[#f0f7ff] text-[#0066cc]' : 'border-[#d2d2d7] text-[#4a4a4f]'}`}
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => onSelectTab && onSelectTab('quiz')}
                className={`px-2 py-2 rounded-md text-xs font-medium border ${activeTab === 'quiz' ? 'border-[#0066cc] bg-[#f0f7ff] text-[#0066cc]' : 'border-[#d2d2d7] text-[#4a4a4f]'}`}
              >
                Quiz
              </button>
              <button
                type="button"
                onClick={() => onSelectTab && onSelectTab('flashcards')}
                className={`px-2 py-2 rounded-md text-xs font-medium border ${activeTab === 'flashcards' ? 'border-[#0066cc] bg-[#f0f7ff] text-[#0066cc]' : 'border-[#d2d2d7] text-[#4a4a4f]'}`}
              >
                Flashcard
              </button>
            </div>
          </div>

          <label className="mb-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0066cc] text-white text-sm font-medium cursor-pointer active:scale-95 transition-transform">
            <Upload className="w-4 h-4" />
            Nạp tài liệu
            <input
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(event) => {
                const fileList = event.target.files ? Array.from(event.target.files) : [];
                if (fileList.length && onUploadDocument) {
                  onUploadDocument(fileList);
                }
                event.target.value = '';
              }}
            />
          </label>

          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#8a8a8f]">Tài liệu gần đây</h4>
            <BookOpen className="w-4 h-4 text-[#8a8a8f]" />
          </div>

          <div className="space-y-2">
            {sidebarDocs.map((doc, idx) => {
              const isActive = workspaceState === 'workspace' ? (selectedDocument ? selectedDocument.id === doc.id : activeDoc === idx) : false;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    setActiveDoc(idx);
                    if (onSelectDocument) onSelectDocument(documents[idx]);
                  }}
                  className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200 cursor-pointer group
                    ${isActive
                      ? 'bg-[#f5f5f7] border-[#d2d2d7]'
                      : 'bg-transparent hover:bg-[#f5f5f7] border-transparent hover:border-[#e0e0e0]'
                    }`}
                >
                  <File className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-[#0066cc]' : 'text-[#8a8a8f] group-hover:text-[#0066cc]'}`} />
                  <span className={`text-xs truncate transition-colors flex-1 min-w-0 ${isActive ? 'text-[#1d1d1f] font-medium' : 'text-[#4a4a4f]'}`}>
                    {doc.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#eef2ff] text-[#3949ab]">
                    {getStatusLabel(doc.status)}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (onRemoveDocument) onRemoveDocument(documents[idx]);
                    }}
                    className="p-1 rounded-md text-[#c62828] hover:bg-[#fdecec]"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {!sidebarDocs.length && (
              <div className="text-xs text-[#6e6e73] bg-[#f5f5f7] rounded-lg p-3 border border-dashed border-[#d2d2d7]">
                Chưa có tài liệu.
              </div>
            )}
            {!!normalizedDocs.length && (
              <button
                type="button"
                onClick={() => setOpenAllDocs(true)}
                className="inline-flex items-center gap-2 text-xs text-[#0066cc] font-medium px-1 py-1"
              >
                <Settings className="w-3.5 h-3.5" />
                Quản lý tài liệu
              </button>
            )}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold tracking-[0.12em] uppercase text-[#8a8a8f]">Lịch sử chat</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNewChat && onNewChat()}
                  className="text-[11px] text-[#0066cc] font-semibold"
                >
                  New chat
                </button>
                {!!recentHistory.length && (
                  <button
                    type="button"
                    onClick={() => setOpenAllChats(true)}
                    className="text-[11px] text-[#0066cc] font-semibold"
                  >
                    Quản lý
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              {recentHistory.slice(0, RECENT_CHAT_LIMIT).map((item) => {
                const isActive = item.id === activeSessionId;
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border px-2.5 py-2 ${
                      isActive
                        ? 'border-[#0066cc] bg-[#f0f7ff]'
                        : 'border-[#e0e0e0] bg-[#f7f7f9]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRecentChat && onSelectRecentChat(item.id)}
                      className="w-full text-left"
                    >
                      <p className="text-[11px] text-[#3f3f45] truncate">{item.title || item.preview || 'New chat'}</p>
                      <p className="text-[10px] text-[#8a8a8f] mt-0.5 truncate">{item.created_at}</p>
                    </button>
                    <div className="mt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteSingleChat(item.historyId)}
                        className="text-[10px] text-[#c62828]"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
              {!recentHistory.length && <p className="text-xs text-[#6e6e73]">Chưa có lịch sử chat.</p>}
            </div>
          </div>
        </div>
      </aside>

      {openAllDocs && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-6">
          <div className="w-full max-w-3xl bg-white rounded-2xl border border-[#e0e0e0] shadow-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#e0e0e0] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[#1d1d1f]">Tất cả tài liệu</h3>
                <p className="text-sm text-[#6e6e73]">{normalizedDocs.length} tài liệu trong notebook</p>
              </div>
              <button type="button" onClick={() => setOpenAllDocs(false)} className="p-2 rounded-lg border border-[#d2d2d7] text-[#6e6e73]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {normalizedDocs.map((doc, idx) => (
                <div key={doc.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[#e0e0e0] bg-[#f5f5f7]">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectDocument) onSelectDocument(documents[idx]);
                      setOpenAllDocs(false);
                    }}
                    className="flex items-center gap-2 text-left flex-1 min-w-0"
                  >
                    <File className="w-4 h-4 text-[#0066cc] shrink-0" />
                    <span className="text-sm text-[#1d1d1f] truncate">{doc.name}</span>
                  </button>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#eef2ff] text-[#3949ab]">{getStatusLabel(doc.status)}</span>
                  {doc.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => onRetryDocumentIngestion && onRetryDocumentIngestion(documents[idx])}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#f2b8b5] text-[#c62828] text-xs font-medium bg-white"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveDocument && onRemoveDocument(documents[idx])}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#f2b8b5] text-[#c62828] text-xs font-medium bg-white"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa
                  </button>
                </div>
              ))}
              {!normalizedDocs.length && <p className="text-sm text-[#6e6e73]">Chưa có tài liệu trong notebook.</p>}
            </div>
          </div>
        </div>
      )}

      {openAllChats && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#e0e0e0] shadow-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#e0e0e0] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[#1d1d1f]">Quản lý lịch sử chat</h3>
                <p className="text-sm text-[#6e6e73]">{recentHistory.length} lịch sử</p>
              </div>
              <button type="button" onClick={() => setOpenAllChats(false)} className="p-2 rounded-lg border border-[#d2d2d7] text-[#6e6e73]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-3 border-b border-[#e0e0e0] flex justify-end">
              <button
                type="button"
                onClick={handleDeleteAllChats}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#f2b8b5] text-[#c62828] text-sm bg-white"
              >
                <Trash2 className="w-4 h-4" />
                Xóa tất cả
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {recentHistory.map((item) => (
                <div key={item.id} className="p-3 rounded-lg border border-[#e0e0e0] bg-[#f7f7f9]">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectRecentChat) onSelectRecentChat(item.id);
                      setOpenAllChats(false);
                    }}
                    className="w-full text-left"
                  >
                    <p className="text-sm font-medium text-[#1d1d1f] truncate">{item.title || item.preview || 'New chat'}</p>
                    <p className="text-xs text-[#6e6e73] mt-1 truncate">{item.preview || ''}</p>
                    <p className="text-xs text-[#8a8a8f] mt-1">{item.created_at}</p>
                  </button>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteSingleChat(item.historyId)}
                      className="text-xs text-[#c62828]"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
              {!recentHistory.length && <p className="text-sm text-[#6e6e73]">Chưa có lịch sử chat.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
