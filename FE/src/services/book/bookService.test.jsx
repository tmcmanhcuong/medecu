import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllBooks, getBookById, uploadDocument } from './bookService.jsx';

describe('bookService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('currentUserId', 'user-1');
  });

  it('getAllBooks appends user_id when available', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'ok', data: [] }),
    });
    await getAllBooks(1, 10);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('user_id=user-1'),
      expect.any(Object)
    );
  });

  it('getBookById includes user_id query', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'ok', data: {} }),
    });
    await getBookById('book-1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/books/book-1?user_id=user-1'),
      expect.any(Object)
    );
  });

  it('uploadDocument sends form data', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'ok' }),
    });
    const file = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    await uploadDocument('user-1', file);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/books/upload'),
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
    );
  });
});
