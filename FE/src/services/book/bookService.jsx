const API_BASE_URL = import.meta.env.VITE_SERVER_BACKEND;
const getStoredUserId = () => localStorage.getItem('currentUserId') || localStorage.getItem('user_id');

export async function uploadDocument(userId, file, notebookId = null) {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('user_id', userId);
    if (notebookId) {
        formData.append('notebook_id', notebookId);
    }
    const response = await fetch(`${API_BASE_URL}/books/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
    }
    return response.json();
}

/**
 * Parse a reference string to extract book name and position
 * Supports both formats:
 * - New: ![bookName-/page/0/SectionHeader/1]
 * - Old: ![/page/0/Text/1] (no book name)
 * 
 * @param {string} reference - The reference string
 * @returns {object} - { bookName, position } or null if invalid
 */
export function parseReference(reference) {
    // Remove the markdown image syntax ![...]
    const cleaned = reference.replace(/^!\[/, '').replace(/\]$/, '');

    // Check if it's the new format (has dash before /page/)
    if (cleaned.includes('-') && cleaned.includes('/page/')) {
        // Find the last dash before "/page/" to handle book titles with dashes
        const pageIndex = cleaned.indexOf('/page/');
        const dashIndex = cleaned.lastIndexOf('-', pageIndex);

        if (dashIndex === -1) {
            console.warn('Invalid reference format:', reference);
            return null;
        }

        const bookName = cleaned.substring(0, dashIndex);
        const position = cleaned.substring(dashIndex + 1);

        return { bookName, position };
    }

    // Old format: no book name, just position
    // Example: ![/page/0/Text/1]
    if (cleaned.startsWith('/page/')) {
        return { bookName: null, position: cleaned };
    }

    console.warn('Invalid reference format:', reference);
    return null;
}

/**
 * Get book content from cache based on book name and position
 * 
 * @param {string} bookName - The book identifier (e.g., "250117366v2")
 * @param {string} position - The position in the book (e.g., "/page/0/SectionHeader/1")
 * @returns {object|null} - The content object or null if not found
 * 
 * @deprecated - Use getBookContent(bookId) API instead
 */
export function getBookContentByPosition(bookName, position) {
    console.warn('getBookContentByPosition is deprecated. Use getBookContent(bookId) API instead.');
    return null;
}

/**
 * Get book content from a reference string
 * 
 * @param {string} reference - The full reference (e.g., "![250117366v2-/page/0/SectionHeader/1]")
 * @returns {object|null} - The content object or null if not found
 * 
 * @deprecated - Use getBookContent(bookId) API instead
 */
export function getContentFromReference(reference) {
    console.warn('getContentFromReference is deprecated. Use getBookContent(bookId) API instead.');
    const parsed = parseReference(reference);
    return parsed ? null : null;
}

/**
 * Get the PDF path for a book
 * 
 * @param {string} bookName - The book identifier
 * @returns {string|null} - The PDF path or null if not found
 * 
 * @deprecated - Use getAllBooks() or getBookById() API instead
 */
export function getBookPdfPath(bookName) {
    console.warn('getBookPdfPath is deprecated. Use getAllBooks() or getBookById() API instead.');
    return null;
}

/**
 * Get all books from the server
 * 
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Number of items per page (default: 10)
 * @returns {Promise<object>} - Promise resolving to the API response
 * @throws {Error} - If the API request fails
 */
export async function getAllBooks(page = 1, pageSize = 10, options = {}) {
    const userId = options.userId !== undefined ? options.userId : getStoredUserId();
    try {
        const url = `${API_BASE_URL}/books?page=${page}&page_size=${pageSize}${userId ? `&user_id=${userId}` : ''}`;

        console.log('📚 Fetching books from:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // Try to parse error details
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Handle validation errors
            if (errorData.detail) {
                const errorMessages = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : errorData.detail;
                throw new Error(`Validation error: ${errorMessages}`);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Books fetched successfully:', data);

        return data;
    } catch (error) {
        console.error('❌ Error fetching books:', error);
        throw error;
    }
}

/**
 * Get a specific book by ID
 * 
 * @param {string} bookId - The book ID (UUID or query_id)
 * @returns {Promise<object>} - Promise resolving to the book data
 * @throws {Error} - If the API request fails
 */
export async function getBookById(bookId) {
    const userId = getStoredUserId();
    try {
        const url = userId
            ? `${API_BASE_URL}/books/${bookId}?user_id=${userId}`
            : `${API_BASE_URL}/books/${bookId}`;

        console.log('📖 Fetching book:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (errorData.detail) {
                const errorMessages = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : errorData.detail;
                throw new Error(`Validation error: ${errorMessages}`);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Book fetched successfully:', data);

        return data;
    } catch (error) {
        console.error('❌ Error fetching book:', error);
        throw error;
    }
}

/**
 * Get book content (with positions) by book_id
 * 
 * @param {string} bookId - The book ID (UUID)
 * @returns {Promise<object>} - Promise resolving to the book content data
 * @throws {Error} - If the API request fails
 * 
 * @example
 * const content = await getBookContent('uuid-123-456');
 * console.log(content.data.contents); // Array of content positions
 */
export async function getBookContent(bookId) {
    try {
        const url = `${API_BASE_URL}/books/${bookId}/contents`;

        console.log('📄 Fetching book content for ID:', bookId);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (errorData.detail) {
                const errorMessages = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : errorData.detail;
                throw new Error(`Validation error: ${errorMessages}`);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Book content fetched successfully:', data.data?.contents?.length || 0, 'items');

        return data;
    } catch (error) {
        console.error('❌ Error fetching book content:', error);
        throw error;
    }
}

/**
 * Download book file from server and cache it as blob URL
 * 
 * @param {string} filePath - The file path on server (e.g., "./cache/250117366v23456.pdf")
 * @returns {Promise<string>} - Promise resolving to blob URL
 * @throws {Error} - If the API request fails
 * 
 * @example
 * const blobUrl = await downloadBookFile('./cache/250117366v23456.pdf');
 * console.log(blobUrl); // "blob:http://localhost:8000/76ea5735-4225-4831-9d81-8be18a7bb9e4"
 */
export async function downloadBookFile(filePath) {
    try {
        // Encode file path for URL
        const encodedPath = encodeURIComponent(filePath);
        const url = `${API_BASE_URL}/files/${encodedPath}`;

        console.log('📥 Downloading book file from:', url);
        console.log('   Original path:', filePath);

        const response = await fetch(url, {
            method: 'GET',
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', {
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (errorData.detail) {
                const errorMessages = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : errorData.detail;
                throw new Error(`Validation error: ${errorMessages}`);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check content type
        const contentType = response.headers.get('content-type');
        console.log('📄 Content-Type:', contentType);

        // Get blob from response
        const blob = await response.blob();

        console.log('📦 Blob created:', {
            size: blob.size,
            type: blob.type,
            sizeInMB: (blob.size / 1024 / 1024).toFixed(2) + ' MB'
        });

        // Validate blob size
        if (blob.size === 0) {
            throw new Error('Downloaded file is empty (0 bytes)');
        }

        // Create blob URL with explicit type if needed
        const pdfBlob = blob.type.includes('pdf')
            ? blob
            : new Blob([blob], { type: 'application/pdf' });

        const blobUrl = URL.createObjectURL(pdfBlob);

        console.log('✅ Book file downloaded successfully!');
        console.log('   Blob URL:', blobUrl);
        console.log('   Size:', (pdfBlob.size / 1024 / 1024).toFixed(2), 'MB');

        return blobUrl;
    } catch (error) {
        console.error('❌ Error downloading book file:', error);
        console.error('   Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}
