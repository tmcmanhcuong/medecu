const API_BASE_URL = import.meta.env.VITE_SERVER_BACKEND;

const getStoredUserId = () =>
  localStorage.getItem('currentUserId') || localStorage.getItem('user_id');

const withUser = (userId) => userId || getStoredUserId();

export async function listNotebooks({ page = 1, pageSize = 20, userId } = {}) {
  const uid = withUser(userId);
  const response = await fetch(
    `${API_BASE_URL}/notebooks?user_id=${uid}&page=${page}&page_size=${pageSize}`
  );
  if (!response.ok) throw new Error('Cannot load notebooks');
  return response.json();
}

export async function createNotebook(payload, { userId } = {}) {
  const uid = withUser(userId);
  const response = await fetch(`${API_BASE_URL}/notebooks?user_id=${uid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Cannot create notebook');
  return response.json();
}

export async function updateNotebook(notebookId, payload, { userId } = {}) {
  const uid = withUser(userId);
  const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}?user_id=${uid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Cannot update notebook');
  return response.json();
}

export async function deleteNotebook(notebookId, { userId } = {}) {
  const uid = withUser(userId);
  const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}?user_id=${uid}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Cannot delete notebook');
  return response.json();
}

export async function getNotebookDetail(notebookId, { userId } = {}) {
  const uid = withUser(userId);
  const response = await fetch(`${API_BASE_URL}/notebooks/${notebookId}?user_id=${uid}`);
  if (!response.ok) throw new Error('Cannot load notebook detail');
  return response.json();
}

export async function listNotebookSources(notebookId, { userId } = {}) {
  const uid = withUser(userId);
  const response = await fetch(
    `${API_BASE_URL}/notebooks/${notebookId}/sources?user_id=${uid}`
  );
  if (!response.ok) throw new Error('Cannot load notebook sources');
  return response.json();
}

export async function attachNotebookSource(notebookId, bookId, { userId } = {}) {
  const uid = withUser(userId);
  const response = await fetch(
    `${API_BASE_URL}/notebooks/${notebookId}/sources?user_id=${uid}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: bookId }),
    }
  );
  if (!response.ok) throw new Error('Cannot attach source');
  return response.json();
}

export async function detachNotebookSource(notebookId, bookId, { userId } = {}) {
  const uid = withUser(userId);
  const response = await fetch(
    `${API_BASE_URL}/notebooks/${notebookId}/sources/${bookId}?user_id=${uid}`,
    {
      method: 'DELETE',
    }
  );
  if (!response.ok) throw new Error('Cannot detach source');
  return response.json();
}

export async function retryNotebookSourceIngestion(notebookId, bookId, { userId } = {}) {
  const uid = withUser(userId);
  const response = await fetch(
    `${API_BASE_URL}/notebooks/${notebookId}/sources/${bookId}/retry?user_id=${uid}`,
    {
      method: 'POST',
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Cannot retry source ingestion');
  }
  return response.json();
}
