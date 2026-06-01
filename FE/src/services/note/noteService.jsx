import axios from 'axios';

// Lấy URL backend từ biến môi trường
const SERVER_BACKEND = import.meta.env.VITE_SERVER_BACKEND || '/api/v1';

/**
 * @typedef {Object} CreateNoteRequest
 * @property {string} title - Tiêu đề của note
 * @property {string} content - Nội dung của note
 */

/**
 * @typedef {Object} NoteData
 * @property {string} id - UUID của note
 * @property {string} title - Tiêu đề của note
 * @property {string} content - Nội dung của note
 * @property {string} created_at - Thời gian tạo (ISO string)
 * @property {string} updated_at - Thời gian cập nhật (ISO string)
 */

/**
 * @typedef {Object} CreateNoteResponse
 * @property {string} message - Thông báo từ server
 * @property {NoteData} data - Dữ liệu note
 */

/**
 * @typedef {Object} ValidationError
 * @property {Array<string|number>} loc - Vị trí lỗi
 * @property {string} msg - Thông báo lỗi
 * @property {string} type - Loại lỗi
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {ValidationError[]} detail - Chi tiết lỗi
 */

/**
 * Tạo note mới
 * @param {string} userId - UUID của user
 * @param {CreateNoteRequest} noteData - Thông tin note cần tạo
 * @returns {Promise<CreateNoteResponse>} Promise chứa response từ server
 * @throws {Error} Ném lỗi nếu request thất bại
 */
export async function createNote(userId, noteData) {
    try {
        // API chỉ yêu cầu title và content, backend sẽ tự tạo timestamps
        const requestBody = {
            title: noteData.title,
            content: noteData.content,
            book_id: noteData.book_id,
            notebook_id: noteData.notebook_id,
            source_page: noteData.source_page,
            source_excerpt: noteData.source_excerpt,
        };

        const response = await axios.post(
            `${SERVER_BACKEND}/notes/`,
            requestBody,
            {
                params: {
                    user_id: userId
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        // Xử lý lỗi validation từ server
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Nếu có detail (lỗi validation)
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => {
                    const field = err.loc ? err.loc.join('.') : 'unknown';
                    return `${field}: ${err.msg}`;
                }).join(', ');
                throw new Error(errorMessages);
            }

            // Nếu có message khác
            if (errorData.message) {
                throw new Error(errorData.message);
            }
        }

        // Lỗi mạng hoặc lỗi khác
        throw new Error(error.message || 'Không thể kết nối đến server');
    }
}

/**
 * Tạo note mới (wrapper với tên rõ ràng hơn)
 * @param {string} userId - UUID của user
 * @param {string} title - Tiêu đề của note
 * @param {string} content - Nội dung của note
 * @returns {Promise<CreateNoteResponse>} Promise chứa response từ server
 */
export async function addNote(userId, title, content, bookId = null, sourceMeta = {}) {
    return createNote(userId, {
        title,
        content,
        book_id: bookId,
        source_page: sourceMeta.source_page,
        source_excerpt: sourceMeta.source_excerpt,
    });
}

/**
 * @typedef {Object} Pagination
 * @property {number} page - Trang hiện tại
 * @property {number} page_size - Số lượng items mỗi trang
 * @property {number} total - Tổng số items
 * @property {number} total_pages - Tổng số trang
 */

/**
 * @typedef {Object} GetUserNotesResponse
 * @property {string} message - Thông báo từ server
 * @property {NoteData[]} data - Danh sách notes
 * @property {Pagination} pagination - Thông tin phân trang
 */

/**
 * Lấy danh sách notes của một user
 * @param {string} userId - UUID của user
 * @param {Object} [options] - Tùy chọn phân trang
 * @param {number} [options.page=1] - Số trang
 * @param {number} [options.page_size=10] - Số lượng items mỗi trang
 * @returns {Promise<GetUserNotesResponse>} Promise chứa response từ server
 * @throws {Error} Ném lỗi nếu request thất bại
 */
export async function getUserNotes(userId, options = {}) {
    try {
        const { page = 1, page_size = 10, book_id, notebook_id } = options;

        const response = await axios.get(
            `${SERVER_BACKEND}/notes/`,
            {
                params: {
                    user_id: userId,
                    page,
                    page_size,
                    book_id,
                    notebook_id,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        // Xử lý lỗi validation từ server
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Nếu có detail (lỗi validation)
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => err.msg).join(', ');
                throw new Error(errorMessages);
            }

            // Nếu có message khác
            if (errorData.message) {
                throw new Error(errorData.message);
            }
        }

        // Lỗi mạng hoặc lỗi khác
        throw new Error(error.message || 'Không thể kết nối đến server');
    }
}

/**
 * Lấy danh sách notes của user (alias)
 * @param {string} userId - UUID của user
 * @param {number} [page=1] - Số trang
 * @param {number} [pageSize=10] - Số lượng items mỗi trang
 * @returns {Promise<GetUserNotesResponse>} Promise chứa response từ server
 */
export async function fetchUserNotes(userId, page = 1, pageSize = 10) {
    return getUserNotes(userId, { page, page_size: pageSize });
}

