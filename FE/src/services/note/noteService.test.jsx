import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { createNote, getUserNotes, updateNote } from './noteService.jsx';

vi.mock('axios');

describe('noteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createNote sends document context fields', async () => {
    axios.post.mockResolvedValue({ data: { message: 'ok', data: {} } });
    await createNote('user-1', {
      title: 'N1',
      content: 'C1',
      book_id: 'book-1',
      source_page: 3,
      source_excerpt: 'excerpt',
    });
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/notes/'),
      expect.objectContaining({
        title: 'N1',
        content: 'C1',
        book_id: 'book-1',
        source_page: 3,
        source_excerpt: 'excerpt',
      }),
      expect.objectContaining({ params: { user_id: 'user-1' } })
    );
  });

  it('getUserNotes includes optional book_id filter', async () => {
    axios.get.mockResolvedValue({ data: { message: 'ok', data: [], pagination: {} } });
    await getUserNotes('user-1', { page: 1, page_size: 10, book_id: 'book-1' });
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/notes/'),
      expect.objectContaining({
        params: expect.objectContaining({ user_id: 'user-1', book_id: 'book-1' }),
      })
    );
  });

  it('updateNote sends patch payload only', async () => {
    axios.patch.mockResolvedValue({ data: { message: 'ok', data: {} } });
    await updateNote('note-1', { title: 'Updated', content: 'Body' });
    expect(axios.patch).toHaveBeenCalledWith(
      expect.stringContaining('/notes/note-1'),
      expect.objectContaining({ title: 'Updated', content: 'Body' }),
      expect.any(Object)
    );
  });
});
