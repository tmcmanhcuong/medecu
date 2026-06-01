/**
 * Book Cache Manager
 * 
 * Manages local caching of PDF files to avoid re-downloading
 */

import { getAllBooks, downloadBookFile } from '../book';

// Cache storage using Map for better performance
const bookCache = new Map();

// Cache directory path
const CACHE_DIR = '/src/services/cache/';

/**
 * Check if a book file exists in cache
 * 
 * @param {string} title - Book title (filename)
 * @returns {boolean} - True if file exists in cache
 */
export function isBookInCache(title) {
    // Check in memory cache first
    if (bookCache.has(title)) {
        return true;
    }

    // In a real browser environment, we can't directly check file system
    // So we rely on the in-memory cache Map
    return false;
}

/**
 * Get book from cache
 * 
 * @param {string} title - Book title (filename)
 * @returns {string|null} - Blob URL if found, null otherwise
 */
export function getBookFromCache(title) {
    const cached = bookCache.get(title);

    if (cached) {
        console.log(`✅ Book found in cache: ${title}`);
        return cached.blobUrl;
    }

    console.log(`❌ Book not in cache: ${title}`);
    return null;
}

/**
 * Add book to cache
 * 
 * @param {string} title - Book title (filename)
 * @param {string} blobUrl - Blob URL of the downloaded file
 * @param {object} metadata - Additional metadata
 */
export function addBookToCache(title, blobUrl, metadata = {}) {
    bookCache.set(title, {
        blobUrl,
        title,
        cachedAt: new Date().toISOString(),
        ...metadata
    });

    console.log(`💾 Book added to cache: ${title}`);
}

/**
 * Remove book from cache
 * 
 * @param {string} title - Book title (filename)
 */
export function removeBookFromCache(title) {
    const cached = bookCache.get(title);

    if (cached && cached.blobUrl) {
        // Revoke blob URL to free memory
        URL.revokeObjectURL(cached.blobUrl);
    }

    bookCache.delete(title);
    console.log(`🗑️ Book removed from cache: ${title}`);
}

/**
 * Clear all cache
 */
export function clearAllCache() {
    // Revoke all blob URLs
    bookCache.forEach((cached) => {
        if (cached.blobUrl) {
            URL.revokeObjectURL(cached.blobUrl);
        }
    });

    bookCache.clear();
    console.log('🗑️ All cache cleared');
}

/**
 * Get cache statistics
 * 
 * @returns {object} - Cache stats
 */
export function getCacheStats() {
    return {
        totalBooks: bookCache.size,
        books: Array.from(bookCache.keys()),
        cacheDetails: Array.from(bookCache.values())
    };
}

/**
 * Load book with automatic caching
 * 
 * This is the main function to use. It will:
 * 1. Check if book is in cache
 * 2. If yes, return cached blob URL
 * 3. If no, download and cache it
 * 
 * @param {string} title - Book title (filename)
 * @param {string} path - Book path on server
 * @returns {Promise<string>} - Blob URL
 */
export async function loadBookWithCache(title, path) {
    try {
        console.log(`📖 Loading book: ${title}`);

        // Check cache first
        const cachedUrl = getBookFromCache(title);
        if (cachedUrl) {
            return cachedUrl;
        }

        // Not in cache, download it
        console.log(`📥 Downloading book: ${title} from ${path}`);
        const blobUrl = await downloadBookFile(path);

        // Add to cache
        addBookToCache(title, blobUrl, { path });

        return blobUrl;
    } catch (error) {
        console.error(`❌ Failed to load book: ${title}`, error);
        throw error;
    }
}

/**
 * Load all books and cache them
 * 
 * @param {number} page - Page number
 * @param {number} pageSize - Items per page
 * @returns {Promise<Array>} - Array of books with blob URLs
 */
export async function loadAllBooksWithCache(page = 1, pageSize = 10) {
    try {
        console.log('📚 Loading all books...');

        // Get books list from API
        const result = await getAllBooks(page, pageSize);
        const books = result.data;

        console.log(`Found ${books.length} books`);

        // Load each book with caching
        const booksWithUrls = await Promise.all(
            books.map(async (book) => {
                try {
                    const blobUrl = await loadBookWithCache(book.title, book.path);
                    return {
                        ...book,
                        blobUrl,
                        cached: true
                    };
                } catch (error) {
                    console.error(`Failed to load book: ${book.title}`, error);
                    return {
                        ...book,
                        blobUrl: null,
                        cached: false,
                        error: error.message
                    };
                }
            })
        );

        console.log('✅ All books loaded');
        return booksWithUrls;
    } catch (error) {
        console.error('❌ Failed to load books:', error);
        throw error;
    }
}

/**
 * Preload specific books into cache
 * 
 * @param {Array<{title: string, path: string}>} books - Books to preload
 * @returns {Promise<void>}
 */
export async function preloadBooks(books) {
    console.log(`📦 Preloading ${books.length} books...`);

    const results = await Promise.allSettled(
        books.map(book => loadBookWithCache(book.title, book.path))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Preloaded: ${successful} books`);
    if (failed > 0) {
        console.warn(`⚠️ Failed: ${failed} books`);
    }
}

// Export cache instance for debugging
export { bookCache };
