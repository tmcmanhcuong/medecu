import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import ChatTab from '../components/workspace/tabs/ChatTab';
import QuizTab from '../components/workspace/tabs/QuizTab';
import FlashcardsTab from '../components/workspace/tabs/FlashcardsTab';
import { getAllBooks, uploadDocument } from '../services/book/bookService';
import {
  clearStudyHistory,
  deleteStudyHistoryItem,
  getRecentStudyHistory,
  saveStudyHistory,
} from '../services/history/historyService';
import {
  detachNotebookSource,
  getNotebookDetail,
  listNotebookSources,
  retryNotebookSourceIngestion,
} from '../services/notebook/notebookService';
import {
  generateNotebookFlashcards,
  generateNotebookQuiz,
  notebookChat,
} from '../services/AI';

const DEFAULT_ASSISTANT_CONTENT = 'Xin chào, mình là Edumate người hỗ trợ thông minh của bạn. Hãy hỏi mình bất cứ điều gì liên quan đến tài liệu nhé';

const normalizeIngestionStatus = (status, fallback = 'queued') => {
  const value = String(status || '').trim().toLowerCase();
  if (!value) return fallback;
  if (['ready', 'indexed', 'completed', 'complete', 'succeeded', 'success'].includes(value)) {
    return 'ready';
  }
  if (['failed', 'error', 'errored'].includes(value)) {
    return 'failed';
  }
  if (['queued', 'uploaded', 'pending'].includes(value)) {
    return 'queued';
  }
  if (['processing', 'ingesting', 'running', 'in_progress'].includes(value)) {
    return 'processing';
  }
  return fallback;
};

const parseJsonSafe = (value, fallback = {}) => {
  try {
    return JSON.parse(value || '{}');
  } catch {
    return fallback;
  }
};

const normalizeMessageRole = (role) => {
  if (role === 'assistant' || role === 'ai') return 'ai';
  return 'user';
};

const toMs = (value) => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
};

const buildChatSessionsFromHistory = (historyRows = []) => {
  const grouped = new Map();

  historyRows
    .filter((row) => row.artifact_type === 'chat')
    .forEach((row) => {
      const payload = parseJsonSafe(row.payload, {});
      const threadId = payload.thread_id || row.id;
      const role = normalizeMessageRole(payload.role);
      const content = payload.content || '';

      if (!content) return;

      if (!grouped.has(threadId)) {
        grouped.set(threadId, {
          id: threadId,
          title: 'New chat',
          messages: [],
          lastMessageAt: row.created_at,
          historyIds: [],
        });
      }

      const item = grouped.get(threadId);
      item.historyIds.push(row.id);
      item.messages.push({
        id: payload.message_id || row.id,
        role,
        content,
        citations: Array.isArray(payload.citations) ? payload.citations : [],
        createdAt: payload.created_at_client || row.created_at,
      });

      const itemTime = toMs(payload.created_at_client || row.created_at);
      const lastTime = toMs(item.lastMessageAt);
      if (itemTime > lastTime) {
        item.lastMessageAt = payload.created_at_client || row.created_at;
      }
    });

  const sessions = Array.from(grouped.values())
    .map((session) => {
      const sortedMessages = [...session.messages].sort(
        (a, b) => toMs(a.createdAt) - toMs(b.createdAt)
      );
      const firstUserContent = sortedMessages.find((msg) => msg.role === 'user')?.content || '';
      return {
        ...session,
        title: firstUserContent ? firstUserContent.slice(0, 48) : 'New chat',
        messages: sortedMessages.length
          ? sortedMessages.map(({ createdAt, ...rest }) => rest)
          : [{ role: 'ai', content: DEFAULT_ASSISTANT_CONTENT, citations: [] }],
        lastMessageAt: session.lastMessageAt || new Date().toISOString(),
      };
    })
    .sort((a, b) => toMs(b.lastMessageAt) - toMs(a.lastMessageAt));

  return sessions;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ARTIFACT_STORAGE_PREFIX = 'edumate_workspace_artifacts';

const extractJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidates = [];

  if (fenced?.[1]) candidates.push(fenced[1].trim());
  candidates.push(trimmed);

  for (const candidate of candidates) {
    const directStart = candidate.startsWith('[') && candidate.endsWith(']');
    if (directStart) {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // continue
      }
    }

    const firstBracket = candidate.indexOf('[');
    const lastBracket = candidate.lastIndexOf(']');
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      try {
        const parsed = JSON.parse(candidate.slice(firstBracket, lastBracket + 1));
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // continue
      }
    }
  }

  return null;
};

