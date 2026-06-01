import React, { useEffect, useState } from 'react';
import { NotebookPen, Save, RefreshCw } from 'lucide-react';
import { createNote, getUserNotes, updateNote } from '../../../services/note/noteService';

export default function NotesTab({ selectedDocument, notebookId, activeNotebook }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const currentUserId = localStorage.getItem('currentUserId') || localStorage.getItem('user_id');

  const loadNotes = async () => {
    if (!currentUserId || !selectedDocument?.id) {
      setNotes([]);
      return;
    }
    setLoading(true);
    try {
      const response = await getUserNotes(currentUserId, {
        page: 1,
        page_size: 20,
        book_id: selectedDocument.id,
        notebook_id: notebookId,
      });
      setNotes(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes().catch(() => {});
  }, [currentUserId, selectedDocument?.id, notebookId]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !content.trim() || !selectedDocument?.id || !currentUserId) return;
    if (editingId) {
      await updateNote(editingId, { title, content });
    } else {
      await createNote(currentUserId, {
        title,
        content,
        book_id: selectedDocument.id,
        notebook_id: notebookId,
      });
    }
    resetForm();
    await loadNotes();
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <NotebookPen className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">Ghi chú theo tài liệu</h2>
            <p className="text-sm text-gray-500">
              {selectedDocument
                ? `Notebook: ${activeNotebook?.title || notebookId} - Tài liệu: ${selectedDocument.file_name || selectedDocument.title}`
                : 'Hãy chọn một tài liệu để bắt đầu ghi chú'}
            </p>
          </div>
        </div>
        <button
          onClick={() => loadNotes()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Tải lại
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px,1fr] gap-6 h-full">
        <form onSubmit={handleSubmit} className="bg-white/80 border border-gray-200 rounded-2xl p-5 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề ghi chú"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung ghi chú..."
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!selectedDocument?.id}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Cập nhật' : 'Lưu ghi chú'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl border border-gray-300 bg-white"
              >
                Hủy
              </button>
            )}
          </div>
        </form>

        <div className="bg-white/70 border border-gray-200 rounded-2xl p-5 overflow-y-auto custom-scrollbar">
          {loading && <p className="text-sm text-gray-500">Đang tải ghi chú...</p>}
          {!loading && notes.length === 0 && (
            <p className="text-sm text-gray-500">Chưa có ghi chú cho tài liệu này.</p>
          )}
          <div className="space-y-3">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => {
                  setEditingId(note.id);
                  setTitle(note.title);
                  setContent(note.content);
                }}
                className="w-full text-left p-4 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-50"
              >
                <p className="font-semibold text-amber-900">{note.title}</p>
                <p className="text-sm text-amber-800 mt-1 line-clamp-3">{note.content}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
