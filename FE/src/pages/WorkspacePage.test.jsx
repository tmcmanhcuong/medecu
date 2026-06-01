import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WorkspacePage from './WorkspacePage';
import {
  generateNotebookFlashcards,
  generateNotebookQuiz,
  notebookChat,
} from '../services/AI';

vi.mock('../services/book/bookService', () => ({
  getAllBooks: vi.fn().mockResolvedValue({
    data: [
      { id: 'doc-1', file_name: 'Doc One.pdf', ingestion_status: 'ready' },
      { id: 'doc-2', file_name: 'Doc Two.pdf', ingestion_status: 'ready' },
    ],
  }),
  uploadDocument: vi.fn().mockResolvedValue({ message: 'ok' }),
}));

vi.mock('../services/history/historyService', () => ({
  getRecentStudyHistory: vi.fn().mockResolvedValue({
    data: [{ id: 'h1', artifact_type: 'summary', created_at: '2026-05-27T00:00:00Z' }],
  }),
  saveStudyHistory: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock('../services/notebook/notebookService', () => ({
  getNotebookDetail: vi.fn().mockResolvedValue({
    data: { id: 'nb-1', title: 'Notebook Demo' },
  }),
  listNotebookSources: vi.fn().mockResolvedValue({
    data: [
      { id: 'source-1', book_id: 'doc-1', ingestion_status: 'ready' },
      { id: 'source-2', book_id: 'doc-2', ingestion_status: 'ready' },
    ],
  }),
  detachNotebookSource: vi.fn(),
  retryNotebookSourceIngestion: vi.fn(),
}));

vi.mock('../services/AI', () => ({
  generateNotebookQuiz: vi.fn(),
  generateNotebookFlashcards: vi.fn(),
  notebookChat: vi.fn(),
}));

function renderWorkspace(initialEntry = '/workspace?notebookId=nb-1') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/workspace/:notebookId" element={<WorkspacePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('WorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('currentUserId', 'user-1');
  });

  it('renders document list and recent history', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText('Doc One.pdf')).toBeInTheDocument();
    });
    expect(screen.getByText('Tài liệu gần đây')).toBeInTheDocument();
    expect(screen.getByText('Doc Two.pdf')).toBeInTheDocument();
  });

  it('marks the clicked document as selected', async () => {
    renderWorkspace();
    await waitFor(() => {
      expect(screen.getByText('Doc One.pdf')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Doc One.pdf'));
    expect(screen.getByText('Doc One.pdf')).toHaveClass('text-[#1d1d1f]');
    expect(screen.getByText('Doc One.pdf')).toHaveClass('font-medium');
  });

  it('generates quiz through dedicated generator with notebook filter context', async () => {
    generateNotebookQuiz.mockResolvedValueOnce({
      items: [
        {
          question: 'Cau hoi 1',
          options: ['A', 'B', 'C', 'D'],
          correct_index: 1,
          explanation: 'Giai thich',
        },
      ],
      cacheFile: 'quiz-cache.json',
    });

    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Quiz' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Quiz' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tạo quiz' }));

    await waitFor(() => {
      expect(generateNotebookQuiz).toHaveBeenCalledWith(
        'Notebook Demo',
        expect.objectContaining({
          notebookId: 'nb-1',
          limit: 5,
          sourceBookIds: ['doc-1', 'doc-2'],
          sourceFileNames: ['Doc One.pdf', 'Doc Two.pdf'],
          userId: 'user-1',
        })
      );
    });

    expect(notebookChat).not.toHaveBeenCalled();
    expect(await screen.findByText('Cau hoi 1')).toBeInTheDocument();
  });

  it('falls back to notebook chat when dedicated quiz generator returns no items', async () => {
    generateNotebookQuiz.mockResolvedValueOnce({
      items: [],
      cacheFile: null,
    });
    notebookChat.mockResolvedValueOnce({
      data: {
        answer_text: JSON.stringify([
          {
            question: 'Fallback cau hoi',
            options: ['A', 'B', 'C', 'D'],
            correct_index: 0,
            explanation: 'Fallback',
          },
        ]),
      },
    });

    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Quiz' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Quiz' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tạo quiz' }));

    await waitFor(() => {
      expect(notebookChat).toHaveBeenCalledWith(
        'nb-1',
        expect.stringContaining('Tạo 5 câu hỏi quiz từ notebook "Notebook Demo"'),
        null,
        'user-1',
        'quiz'
      );
    });

    expect(await screen.findByText('Fallback cau hoi')).toBeInTheDocument();
  });

  it('generates flashcards through dedicated generator with notebook filter context', async () => {
    generateNotebookFlashcards.mockResolvedValueOnce({
      items: [
        {
          front: 'Mat truoc',
          back: 'Mat sau',
        },
      ],
      cacheFile: 'flashcard-cache.json',
    });

    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Flashcard' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Flashcard' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tạo flashcard' }));

    await waitFor(() => {
      expect(generateNotebookFlashcards).toHaveBeenCalledWith(
        'Notebook Demo',
        expect.objectContaining({
          notebookId: 'nb-1',
          limit: 8,
          sourceBookIds: ['doc-1', 'doc-2'],
          sourceFileNames: ['Doc One.pdf', 'Doc Two.pdf'],
          userId: 'user-1',
        })
      );
    });

    expect(notebookChat).not.toHaveBeenCalled();
    expect(await screen.findByText('Mat truoc')).toBeInTheDocument();
  });

  it('falls back to notebook chat when dedicated flashcard generator returns no items', async () => {
    generateNotebookFlashcards.mockResolvedValueOnce({
      items: [],
      cacheFile: null,
    });
    notebookChat.mockResolvedValueOnce({
      data: {
        answer_text: JSON.stringify([
          {
            front: 'Fallback mat truoc',
            back: 'Fallback mat sau',
          },
        ]),
      },
    });

    renderWorkspace();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Flashcard' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Flashcard' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tạo flashcard' }));

    await waitFor(() => {
      expect(notebookChat).toHaveBeenCalledWith(
        'nb-1',
        expect.stringContaining('Tạo 8 flashcard từ notebook "Notebook Demo"'),
        null,
        'user-1',
        'flashcard'
      );
    });

    expect(await screen.findByText('Fallback mat truoc')).toBeInTheDocument();
  });
});
