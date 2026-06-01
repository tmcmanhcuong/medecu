import { useState } from 'react';
import { generateQuizAndFlashcard, extractQuizQuestions, extractFlashcardQuestions } from '../services/AI/aiService';

export default function AITestPage() {
    const [chapterTitle, setChapterTitle] = useState('Random Forest for Stock Price Prediction');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleTest = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            console.log('🧪 Testing generateQuizAndFlashcard...');
            console.log('📝 Chapter Title:', chapterTitle);

            const response = await generateQuizAndFlashcard(chapterTitle);

            console.log('✅ Response received:', response);
            console.log('📊 Response type:', typeof response);
            console.log('📊 Is array?:', Array.isArray(response));

            // Extract quiz and flashcard questions
            const quizQuestions = extractQuizQuestions(response);
            const flashcardQuestions = extractFlashcardQuestions(response);

            console.log('📝 Quiz questions:', quizQuestions.length);
            console.log('📝 Flashcard questions:', flashcardQuestions.length);

            setResult({
                raw: response,
                quiz: quizQuestions,
                flashcard: flashcardQuestions
            });
        } catch (err) {
            console.error('❌ Test failed:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-800 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">AI Service Test - generateQuizAndFlashcard</h1>

                {/* Chapter Title Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chapter Title (tiêu đề chương để tạo quiz/flashcard):
                    </label>
                    <input
                        type="text"
                        value={chapterTitle}
                        onChange={(e) => setChapterTitle(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập tiêu đề chương..."
                    />
                </div>

                {/* Test Button */}
                <button
                    onClick={handleTest}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '🔄 Đang test...' : '🧪 Test generateQuizAndFlashcard'}
                </button>

                {/* Loading State */}
                {loading && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                            <span className="text-blue-700">Đang gọi API...</span>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h3 className="text-red-800 font-semibold mb-2">❌ Lỗi:</h3>
                        <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="mt-6 space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="text-green-800 font-semibold mb-2">✅ Kết quả:</h3>

                            {/* Summary */}
                            <div className="mb-4 p-3 bg-white dark:bg-slate-900 rounded border">
                                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">📊 Tổng quan:</h4>
                                <ul className="space-y-1 text-sm">
                                    <li>🎯 Quiz questions: <strong>{result.quiz.length}</strong></li>
                                    <li>📇 Flashcard questions: <strong>{result.flashcard.length}</strong></li>
                                </ul>
                            </div>

                            {/* Quiz Questions */}
                            {result.quiz.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">🎯 Quiz Questions:</h4>
                                    <div className="space-y-3">
                                        {result.quiz.map((q, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded border">
                                                <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                                                    {idx + 1}. {q.question}
                                                </p>
                                                <div className="ml-4 space-y-1 text-sm">
                                                    <p className={q.answer === 'a' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                                        A. {q.a}
                                                    </p>
                                                    <p className={q.answer === 'b' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                                        B. {q.b}
                                                    </p>
                                                    <p className={q.answer === 'c' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                                        C. {q.c}
                                                    </p>
                                                    <p className={q.answer === 'd' ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                                                        D. {q.d}
                                                    </p>
                                                </div>
                                                <p className="mt-2 text-xs text-green-600">
                                                    ✓ Correct answer: <strong>{q.answer.toUpperCase()}</strong>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Flashcard Questions */}
                            {result.flashcard.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">📇 Flashcard Questions:</h4>
                                    <div className="space-y-3">
                                        {result.flashcard.map((f, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-900 p-3 rounded border">
                                                <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                                                    {idx + 1}. {f.question}
                                                </p>
                                                <div className="ml-4 p-2 bg-blue-50 rounded text-sm">
                                                    <p className="text-gray-700 dark:text-gray-300">{f.answer}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Full Response */}
                            <div>
                                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">📄 Full Response (Raw JSON):</h4>
                                <pre className="bg-white dark:bg-slate-900 p-3 rounded border text-xs overflow-x-auto max-h-96">
                                    {JSON.stringify(result.raw, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="text-yellow-800 font-semibold mb-2">📋 Hướng dẫn:</h3>
                    <ol className="list-decimal list-inside text-yellow-700 space-y-1 text-sm">
                        <li>Nhập tiêu đề chương vào "Chapter Title"</li>
                        <li>Bấm "Test generateQuizAndFlashcard"</li>
                        <li>Kiểm tra console để xem logs chi tiết</li>
                        <li>Xem kết quả quiz questions và flashcard questions</li>
                        <li>Kiểm tra raw JSON response để debug nếu cần</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