/**
 * @typedef {Object} GetNoteResponse
 * @property {string} message - Thông báo từ server
 * @property {NoteData} data - Dữ liệu note
 */

/**
 * Lấy thông tin chi tiết của một note
 * @param {string} noteId - UUID của note
 * @returns {Promise<GetNoteResponse>} Promise chứa response từ server
 * @throws {Error} Ném lỗi nếu request thất bại
 */
export async function getNoteById(noteId) {
    try {
        const response = await axios.get(
            `${SERVER_BACKEND}/notes/`,
            {
                params: {
                    note_id: noteId,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        // Xử lý lỗi validation từ server
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Nếu có detail (lỗi validation)
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => err.msg).join(', ');
                throw new Error(errorMessages);
            }

            // Nếu có message khác
            if (errorData.message) {
                throw new Error(errorData.message);
            }
        }

        // Lỗi mạng hoặc lỗi khác
        throw new Error(error.message || 'Không thể kết nối đến server');
    }
}

/**
 * Lấy note theo ID (alias)
 * @param {string} noteId - UUID của note
 * @returns {Promise<GetNoteResponse>} Promise chứa response từ server
 */
export async function fetchNote(noteId) {
    return getNoteById(noteId);
}

/**
 * @typedef {Object} UpdateNoteRequest
 * @property {string} [title] - Tiêu đề của note (optional)
 * @property {string} [content] - Nội dung của note (optional)
 */

/**
 * @typedef {Object} UpdateNoteResponse
 * @property {string} message - Thông báo từ server
 * @property {NoteData} data - Dữ liệu note đã được cập nhật
 */

/**
 * Cập nhật thông tin của một note
 * @param {string} noteId - UUID của note cần cập nhật
 * @param {UpdateNoteRequest} noteData - Thông tin note cần cập nhật (chỉ gửi các field cần thay đổi)
 * @returns {Promise<UpdateNoteResponse>} Promise chứa response từ server
 * @throws {Error} Ném lỗi nếu request thất bại
 */
export async function updateNote(noteId, noteData) {
    try {
        // API chỉ yêu cầu title và/hoặc content, backend sẽ tự cập nhật updated_at
        const requestBody = {};

        // Đảo thứ tự: content trước, title sau
        if (noteData.content !== undefined) {
            // Đảm bảo content là string (có thể chứa nhiều dòng với \n)
            requestBody.content = String(noteData.content);
        }

        if (noteData.title !== undefined) {
            requestBody.title = noteData.title;
        }

        const response = await axios.patch(
            `${SERVER_BACKEND}/notes/${noteId}`,
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        // Xử lý lỗi validation từ server
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Nếu có detail (lỗi validation)
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => {
                    const field = err.loc ? err.loc.join('.') : 'unknown';
                    return `${field}: ${err.msg}`;
                }).join(', ');
                throw new Error(errorMessages);
            }

            // Nếu có message khác
            if (errorData.message) {
                throw new Error(errorData.message);
            }
        }

        // Lỗi mạng hoặc lỗi khác
        throw new Error(error.message || 'Không thể kết nối đến server');
    }
}

/**
 * Cập nhật note (wrapper tiện lợi)
 * @param {string} noteId - UUID của note
 * @param {string} title - Tiêu đề mới
 * @param {string} content - Nội dung mới
 * @returns {Promise<UpdateNoteResponse>} Promise chứa response từ server
 */
export async function editNote(noteId, title, content) {
    return updateNote(noteId, {
        title,
        content
    });
}

/**
 * @typedef {Object} DeleteNoteResponse
 * @property {string} message - Thông báo từ server
 * @property {Object} data - Dữ liệu bổ sung (nếu có)
 */

/**
 * Xóa một note
 * @param {string} noteId - UUID của note cần xóa
 * @returns {Promise<DeleteNoteResponse>} Promise chứa response từ server
 * @throws {Error} Ném lỗi nếu request thất bại
 */
export async function deleteNote(noteId) {
    try {
        const response = await axios.delete(
            `${SERVER_BACKEND}/notes/${noteId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        // Xử lý lỗi validation từ server
        if (error.response && error.response.data) {
            const errorData = error.response.data;

            // Nếu có detail (lỗi validation)
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const errorMessages = errorData.detail.map(err => err.msg).join(', ');
                throw new Error(errorMessages);
            }

            // Nếu có message khác
            if (errorData.message) {
                throw new Error(errorData.message);
            }
        }

        // Lỗi mạng hoặc lỗi khác
        throw new Error(error.message || 'Không thể kết nối đến server');
    }
}

/**
 * Xóa note (alias)
 * @param {string} noteId - UUID của note cần xóa
 * @returns {Promise<DeleteNoteResponse>} Promise chứa response từ server
 */
export async function removeNote(noteId) {
    return deleteNote(noteId);
}


export default {
    createNote,
    addNote,
    getUserNotes,
    fetchUserNotes,
    getNoteById,
    fetchNote,
    updateNote,
    editNote,
    deleteNote,
    removeNote,
};