const toPreviewText = (value, limit = 500) => {
  if (value == null) return '';
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const normalizeQuizItems = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      question: String(item?.question || item?.text || item?.prompt || '').trim(),
      options: Array.isArray(item?.options)
        ? item.options.map((opt) => String(opt).trim()).filter(Boolean).slice(0, 4)
        : [],
      correct_index: Number.isInteger(item?.correct_index)
        ? item.correct_index
        : Number.isInteger(item?.answer_index)
          ? item.answer_index
          : 0,
      explanation: String(item?.explanation || item?.reason || '').trim(),
    }))
    .filter((item) => item.question && item.options.length >= 2);
};

const normalizeFlashcardItems = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      front: String(item?.front || item?.question || item?.term || '').trim(),
      back: String(item?.back || item?.answer || item?.explanation || '').trim(),
    }))
    .filter((item) => item.front && item.back);
};

const isPersistableQuizSet = (set) =>
  set && set.status !== 'generating' && Array.isArray(set.questions) && set.questions.length > 0;

const isPersistableFlashcardSet = (set) =>
  set && set.status !== 'generating' && Array.isArray(set.cards) && set.cards.length > 0;

const getArtifactStorageKey = (userId, notebookId) =>
  `${ARTIFACT_STORAGE_PREFIX}:${userId || 'anonymous'}:${notebookId || 'unknown'}`;

const loadArtifactState = (userId, notebookId) => {
  if (!userId || !notebookId) {
    return {
      quizSets: [],
      flashcardSets: [],
      selectedQuizSetId: null,
      selectedFlashcardSetId: null,
      activeTab: 'chat',
    };
  }

  try {
    const raw = localStorage.getItem(getArtifactStorageKey(userId, notebookId));
    if (!raw) {
      return {
        quizSets: [],
        flashcardSets: [],
        selectedQuizSetId: null,
        selectedFlashcardSetId: null,
        activeTab: 'chat',
      };
    }

    const parsed = JSON.parse(raw);
    const quizSets = Array.isArray(parsed.quizSets)
      ? parsed.quizSets.filter(isPersistableQuizSet)
      : [];
    const flashcardSets = Array.isArray(parsed.flashcardSets)
      ? parsed.flashcardSets.filter(isPersistableFlashcardSet)
      : [];

    return {
      quizSets,
      flashcardSets,
      selectedQuizSetId: quizSets.some((set) => set.id === parsed.selectedQuizSetId)
        ? parsed.selectedQuizSetId
        : quizSets[0]?.id || null,
      selectedFlashcardSetId: flashcardSets.some((set) => set.id === parsed.selectedFlashcardSetId)
        ? parsed.selectedFlashcardSetId
        : flashcardSets[0]?.id || null,
      activeTab: typeof parsed.activeTab === 'string' ? parsed.activeTab : 'chat',
    };
  } catch {
    return {
      quizSets: [],
      flashcardSets: [],
      selectedQuizSetId: null,
      selectedFlashcardSetId: null,
      activeTab: 'chat',
    };
  }
};

const saveArtifactState = (userId, notebookId, state) => {
  if (!userId || !notebookId) return;
  try {
    localStorage.setItem(
      getArtifactStorageKey(userId, notebookId),
      JSON.stringify({
        quizSets: (state.quizSets || []).filter(isPersistableQuizSet),
        flashcardSets: (state.flashcardSets || []).filter(isPersistableFlashcardSet),
        selectedQuizSetId: (state.quizSets || []).some((set) => set.id === state.selectedQuizSetId && isPersistableQuizSet(set))
          ? state.selectedQuizSetId
          : null,
        selectedFlashcardSetId: (state.flashcardSets || []).some((set) => set.id === state.selectedFlashcardSetId && isPersistableFlashcardSet(set))
          ? state.selectedFlashcardSetId
          : null,
        activeTab: state.activeTab || 'chat',
      })
    );
  } catch {
    // Ignore localStorage failures; artifacts still work in-memory.
  }
};

