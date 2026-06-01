import { useState, useEffect } from 'react';
import { loadAllBooksWithCache, getCacheStats, clearAllCache } from '../services/cache';

/**
 * Books List Component with Caching
 * 
 * Displays list of books and manages caching automatically
 */
export default function BooksList() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cacheStats, setCacheStats] = useState({ totalBooks: 0, books: [] });
    const [selectedBook, setSelectedBook] = useState(null);

    // Load books on component mount
    useEffect(() => {
        loadBooks();
    }, []);

    // Update cache stats whenever books change
    useEffect(() => {
        if (books.length > 0) {
            setCacheStats(getCacheStats());
        }
    }, [books]);

    async function loadBooks() {
        setLoading(true);
        setError(null);

        try {
            console.log('📚 Loading books with cache...');
            const booksWithUrls = await loadAllBooksWithCache(1, 10);
            setBooks(booksWithUrls);
            console.log('✅ Books loaded successfully');
        } catch (err) {
            console.error('❌ Failed to load books:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleClearCache() {
        clearAllCache();
        setCacheStats(getCacheStats());
        setBooks([]);
        console.log('🗑️ Cache cleared, reloading books...');
        loadBooks();
    }

    function handleBookClick(book) {
        setSelectedBook(book);
        console.log('📖 Selected book:', book.title);
    }

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>
                    <div style={styles.spinner}></div>
                    <p>Loading books...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>
                    <h3>❌ Error</h3>
                    <p>{error}</p>
                    <button onClick={loadBooks} style={styles.retryButton}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1>📚 Books Library</h1>
                <div style={styles.stats}>
                    <span>Total: {books.length} books</span>
                    <span>Cached: {cacheStats.totalBooks} books</span>
                    <button onClick={handleClearCache} style={styles.clearButton}>
                        🗑️ Clear Cache
                    </button>
                    <button onClick={loadBooks} style={styles.refreshButton}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Books Grid */}
            <div style={styles.grid}>
                {books.map((book) => (
                    <div
                        key={book.id}
                        style={{
                            ...styles.bookCard,
                            ...(selectedBook?.id === book.id ? styles.bookCardSelected : {})
                        }}
                        onClick={() => handleBookClick(book)}
                    >
                        <div style={styles.bookHeader}>
                            <h3 style={styles.bookTitle}>{book.title}</h3>
                            {book.cached && (
                                <span style={styles.cachedBadge}>💾 Cached</span>
                            )}
                        </div>

                        {book.description && (
                            <p style={styles.bookDescription}>{book.description}</p>
                        )}

                        <div style={styles.bookMeta}>
                            <small>Query ID: {book.query_id}</small>
                            <small>Path: {book.path}</small>
                        </div>

                        {book.blobUrl && (
                            <div style={styles.bookActions}>
                                <a
                                    href={book.blobUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={styles.viewButton}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    👁️ View PDF
                                </a>
                                <a
                                    href={book.blobUrl}
                                    download={book.title}
                                    style={styles.downloadButton}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    ⬇️ Download
                                </a>
                            </div>
                        )}

                        {book.error && (
                            <div style={styles.bookError}>
                                ⚠️ {book.error}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Selected Book Preview */}
            {selectedBook && selectedBook.blobUrl && (
                <div style={styles.preview}>
                    <div style={styles.previewHeader}>
                        <h2>{selectedBook.title}</h2>
                        <button
                            onClick={() => setSelectedBook(null)}
                            style={styles.closeButton}
                        >
                            ✕
                        </button>
                    </div>
                    <iframe
                        src={selectedBook.blobUrl}
                        style={styles.iframe}
                        title={selectedBook.title}
                    />
                </div>
            )}
        </div>
    );
}

// Styles
const styles = {
    container: {
        padding: '20px',
        maxWidth: '1400px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
    },
    stats: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
    },
    clearButton: {
        padding: '8px 16px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
    },
    refreshButton: {
        padding: '8px 16px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
    },
    bookCard: {
        padding: '20px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    bookCardSelected: {
        borderColor: '#3b82f6',
        boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
    },
    bookHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px'
    },
    bookTitle: {
        margin: 0,
        fontSize: '18px',
        fontWeight: '600',
        color: '#111827',
        flex: 1
    },
    cachedBadge: {
        padding: '4px 8px',
        backgroundColor: '#d1fae5',
        color: '#065f46',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500'
    },
    bookDescription: {
        margin: '10px 0',
        color: '#6b7280',
        fontSize: '14px'
    },
    bookMeta: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '1px solid #f3f4f6',
        fontSize: '12px',
        color: '#9ca3af'
    },
    bookActions: {
        display: 'flex',
        gap: '10px',
        marginTop: '15px'
    },
    viewButton: {
        flex: 1,
        padding: '8px 12px',
        backgroundColor: '#3b82f6',
        color: 'white',
        textDecoration: 'none',
        textAlign: 'center',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500'
    },
    downloadButton: {
        flex: 1,
        padding: '8px 12px',
        backgroundColor: '#10b981',
        color: 'white',
        textDecoration: 'none',
        textAlign: 'center',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500'
    },
    bookError: {
        marginTop: '10px',
        padding: '8px',
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        borderRadius: '4px',
        fontSize: '12px'
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '20px'
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '4px solid #f3f4f6',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    error: {
        padding: '40px',
        textAlign: 'center',
        backgroundColor: '#fee2e2',
        borderRadius: '8px',
        color: '#dc2626'
    },
    retryButton: {
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500'
    },
    preview: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '1200px',
        height: '90vh',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
    },
    previewHeader: {
        padding: '20px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    closeButton: {
        padding: '8px 12px',
        backgroundColor: '#f3f4f6',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '18px',
        fontWeight: 'bold'
    },
    iframe: {
        flex: 1,
        border: 'none',
        borderRadius: '0 0 12px 12px'
    }
};

// Add spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
