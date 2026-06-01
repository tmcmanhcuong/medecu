import axios from 'axios';

const SERVER_BACKEND = import.meta.env.VITE_SERVER_BACKEND || '/api/v1';

export async function getRecentStudyHistory(userId, { bookId, notebookId, limit = 10 } = {}) {
    const response = await axios.get(`${SERVER_BACKEND}/study/history`, {
        params: {
            user_id: userId,
            book_id: bookId,
            notebook_id: notebookId,
            limit,
        },
    });
    return response.data;
}

export async function saveStudyHistory(userId, payload) {
    const response = await axios.post(`${SERVER_BACKEND}/study/history`, payload, {
        params: { user_id: userId },
    });
    return response.data;
}

export async function deleteStudyHistoryItem(userId, historyId) {
    const response = await axios.delete(`${SERVER_BACKEND}/study/history/${historyId}`, {
        params: { user_id: userId },
    });
    return response.data;
}

export async function clearStudyHistory(userId, { notebookId, artifactType } = {}) {
    const response = await axios.delete(`${SERVER_BACKEND}/study/history`, {
        params: {
            user_id: userId,
            notebook_id: notebookId,
            artifact_type: artifactType,
        },
    });
    return response.data;
}