export default function WorkspacePage() {
  const { notebookId: notebookIdFromPath } = useParams();
  const [searchParams] = useSearchParams();
  const notebookId = notebookIdFromPath || searchParams.get('notebookId');
  const [workspaceState, setWorkspaceState] = useState('workspace');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [notebookMissing, setNotebookMissing] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const defaultAssistantMessage = {
    role: 'ai',
    content: DEFAULT_ASSISTANT_CONTENT,
    citations: [],
  };
  const createChatSession = (title = 'New chat') => ({
    id: crypto.randomUUID(),
    title,
    messages: [defaultAssistantMessage],
  });
  const [chatSessions, setChatSessions] = useState([createChatSession()]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [quizSets, setQuizSets] = useState([]);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedQuizSetId, setSelectedQuizSetId] = useState(null);
  const [selectedFlashcardSetId, setSelectedFlashcardSetId] = useState(null);
  const [artifactsHydrated, setArtifactsHydrated] = useState(false);

  const currentUserId = localStorage.getItem('currentUserId') || localStorage.getItem('user_id');
  const persistArtifacts = ({
    nextQuizSets = quizSets,
    nextFlashcardSets = flashcardSets,
    nextSelectedQuizSetId = selectedQuizSetId,
    nextSelectedFlashcardSetId = selectedFlashcardSetId,
    nextActiveTab = activeTab,
  }) => {
    saveArtifactState(currentUserId, notebookId, {
      quizSets: nextQuizSets,
      flashcardSets: nextFlashcardSets,
      selectedQuizSetId: nextSelectedQuizSetId,
      selectedFlashcardSetId: nextSelectedFlashcardSetId,
      activeTab: nextActiveTab,
    });
  };

  const refreshLibrary = async () => {
    let docItems = [];
    try {
      const detail = await getNotebookDetail(notebookId, { userId: currentUserId });
      setActiveNotebook(detail.data || null);
      const memberships = await listNotebookSources(notebookId, { userId: currentUserId });
      const sourceRows = memberships.data || [];
      const sourceIds = new Set(sourceRows.map((item) => item.book_id));
      const sourceByBookId = new Map(
        sourceRows.map((item) => [item.book_id, item])
      );
      const docs = await getAllBooks(1, 100);
      docItems = (docs.data || [])
        .filter((item) => sourceIds.has(item.id))
        .map((item) => {
          const source = sourceByBookId.get(item.id);
          const bookStatus = normalizeIngestionStatus(item.ingestion_status, 'queued');
          const sourceStatus = normalizeIngestionStatus(source?.ingestion_status, 'queued');
          let mergedStatus = 'processing';
          if (bookStatus === 'failed' || sourceStatus === 'failed') {
            mergedStatus = 'failed';
          } else if (bookStatus === 'ready' && sourceStatus !== 'failed') {
            mergedStatus = 'ready';
          } else if (['queued', 'uploaded'].includes(bookStatus) || ['queued', 'uploaded'].includes(sourceStatus)) {
            mergedStatus = 'queued';
          }
          const mergedError = source?.ingestion_error || item.ingestion_error || '';
          return {
            ...item,
            notebook_source_id: source?.id,
            ingestion_status: mergedStatus,
            ingestion_error: mergedError,
            book_ingestion_status: bookStatus,
            notebook_source_ingestion_status: sourceStatus,
            ingestion_job_id: source?.ingestion_job_id || '',
          };
        });
      setNotebookMissing(false);
    } catch {
      setNotebookMissing(true);
      docItems = [];
    }
    setDocuments(docItems);
    if (currentUserId) {
      const history = await getRecentStudyHistory(currentUserId, { notebookId, limit: 100 });
      const sessionsFromHistory = buildChatSessionsFromHistory(history.data || []);

      if (sessionsFromHistory.length) {
        setChatSessions(sessionsFromHistory);
        setRecentHistory(sessionsFromHistory.slice(0, 10).map((session) => {
          const lastMessage = session.messages[session.messages.length - 1];
          return {
            id: session.id,
            historyIds: session.historyIds || [],
            historyId: session.historyIds?.[0] || session.id,
            title: session.title,
            preview: lastMessage?.content || '',
            created_at: new Date(session.lastMessageAt).toLocaleString(),
          };
        }));
      } else {
        const fallbackSession = createChatSession();
        setChatSessions([fallbackSession]);
        setRecentHistory([]);
      }
    } else {
      setRecentHistory([]);
    }
  };

  React.useEffect(() => {
    refreshLibrary().catch(() => { });
  }, [currentUserId, notebookId]);

  React.useEffect(() => {
    setArtifactsHydrated(false);
    const restored = loadArtifactState(currentUserId, notebookId);
    setQuizSets(restored.quizSets);
    setFlashcardSets(restored.flashcardSets);
    setSelectedQuizSetId(restored.selectedQuizSetId);
    setSelectedFlashcardSetId(restored.selectedFlashcardSetId);
    setActiveTab(restored.activeTab || 'chat');
    setArtifactsHydrated(true);
  }, [currentUserId, notebookId]);

  React.useEffect(() => {
    const hasPendingDocs = documents.some((doc) =>
      ['queued', 'processing', 'uploaded'].includes(doc.ingestion_status)
    );
    if (!hasPendingDocs) return undefined;

    const interval = setInterval(() => {
      refreshLibrary().catch(() => { });
    }, 8000);

    return () => clearInterval(interval);
  }, [documents, currentUserId, notebookId]);

  React.useEffect(() => {
    if (!activeSessionId && chatSessions.length > 0) {
      setActiveSessionId(chatSessions[0].id);
    }
  }, [activeSessionId, chatSessions]);

  React.useEffect(() => {
    if (!chatSessions.length) return;
    const exists = chatSessions.some((session) => session.id === activeSessionId);
    if (!exists) {
      setActiveSessionId(chatSessions[0].id);
    }
  }, [activeSessionId, chatSessions]);

  React.useEffect(() => {
    if (!artifactsHydrated) return;
    saveArtifactState(currentUserId, notebookId, {
      quizSets,
      flashcardSets,
      selectedQuizSetId,
      selectedFlashcardSetId,
      activeTab,
    });
  }, [artifactsHydrated, currentUserId, notebookId, quizSets, flashcardSets, selectedQuizSetId, selectedFlashcardSetId, activeTab]);

  const handleFileUpload = async (files) => {
    const fileList = Array.isArray(files) ? files : [files];
    if (!fileList.length) return;
    setWorkspaceState('processing');
    try {
      if (!currentUserId) {
        throw new Error('Missing user id');
      }
      for (const file of fileList) {
        const uploadResponse = await uploadDocument(currentUserId, file, notebookId);
        const uploadedDoc = uploadResponse?.data;
        if (uploadedDoc?.id) {
          setDocuments((prev) => {
            const exists = prev.some((item) => item.id === uploadedDoc.id);
            if (exists) return prev;
            return [uploadedDoc, ...prev];
          });
          setSelectedDocument(uploadedDoc);
        }
      }
      await refreshLibrary();
      setWorkspaceState('workspace');
    } catch {
      setWorkspaceState('workspace');
    }
  };

  const handleSelectDocument = (doc) => {
    setSelectedDocument(doc);
    setWorkspaceState('workspace');
  };

  const handleRemoveDocument = async (doc) => {
    if (!doc?.id || !currentUserId || !notebookId) return;
    const confirmed = window.confirm(`Xóa tài liệu "${doc.file_name || doc.title}" khỏi notebook này?`);
    if (!confirmed) return;
    await detachNotebookSource(notebookId, doc.id, { userId: currentUserId });
    if (selectedDocument?.id === doc.id) {
      setSelectedDocument(null);
    }
    await refreshLibrary();
  };

  const handleRetryDocumentIngestion = async (doc) => {
    if (!doc?.id || !currentUserId || !notebookId) return;
    await retryNotebookSourceIngestion(notebookId, doc.id, { userId: currentUserId });
    await refreshLibrary();
  };

  const handleRecoverNotebookSources = async () => {
    if (!currentUserId || !notebookId) return;
    const shouldRetryStatus = (status) =>
      ['queued', 'processing', 'uploaded', 'pending', 'ingesting', 'running', 'in_progress'].includes(
        normalizeIngestionStatus(status, 'queued')
      );
    const maxRounds = 6;
    const pollMs = 1500;
    let totalRetried = 0;
    let pendingSources = [];

    for (let round = 0; round < maxRounds; round += 1) {
      const memberships = await listNotebookSources(notebookId, { userId: currentUserId });
      const sourceRows = memberships.data || [];
      pendingSources = sourceRows.filter((source) => shouldRetryStatus(source.ingestion_status));
      if (!pendingSources.length) {
        await refreshLibrary();
        return { pendingCount: 0, retriedCount: totalRetried, rounds: round + 1 };
      }

      const retryResults = await Promise.allSettled(
        pendingSources.map((source) =>
          retryNotebookSourceIngestion(notebookId, source.book_id, { userId: currentUserId })
        )
      );
      totalRetried += pendingSources.length;

      const hasFulfilled = retryResults.some((result) => result.status === 'fulfilled');
      if (!hasFulfilled) {
        await refreshLibrary();
        return {
          pendingCount: pendingSources.length,
          retriedCount: totalRetried,
          rounds: round + 1,
          blocked: true,
        };
      }

      await wait(pollMs);
    }

    await refreshLibrary();
    return {
      pendingCount: pendingSources.length,
      retriedCount: totalRetried,
      rounds: maxRounds,
      timedOut: true,
    };
  };

  const handleChatSuccess = async ({ mode, threadId, messages = [], providerMetadata }) => {
    if (!currentUserId || !notebookId) return;
    try {
      for (const message of messages) {
        const payload = JSON.stringify({
          thread_id: threadId,
          message_id: message.id || crypto.randomUUID(),
          role: message.role === 'ai' ? 'assistant' : 'user',
          content: message.content,
          citations: message.citations || [],
          provider_metadata: providerMetadata || {},
          mode: mode || 'chat',
          notebook_id: notebookId,
          created_at_client: new Date().toISOString(),
        });
        await saveStudyHistory(currentUserId, {
          artifact_type: 'chat',
          activity_type: mode || 'chat',
          payload,
          notebook_id: notebookId,
        });
      }
      await refreshLibrary();
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const activeSession = chatSessions.find((item) => item.id === activeSessionId) || chatSessions[0];
  const activeChatMessages = activeSession?.messages || [defaultAssistantMessage];
  const setActiveChatMessages = (updater) => {
    setChatSessions((prev) =>
      prev.map((session) => {
        if (session.id !== activeSession.id) return session;
        const nextMessages =
          typeof updater === 'function' ? updater(session.messages) : updater;
        const titleCandidate = nextMessages.find((msg) => msg.role === 'user')?.content;
        return {
          ...session,
          title: titleCandidate ? titleCandidate.slice(0, 48) : session.title,
          messages: nextMessages,
        };
      })
    );
  };

  const handleNewChat = () => {
    const session = createChatSession();
    setChatSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setActiveTab('chat');
  };

  const handleSelectRecentChat = (sessionId) => {
    setActiveSessionId(sessionId);
    setActiveTab('chat');
  };

  const handleDeleteRecentChat = async (historyIds = []) => {
    if (!currentUserId) return;
    const list = Array.isArray(historyIds) ? historyIds : [historyIds];
    await Promise.allSettled(
      list.filter(Boolean).map((id) => deleteStudyHistoryItem(currentUserId, id))
    );
    await refreshLibrary();
  };

  const handleClearRecentChats = async () => {
    if (!currentUserId || !notebookId) return;
    await clearStudyHistory(currentUserId, { notebookId, artifactType: 'chat' });
    await refreshLibrary();
  };

  const deleteArtifactSet = (type, setId) => {
    if (!setId) return;
    const confirmed = window.confirm(
      type === 'quiz'
        ? 'Xóa bộ quiz này? Hành động này không thể hoàn tác.'
        : 'Xóa bộ flashcard này? Hành động này không thể hoàn tác.'
    );
    if (!confirmed) return;

    if (type === 'quiz') {
      setQuizSets((prev) => {
        const next = prev.filter((set) => set.id !== setId);
        const nextSelectedQuizSetId =
          selectedQuizSetId === setId ? next[0]?.id || null : selectedQuizSetId;
        persistArtifacts({
          nextQuizSets: next,
          nextSelectedQuizSetId,
        });
        return next;
      });
      if (selectedQuizSetId === setId) {
        const next = quizSets.filter((set) => set.id !== setId);
        setSelectedQuizSetId(next[0]?.id || null);
      }
      return;
    }

    setFlashcardSets((prev) => {
      const next = prev.filter((set) => set.id !== setId);
      const nextSelectedFlashcardSetId =
        selectedFlashcardSetId === setId ? next[0]?.id || null : selectedFlashcardSetId;
      persistArtifacts({
        nextFlashcardSets: next,
        nextSelectedFlashcardSetId,
      });
      return next;
    });
    if (selectedFlashcardSetId === setId) {
      const next = flashcardSets.filter((set) => set.id !== setId);
      setSelectedFlashcardSetId(next[0]?.id || null);
    }
  };

  const generateArtifact = async (type) => {
    if (!activeNotebook?.title) return;
    if (!currentUserId) {
      throw new Error('Missing user id');
    }

    const setId = crypto.randomUUID();
    const debugInfo = {
      type,
      notebookId,
      notebookTitle: activeNotebook.title,
      startedAt: new Date().toISOString(),
      attempts: [],
    };
    const baseSet = {
      id: setId,
      title: `${type === 'quiz' ? 'Quiz' : 'Flashcard'} • ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      cacheFile: null,
      sourceTitle: activeNotebook.title,
      origin: 'notebook_chat_fallback',
      status: 'generating',
    };

    if (type === 'quiz') {
      const pendingSet = { ...baseSet, questions: [] };
      setQuizSets((prev) => {
        const next = [pendingSet, ...prev];
        persistArtifacts({
          nextQuizSets: next,
          nextSelectedQuizSetId: setId,
          nextActiveTab: 'quiz',
        });
        return next;
      });
      setSelectedQuizSetId(setId);
      setActiveTab('quiz');
    } else {
      const pendingSet = { ...baseSet, cards: [] };
      setFlashcardSets((prev) => {
        const next = [pendingSet, ...prev];
        persistArtifacts({
          nextFlashcardSets: next,
          nextSelectedFlashcardSetId: setId,
          nextActiveTab: 'flashcards',
        });
        return next;
      });
      setSelectedFlashcardSetId(setId);
      setActiveTab('flashcards');
    }

    const readyDocuments = documents.filter((doc) => doc.ingestion_status === 'ready');
    const sourceBookIds = readyDocuments.map((doc) => doc.id).filter(Boolean);
    const sourceFileNames = readyDocuments
      .map((doc) => doc.file_name || doc.title || doc.query_id || '')
      .filter(Boolean);
    const sourceContext = sourceFileNames.length
      ? `Chỉ dùng ngữ cảnh từ các tài liệu sau trong notebook này: ${sourceFileNames.join(', ')}.`
      : 'Chỉ dùng ngữ cảnh từ các tài liệu đã gắn với notebook này.';

    const fallbackPrompt =
      type === 'quiz'
        ? `Tạo 5 câu hỏi quiz từ notebook "${activeNotebook.title}". ${sourceContext} Không dùng tài liệu ngoài notebook, không suy diễn từ knowledge base khác. Chỉ trả về JSON array theo schema [{ "question": string, "options": [string, string, string, string], "correct_index": number, "explanation": string }]. Không trả markdown.`
        : `Tạo 8 flashcard từ notebook "${activeNotebook.title}". ${sourceContext} Không dùng tài liệu ngoài notebook, không suy diễn từ knowledge base khác. Chỉ trả về JSON array theo schema [{ "front": string, "back": string }]. Không trả markdown.`;

    try {
      const response =
        type === 'quiz'
          ? await generateNotebookQuiz(activeNotebook.title, {
              limit: 5,
              userId: currentUserId,
              notebookId,
              sourceBookIds,
              sourceFileNames,
            })
          : await generateNotebookFlashcards(activeNotebook.title, {
              limit: 8,
              userId: currentUserId,
              notebookId,
              sourceBookIds,
              sourceFileNames,
            });

      const dedicatedPayload = {
        chapter_title: activeNotebook.title,
        notebook_id: notebookId,
        source_book_ids: sourceBookIds,
        source_file_names: sourceFileNames,
        limit: type === 'quiz' ? 5 : 8,
        user_id: currentUserId,
      };
      let items = Array.isArray(response.items) ? response.items : [];
      let origin = 'api';
      let cacheFile = response.cacheFile;
      debugInfo.attempts.push({
        step: 'dedicated_api',
        endpoint: type === 'quiz' ? '/ai/generating-quizz' : '/ai/generating-flashcard',
        requestPayload: dedicatedPayload,
        itemCount: items.length,
        cacheFile: response.cacheFile || null,
        responsePreview: toPreviewText(response.raw || response),
      });
      console.log(`🧪 ${type} dedicated_api`, {
        notebookId,
        requestPayload: dedicatedPayload,
        itemCount: items.length,
        cacheFile: response.cacheFile || null,
        response,
      });

      if (!items.length) {
        const fallbackPayload = {
          notebook_id: notebookId,
          user_message: fallbackPrompt,
          action_type: type,
          user_id: currentUserId,
        };
        const artifactResponse = await notebookChat(notebookId, fallbackPrompt, null, currentUserId, type);
        const answerText = artifactResponse?.data?.answer_text || '';
        const parsed = extractJsonArray(answerText);
        items = Array.isArray(parsed) ? parsed : [];
        origin = 'notebook_chat_fallback';
        cacheFile = null;
        debugInfo.attempts.push({
          step: 'notebook_chat_fallback',
          actionType: type,
          endpoint: '/ai/notebook-chat',
          requestPayload: fallbackPayload,
          answerLength: answerText.length,
          parsedCount: items.length,
          answerPreview: toPreviewText(answerText),
          providerMetadataPreview: toPreviewText(artifactResponse?.data?.provider_metadata),
        });
        console.log(`🧪 ${type} notebook_chat_fallback`, {
          notebookId,
          requestPayload: fallbackPayload,
          parsedCount: items.length,
          answerText,
          providerMetadata: artifactResponse?.data?.provider_metadata,
        });
      }

      if (!items.length) {
        throw new Error(`API không trả về dữ liệu ${type}`);
      }

      debugInfo.finalOrigin = origin;
      debugInfo.completedAt = new Date().toISOString();
      debugInfo.finalItemCount = items.length;

      if (type === 'quiz') {
        const normalizedQuestions = normalizeQuizItems(items);
        if (!normalizedQuestions.length) {
          throw new Error('Quiz data không đúng schema mong đợi');
        }
        setQuizSets((prev) =>
          {
            const next = prev.map((set) =>
              set.id === setId
                ? {
                    ...set,
                    questions: normalizedQuestions,
                    cacheFile,
                    origin,
                    status: 'ready',
                    debugInfo,
                  }
                : set
            );
            persistArtifacts({
              nextQuizSets: next,
              nextSelectedQuizSetId: setId,
              nextActiveTab: 'quiz',
            });
            return next;
          }
        );
      } else {
        const normalizedCards = normalizeFlashcardItems(items);
        if (!normalizedCards.length) {
          throw new Error('Flashcard data không đúng schema mong đợi');
        }
        setFlashcardSets((prev) =>
          {
            const next = prev.map((set) =>
              set.id === setId
                ? {
                    ...set,
                    cards: normalizedCards,
                    cacheFile,
                    origin,
                    status: 'ready',
                    debugInfo,
                  }
                : set
            );
            persistArtifacts({
              nextFlashcardSets: next,
              nextSelectedFlashcardSetId: setId,
              nextActiveTab: 'flashcards',
            });
            return next;
          }
        );
      }
    } catch (error) {
      debugInfo.completedAt = new Date().toISOString();
      debugInfo.error = error.message || `Không thể tạo ${type}`;
      if (type === 'quiz') {
        setQuizSets((prev) =>
          {
            const next = prev.map((set) =>
              set.id === setId
                ? {
                    ...set,
                    status: 'failed',
                    errorMessage: error.message || 'Không thể tạo quiz',
                    debugInfo,
                  }
                : set
            );
            persistArtifacts({
              nextQuizSets: next,
              nextSelectedQuizSetId: setId,
              nextActiveTab: 'quiz',
            });
            return next;
          }
        );
      } else {
        setFlashcardSets((prev) =>
          {
            const next = prev.map((set) =>
              set.id === setId
                ? {
                    ...set,
                    status: 'failed',
                    errorMessage: error.message || 'Không thể tạo flashcard',
                    debugInfo,
                  }
                : set
            );
            persistArtifacts({
              nextFlashcardSets: next,
              nextSelectedFlashcardSetId: setId,
              nextActiveTab: 'flashcards',
            });
            return next;
          }
        );
      }
      throw error;
    }
  };

  return (
    <div className="h-full min-h-0 bg-[#f5f5f7] text-[#1d1d1f] flex relative overflow-hidden font-sans">

      <WorkspaceSidebar
        workspaceState={workspaceState}
        onSelectDocument={handleSelectDocument}
        onUploadDocument={handleFileUpload}
        onRemoveDocument={handleRemoveDocument}
        documents={documents}
        selectedDocument={selectedDocument}
        recentHistory={recentHistory}
        onSelectRecentChat={handleSelectRecentChat}
        onDeleteRecentChat={(historyId) => {
          const target = recentHistory.find((item) => item.historyId === historyId);
          return handleDeleteRecentChat(target?.historyIds || historyId);
        }}
        onClearRecentChats={handleClearRecentChats}
        activeSessionId={activeSessionId}
        activeNotebook={activeNotebook}
        onRetryDocumentIngestion={handleRetryDocumentIngestion}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNewChat={handleNewChat}
      />

      <main className="flex-1 relative z-10 flex flex-col min-h-0 overflow-hidden">
        <WorkspaceHeader activeNotebook={activeNotebook} />

        <div className="flex-1 min-h-0 overflow-hidden px-0 py-0 flex flex-col relative custom-scrollbar">
          {notebookMissing && (
            <div className="rounded-xl border border-[#f0c75e] bg-[#fff9e6] p-4 text-sm text-[#8a5a2b] m-6">
              Notebook không tồn tại hoặc bạn không có quyền truy cập. Quay lại Home để chọn notebook khác.
            </div>
          )}
          <div className="flex-1 min-h-0 flex flex-col w-full animate-in fade-in duration-500 border-t border-[#e0e0e0]">
            {activeTab === 'chat' && (
              <ChatTab
                chatMessages={activeChatMessages}
                setChatMessages={setActiveChatMessages}
                notebookId={notebookId}
                activeNotebook={activeNotebook}
                sourceDocuments={documents}
                onChatSuccess={handleChatSuccess}
                threadId={activeSession?.id}
                onRecoverNotebookSources={handleRecoverNotebookSources}
              />
            )}
            {activeTab === 'quiz' && (
              <QuizTab
                notebookId={notebookId}
                quizSets={quizSets}
                selectedQuizSetId={selectedQuizSetId}
                onSelectQuizSet={setSelectedQuizSetId}
                onGenerateQuiz={() => generateArtifact('quiz')}
                onDeleteQuizSet={(setId) => deleteArtifactSet('quiz', setId)}
              />
            )}
            {activeTab === 'flashcards' && (
              <FlashcardsTab
                notebookId={notebookId}
                flashcardSets={flashcardSets}
                selectedFlashcardSetId={selectedFlashcardSetId}
                onSelectFlashcardSet={setSelectedFlashcardSetId}
                onGenerateFlashcards={() => generateArtifact('flashcard')}
                onDeleteFlashcardSet={(setId) => deleteArtifactSet('flashcard', setId)}
              />
            )}
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.5); }
      `}} />
    </div>
  );
}
