import { useState, useEffect } from 'react';
import { getAllBooks } from '../services/book';
import { loadBookWithCache } from '../services/cache';
import { FileText, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * PDF Viewer component for the right bar
 * Automatically loads the first book from getAllBooks with caching support
 */
export default function PDFRightBar({ isVisible = true }) {
    const [bookData, setBookData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isVisible && !bookData) {
            loadBook();
        }
    }, [isVisible]);

    const loadBook = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📚 Loading first book for PDF viewer using original functions...');

            // Use original getAllBooks function
            const booksResponse = await getAllBooks(1, 1);

            if (!booksResponse.data || booksResponse.data.length === 0) {
                throw new Error('No books available');
            }

            const firstBook = booksResponse.data[0];
            const { title, path } = firstBook;

            console.log(`📖 First book: "${title}" at path: ${path}`);

            // Use cache function to load with caching
            const blobUrl = await loadBookWithCache(title, path);

            const data = {
                title,
                path,
                blobUrl
            };

            setBookData(data);
            console.log(`✅ Loaded: ${data.title}`);
        } catch (err) {
            setError(err.message);
            console.error('❌ Failed to load book:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setBookData(null);
        loadBook();
    };

    // Loading state
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Đang tải PDF...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-800 p-6">
                <div className="text-center max-w-sm">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Không thể tải PDF</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (!bookData) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-800 p-6">
                <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có sách</p>
                </div>
            </div>
        );
    }

    // PDF viewer
    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={bookData.title}>
                        {bookData.title}
                    </h3>
                </div>
                <button
                    onClick={handleRefresh}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Tải lại"
                >
                    <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 relative">
                <iframe
                    src={bookData.blobUrl}
                    className="absolute inset-0 w-full h-full border-0"
                    title={bookData.title}
                />
            </div>
        </div>
    );
}
