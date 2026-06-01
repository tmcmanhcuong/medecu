import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Pencil, Trash2, Plus } from 'lucide-react';
import {
  createNotebook,
  deleteNotebook,
  listNotebooks,
  updateNotebook,
} from '../services/notebook/notebookService';

export default function HomePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState(null);
  const currentUserId = useMemo(
    () => localStorage.getItem('currentUserId') || localStorage.getItem('user_id'),
    []
  );

  const loadNotebooks = async () => {
    if (!currentUserId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await listNotebooks({ userId: currentUserId, pageSize: 50 });
      setItems(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotebooks().catch(() => setLoading(false));
  }, [currentUserId]);

  const submitCreate = async (event) => {
    event.preventDefault();
    if (!title.trim() || !currentUserId) return;
    setSaving(true);
    try {
      await createNotebook({ title: title.trim(), description: '' }, { userId: currentUserId });
      setTitle('');
      await loadNotebooks();
    } finally {
      setSaving(false);
    }
  };

  const submitRename = async (id, oldTitle) => {
    const next = window.prompt('Đổi tên notebook', oldTitle);
    if (!next || !next.trim() || next.trim() === oldTitle) return;
    await updateNotebook(id, { title: next.trim() }, { userId: currentUserId });
    await loadNotebooks();
  };

  const removeNotebook = async (id) => {
    const ok = window.confirm('Xóa notebook này?');
    if (!ok) return;
    await deleteNotebook(id, { userId: currentUserId });
    await loadNotebooks();
  };

  return (
    <div className="min-h-screen bg-surface-parchment dark:bg-surface-tile-2 pt-24 pb-12 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-6">
        <section className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-display-md font-display text-ink dark:text-ink-on-dark tracking-tight">Notebook Library</h1>
            <p className="text-body font-body text-ink-muted-80 dark:text-ink-muted-48 mt-2">
              Quản lý notebook học tập và mở workspace theo từng ngữ cảnh.
            </p>
          </div>
          {currentUserId ? (
            <form onSubmit={submitCreate} className="flex w-full md:w-auto gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên notebook mới"
                className="w-full md:w-72 px-4 py-2.5 rounded-pill border border-divider-hairline dark:border-surface-tile-3 bg-surface-canvas dark:bg-surface-tile-1 text-ink dark:text-ink-on-dark placeholder:text-ink-muted-48 focus:outline focus:outline-2 focus:outline-brand-focus focus:outline-offset-1 transition"
              />
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="btn-primary flex items-center gap-2 px-[18px] py-[10px] disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span className="font-semibold">Tạo</span>
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="btn-primary"
            >
              Đăng nhập
            </button>
          )}
        </section>

        {!currentUserId && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-caption text-amber-900 mb-6">
            Bạn chưa đăng nhập. Vui lòng đăng nhập để tạo và quản lý notebook.
          </div>
        )}

        {loading && (
          <div className="rounded-lg border border-divider-hairline dark:border-surface-tile-3 bg-surface-canvas dark:bg-surface-tile-1 p-8 text-caption text-ink-muted-48">
            Đang tải notebooks...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-lg border border-dashed border-divider-hairline dark:border-surface-tile-3 bg-surface-canvas/50 dark:bg-surface-tile-1/50 p-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto text-ink-muted-48 dark:text-ink-muted-80 mb-4" />
            <p className="text-body font-body text-ink-muted-80 dark:text-ink-muted-48">Bạn chưa có notebook nào. Tạo notebook đầu tiên để bắt đầu.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
            {items.map((item) => (
              <article key={item.id} className="group rounded-lg border border-divider-hairline dark:border-surface-tile-3 bg-surface-canvas dark:bg-surface-tile-1 p-[24px] card-hover">
                <button
                  type="button"
                  onClick={() => navigate(`/workspace?notebookId=${item.id}`)}
                  className="text-left w-full block mb-6"
                >
                  <p className="text-body-strong font-body font-semibold text-ink dark:text-ink-on-dark group-hover:text-brand dark:group-hover:text-brand-on-dark transition-colors">{item.title}</p>
                  <p className="text-caption font-body text-ink-muted-48 dark:text-ink-muted-80 mt-1">
                    Cập nhật: {item.updated_at || item.created_at}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => submitRename(item.id, item.title)}
                    className="btn-pearl-capsule dark:bg-surface-tile-2 dark:border-surface-tile-3 dark:text-ink-on-dark transition-colors"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Đổi tên
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNotebook(item.id)}
                    className="btn-pearl-capsule text-red-600 dark:bg-surface-tile-2 dark:border-surface-tile-3 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
