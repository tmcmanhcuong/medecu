import React, { useRef } from "react";
import { FileText, Paperclip, Bold, Italic, Underline, List, ListOrdered, Link2, Image, Edit3, X, BookOpen, ChevronLeft, ChevronRight, Trophy, RefreshCw, Check, XCircle, Layers, Share2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// OLD SELECTION - Commented out for comparison
// import { useTextSelection } from "../../hooks/useTextSelection";
// import SelectionOverlay from "../SelectionOverlay";
// NEW MANUAL SELECTION
import { useManualSelection } from "../../hooks/useManualSelection";
import ManualSelectionBox from "../ManualSelectionBox";
import NoteRenderer from "../NoteRenderer";

export default function MainContent({
  selectedNote,
  isEditing,
  editedTitle,
  editedContent,
  setEditedTitle,
  setEditedContent,
  showAttachments,
  setShowAttachments,
  showQuizFlashcard,
  selectedNotes,
  currentQuestionIndex,
  userAnswers,
  quizCompleted,
  currentFlashcardIndex,
  isFlashcardFlipped,
  setIsFlashcardFlipped,
  flashcardStatus,
  flashcardCompleted,
  onEditNote,
  onSaveNote,
  onContentClick,
  onAddToChat,
  onAddToNote,
  onAddToNoteDirectly,
  onAddToNoteAtPosition,
  onReplaceNoteContent,
  onBackToNotes,
  onAnswerSelect,
  onPrevQuestion,
  onNextQuestion,
  onRetakeQuiz,
  onRememberCard,
  onForgetCard,
  onRetakeFlashcard,
  calculateQuizScore,
  calculateFlashcardScore,
  formatDate,
  isLeftSidebarVisible,
  onToggleLeftSidebar,
  onBubbleClick,
  quizData = null,
  flashcardData = null,
  isLoadingQuizFlashcard = false
}) {
  const mainContentRef = useRef(null);
  const noteContentRef = useRef(null);

  // OLD SELECTION - Commented out
  // const selectionBox = useTextSelection(noteContentRef);

  // Manual selection hook
  const {
    selectionBox,
    selectedElements,
    getSelectedText,
    clearSelection,
    isInitialized
  } = useManualSelection(noteContentRef);

  return (
    <div ref={mainContentRef} data-main-content className="flex-1 flex flex-col h-full">
      {showQuizFlashcard ? (
        /* Quiz/Flashcard View */
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBackToNotes}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {showQuizFlashcard === "quiz" ? "Quiz" : "Flashcard"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Từ {selectedNotes.length} note(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              {showQuizFlashcard === "quiz" ? (
                /* Quiz View */
                isLoadingQuizFlashcard ? (
                  /* Loading Animation */
                  <div className="space-y-6 animate-pulse">
                    <div className="text-center py-12">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Đang tạo Quiz...
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        AI đang phân tích nội dung và tạo câu hỏi cho bạn
                      </p>
                    </div>
                    {/* Skeleton loading */}
                    <div className="space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-20 bg-gray-200 rounded"></div>
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-16 bg-gray-100 dark:bg-slate-800 rounded"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : quizCompleted ? (
                  /* Quiz Results */
                  <div className="space-y-6">
                    <div className="text-center py-12">
                      <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${calculateQuizScore().percentage >= 70 ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                        {calculateQuizScore().percentage >= 70 ? (
                          <Trophy className={`w-16 h-16 text-green-600`} />
                        ) : (
                          <span className={`text-5xl font-bold text-orange-600`}>
                            {calculateQuizScore().percentage}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {calculateQuizScore().percentage >= 70 ? 'Xuất sắc!' : 'Cố gắng thêm nhé!'}
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                        Điểm số: <strong className="text-2xl font-bold text-gray-900 dark:text-gray-100">{calculateQuizScore().percentage}%</strong>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Bạn trả lời đúng {calculateQuizScore().correct} / {calculateQuizScore().total} câu
                      </p>
                    </div>

                    {/* Detailed Results */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Chi tiết kết quả:</h4>
                      {quizData && quizData.map((q, idx) => {
                        const isCorrect = userAnswers[idx] === q.answer;
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`text-2xl ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                {isCorrect ? '✓' : '✗'}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                  Question {idx + 1}: {q.question}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Your answer: <strong>{userAnswers[idx]?.toUpperCase() || 'No answer'}</strong>
                                  {!isCorrect && ` → Correct: ${q.answer?.toUpperCase()}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={onBackToNotes}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors font-medium"
                      >
                        Back to Notes
                      </button>
                      <button
                        onClick={onRetakeQuiz}
                        className="flex-1 px-6 py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Làm lại Quiz
                      </button>
                    </div>
                  </div>
                ) : quizData && quizData[currentQuestionIndex] ? (
                  <div className="space-y-6">
                    {/* Progress */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Question {currentQuestionIndex + 1} of {quizData.length}
                      </span>
                      <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 dark:bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${((currentQuestionIndex + 1) / quizData.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="bg-blue-50 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        {quizData[currentQuestionIndex].question}
                      </h3>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      {['a', 'b', 'c', 'd'].map((option) => {
                        const isSelected = userAnswers[currentQuestionIndex] === option;
                        const isAnswered = userAnswers[currentQuestionIndex] !== undefined;
                        const correctAnswer = quizData[currentQuestionIndex].answer;
                        const isCorrectOption = option === correctAnswer;

                        return (
                          <button
                            key={option}
                            onClick={() => onAnswerSelect(currentQuestionIndex, option)}
                            disabled={isAnswered}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${isAnswered
                              ? isSelected
                                ? isCorrectOption
                                  ? 'border-green-500 bg-green-50 cursor-not-allowed'
                                  : 'border-red-500 bg-red-50 cursor-not-allowed'
                                : isCorrectOption
                                  ? 'border-green-500 bg-green-50 cursor-not-allowed'
                                  : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 cursor-not-allowed opacity-60'
                              : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800'
                              }`}
                          >
                            <span className="font-semibold text-gray-700 dark:text-gray-300 mr-3">
                              {option.toUpperCase()}.
                            </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {(() => {
                                const currentQ = quizData[currentQuestionIndex];
                                const optionText = currentQ?.options?.[option] || currentQ?.[option] || '';
                                console.log('🔍 Quiz option debug:', {
                                  option,
                                  hasOptions: !!currentQ?.options,
                                  optionsKeys: currentQ?.options ? Object.keys(currentQ.options) : [],
                                  optionText,
                                  fullQuestion: currentQ
                                });
                                return optionText;
                              })()}
                            </span>
                            {isAnswered && isCorrectOption && (
                              <span className="ml-2 text-green-600 font-bold">✓</span>
                            )}
                            {isAnswered && isSelected && !isCorrectOption && (
                              <span className="ml-2 text-red-600 font-bold">✗</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation (if answered) */}
                    {userAnswers[currentQuestionIndex] && quizData[currentQuestionIndex] && (
                      <div className={`p-4 rounded-lg ${userAnswers[currentQuestionIndex] === quizData[currentQuestionIndex].answer
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                        }`}>
                        <p className="font-semibold mb-2">
                          {userAnswers[currentQuestionIndex] === quizData[currentQuestionIndex].answer
                            ? '✓ Correct!'
                            : '✗ Incorrect'}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Correct answer:</strong> {quizData[currentQuestionIndex].answer?.toUpperCase()}
                        </p>
                        {quizData[currentQuestionIndex].explanation && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {quizData[currentQuestionIndex].explanation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between items-center pt-4">
                      <button
                        onClick={onPrevQuestion}
                        disabled={currentQuestionIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <button
                        onClick={onNextQuestion}
                        disabled={!userAnswers[currentQuestionIndex]}
                        className="flex items-center gap-2 px-4 py-2 text-white bg-blue-500 dark:bg-blue-600 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {currentQuestionIndex === quizData.length - 1 ? 'Finish & View Results' : 'Next'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No quiz data available</p>
                  </div>
                )
              ) : (
                /* Flashcard View */
                isLoadingQuizFlashcard ? (
                  /* Loading Animation */
                  <div className="space-y-6 animate-pulse">
                    <div className="text-center py-12">
                      <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Đang tạo Flashcard...
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        AI đang phân tích nội dung và tạo thẻ ghi nhớ cho bạn
                      </p>
                    </div>
                    {/* Skeleton loading */}
                    <div className="space-y-4">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-64 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl"></div>
                      <div className="flex gap-4 justify-center">
                        <div className="h-12 w-32 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
                        <div className="h-12 w-32 bg-gray-100 dark:bg-slate-800 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                ) : flashcardCompleted ? (
                  /* Flashcard Results */
                  <div className="space-y-6">
                    <div className="text-center py-12">
                      <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${calculateFlashcardScore().percentage >= 70 ? 'bg-purple-100' : 'bg-orange-100'
                        }`}>
                        {calculateFlashcardScore().percentage >= 70 ? (
                          <Trophy className={`w-16 h-16 text-purple-600`} />
                        ) : (
                          <span className={`text-5xl font-bold text-orange-600`}>
                            {calculateFlashcardScore().percentage}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {calculateFlashcardScore().percentage >= 70 ? 'Tuyệt vời!' : 'Cần ôn thêm nhé!'}
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                        Tỷ lệ nhớ: <strong className="text-2xl font-bold text-purple-600">{calculateFlashcardScore().percentage}%</strong>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Bạn nhớ {calculateFlashcardScore().remembered} / {calculateFlashcardScore().total} thẻ
                      </p>
                    </div>

                    {/* Detailed Results */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Chi tiết từng thẻ:</h4>
                      {flashcardData && flashcardData.map((q, idx) => {
                        const isRemembered = flashcardStatus[idx] === "remembered";
                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border-2 ${isRemembered ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                              }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`text-2xl ${isRemembered ? 'text-green-600' : 'text-red-600'}`}>
                                {isRemembered ? <Check className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                  Card {idx + 1}: {q.question}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Giải thích:</strong> {q.explanation}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Trạng thái: <strong className={isRemembered ? 'text-green-600' : 'text-red-600'}>
                                    {isRemembered ? 'Đã nhớ' : 'Chưa nhớ'}
                                  </strong>
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={onBackToNotes}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors font-medium"
                      >
                        Back to Notes
                      </button>
                      <button
                        onClick={onRetakeFlashcard}
                        className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Làm lại Flashcard
                      </button>
                    </div>
                  </div>
                ) : flashcardData && flashcardData[currentFlashcardIndex] ? (
                  <div className="space-y-6">
                    {/* Progress */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Card {currentFlashcardIndex + 1} of {flashcardData.length}
                        </span>
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <Check className="w-4 h-4" />
                            {Object.values(flashcardStatus).filter(s => s === "remembered").length}
                          </span>
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <XCircle className="w-4 h-4" />
                            {Object.values(flashcardStatus).filter(s => s === "forgotten").length}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${((currentFlashcardIndex + 1) / flashcardData.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Flashcard */}
                    <div
                      onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                      className="min-h-[300px] bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8 cursor-pointer hover:shadow-lg transition-all border-2 border-purple-200 flex items-center justify-center"
                    >
                      <div className="text-center">
                        {!isFlashcardFlipped ? (
                          <>
                            <p className="text-sm text-purple-600 mb-4 font-medium">Question</p>
                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                              {flashcardData[currentFlashcardIndex].question}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">Click to flip</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-blue-600 mb-4 font-medium">Answer / Explanation</p>
                            <p className="text-lg text-gray-700 dark:text-gray-300">
                              {flashcardData[currentFlashcardIndex].explanation || "No explanation available"}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">Click to flip back</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status - Remember/Forget Buttons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={onRememberCard}
                          disabled={flashcardStatus[currentFlashcardIndex] !== undefined}
                          className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${flashcardStatus[currentFlashcardIndex] === "remembered"
                            ? 'bg-green-500 text-white shadow-lg scale-105'
                            : flashcardStatus[currentFlashcardIndex] === "forgotten"
                              ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-300'
                            }`}
                        >
                          <Check className="w-5 h-5" />
                          Nhớ
                        </button>
                        <button
                          onClick={onForgetCard}
                          disabled={flashcardStatus[currentFlashcardIndex] !== undefined}
                          className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${flashcardStatus[currentFlashcardIndex] === "forgotten"
                            ? 'bg-red-500 text-white shadow-lg scale-105'
                            : flashcardStatus[currentFlashcardIndex] === "remembered"
                              ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed'
                              : 'bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300'
                            }`}
                        >
                          <XCircle className="w-5 h-5" />
                          Quên
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Layers className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No flashcard data available</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ) : selectedNote ? (
        <div
          className="flex-1 flex flex-col h-full"
          onDoubleClick={(e) => {
            // Stop propagation to prevent document-level handler from firing
            e.stopPropagation();

            if (isEditing) return;

            // Ignore double-click on bubbles
            const isBubble = e.target.closest('[data-bubble]');
            if (isBubble) {
              console.log('🎯 Ignoring double-click on bubble');
              return;
            }

            const tagName = e.target.tagName.toLowerCase();
            if (tagName === 'button' || tagName === 'input' || tagName === 'textarea') {
              return;
            }

            onContentClick();
          }}
        >
          {/* Note Header */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 overflow-hidden mr-4">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Focus on textarea when Enter is pressed in title
                        const textarea = document.querySelector('textarea');
                        if (textarea) textarea.focus();
                      }
                    }}
                    className="text-2xl font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-slate-600 focus:outline-none focus:border-blue-500 w-full"
                    placeholder="Note title..."
                  />
                ) : (
                  <h1
                    className="text-2xl font-semibold text-gray-900 dark:text-gray-100 cursor-text select-text truncate"
                    style={{ userSelect: 'text' }}
                    title="Double-click anywhere to edit"
                  >
                    {selectedNote.title}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={onSaveNote}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Save
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onEditNote}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setShowAttachments(!showAttachments)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleLeftSidebar}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded-md transition-colors"
                title={isLeftSidebarVisible ? "Hide sidebar" : "Show sidebar"}
              >
                {isLeftSidebarVisible ? (
                  <ChevronLeft className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last saved {formatDate(selectedNote.updated_at)}
              </p>
            </div>
          </div>

          {/* Toolbar */}
          {isEditing && (
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-3 flex-shrink-0">
              <div className="flex items-center gap-1">
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded transition-colors">
                  <Bold className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded transition-colors">
                  <Italic className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded transition-colors">
                  <Underline className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded transition-colors">
                  <List className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded transition-colors">
                  <ListOrdered className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded transition-colors">
                  <Link2 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-800 rounded transition-colors">
                  <Image className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Note Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div
              ref={noteContentRef}
              className="max-w-4xl mx-auto p-6 relative"
              style={{
                userSelect: 'text', // Enable text selection
                cursor: isEditing ? 'text' : 'text' // Text cursor for better UX
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
              }}
            >
              {/* OLD Selection Overlay - Commented out */}
              {/* {!isEditing && <SelectionOverlay box={selectionBox} onAddToChat={onAddToChat} />} */}

              {/* NEW Manual Selection Box */}
              {!isEditing && (
                <ManualSelectionBox
                  selectionBox={selectionBox}
                  selectedElements={selectedElements}
                  onAddToChat={(text) => {
                    console.log('💬 Adding selected text to chat:', text);
                    onAddToChat(text);
                    clearSelection();
                  }}
                  onClearSelection={clearSelection}
                />
              )}
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedText = e.dataTransfer.getData('text/plain');
                    if (droppedText) {
                      console.log('📥 Dropped text into editor:', droppedText);

                      // Get cursor position in textarea
                      const textarea = e.target;
                      const cursorPos = textarea.selectionStart;
                      const textBefore = editedContent.substring(0, cursorPos);
                      const textAfter = editedContent.substring(cursorPos);

                      // Insert dropped text at cursor position
                      const newContent = textBefore + droppedText + textAfter;
                      setEditedContent(newContent);

                      // Set cursor position after inserted text
                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = cursorPos + droppedText.length;
                        textarea.focus();
                      }, 0);

                      console.log('✅ Text inserted at cursor position:', cursorPos);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Ctrl+Enter or Cmd+Enter to save
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      onSaveNote();
                    }
                    // Tab key for indentation
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const start = e.target.selectionStart;
                      const end = e.target.selectionEnd;
                      const newValue = editedContent.substring(0, start) + '  ' + editedContent.substring(end);
                      setEditedContent(newValue);
                      // Set cursor position after the inserted spaces
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd = start + 2;
                      }, 0);
                    }
                  }}
                  autoFocus
                  className="w-full h-full min-h-[500px] text-gray-900 dark:text-gray-100 leading-relaxed focus:outline-none resize-y font-mono text-sm"
                  placeholder="Start typing... (supports Markdown)
• Enter: New line
• Tab: Indent
• Ctrl+Enter: Quick save"
                  style={{
                    lineHeight: '1.6',
                    tabSize: 2,
                    whiteSpace: 'pre-wrap'
                  }}
                />
              ) : (
                <div
                  className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
                  style={{ userSelect: 'text' }} // Enable text selection in view mode
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                    console.log('🎯 Drag over note (view mode)');
                  }}
                  onDrop={(e) => {
                    console.log('🎯 DROP EVENT!');
                    e.preventDefault();
                    e.stopPropagation();

                    // Try to get JSON metadata first (from PDF drag)
                    let dragData = null;
                    try {
                      const jsonData = e.dataTransfer.getData('application/json');
                      if (jsonData) {
                        dragData = JSON.parse(jsonData);
                        console.log('📦 JSON metadata:', dragData);
                      }
                    } catch (error) {
                      console.log('⚠️ No JSON metadata, using plain text');
                    }

                    const droppedText = dragData?.text || e.dataTransfer.getData('text/plain');
                    console.log('📦 Text:', droppedText?.substring(0, 50));

                    if (droppedText) {
                      const noteContent = selectedNote.content || '';

                      // Get mouse position and container info
                      const containerRect = noteContentRef.current?.getBoundingClientRect();
                      if (!containerRect) {
                        console.warn('⚠️ No container, fallback');
                        if (onAddToNoteDirectly) onAddToNoteDirectly(droppedText);
                        return;
                      }

                      const mouseY = e.clientY;
                      console.log('📍 Mouse Y:', mouseY);

                      // Get all paragraphs
                      const allParagraphs = noteContentRef.current.querySelectorAll(
                        'p, h1, h2, h3, h4, h5, h6, li, blockquote'
                      );
                      console.log('📊 Paragraphs:', allParagraphs.length);

                      if (allParagraphs.length === 0) {
                        console.warn('⚠️ No paragraphs, fallback');
                        if (onAddToNoteDirectly) onAddToNoteDirectly(droppedText);
                        return;
                      }

                      // Find closest paragraph to mouse position
                      let closestEl = null;
                      let closestDist = Infinity;

                      allParagraphs.forEach((el) => {
                        const rect = el.getBoundingClientRect();
                        const elMiddle = rect.top + (rect.height / 2);
                        const dist = Math.abs(mouseY - elMiddle);

                        if (dist < closestDist) {
                          closestDist = dist;
                          closestEl = el;
                        }
                      });

                      console.log('🔍 Closest:', closestEl?.tagName);

                      if (closestEl) {
                        const targetText = closestEl.textContent.trim();
                        console.log('📝 Text:', targetText.substring(0, 30));

                        // Calculate insert position based on element order in DOM
                        // instead of searching for text in noteContent
                        let insertPos = 0;

                        // Find index of closest element in allParagraphs
                        const targetIndex = Array.from(allParagraphs).indexOf(closestEl);
                        console.log('📍 Target element index:', targetIndex);

                        // Sum up text length of all elements before target
                        for (let i = 0; i < targetIndex; i++) {
                          const el = allParagraphs[i];
                          const text = el.textContent.trim();
                          insertPos += text.length;
                          // Add paragraph separator length (usually \n\n = 2 chars)
                          if (i > 0) insertPos += 2;
                        }

                        console.log('📍 Calculated position:', insertPos);

                        // Check if mouse is below element middle
                        const elRect = closestEl.getBoundingClientRect();
                        const elMiddle = elRect.top + (elRect.height / 2);

                        if (mouseY >= elMiddle) {
                          // Insert after this element (at paragraph boundary)
                          insertPos += targetText.length;

                          // Ensure we're at a paragraph boundary
                          // Look for the next \n\n after insertPos
                          const afterText = noteContent.substring(insertPos);
                          const nextParagraphBreak = afterText.indexOf('\n\n');

                          if (nextParagraphBreak !== -1) {
                            // Move to after the paragraph break
                            insertPos += nextParagraphBreak + 2;
                            console.log('📍 Insert AFTER (at paragraph boundary):', insertPos);
                          } else {
                            // No paragraph break found, insert at end
                            insertPos = noteContent.length;
                            console.log('📍 Insert at END (no paragraph break found):', insertPos);
                          }
                        } else {
                          // Insert before this element (at paragraph boundary)
                          // insertPos is already at the start of the element
                          // Look backwards to find the previous paragraph break
                          const beforeText = noteContent.substring(0, insertPos);
                          const lastParagraphBreak = beforeText.lastIndexOf('\n\n');

                          if (lastParagraphBreak !== -1) {
                            // Move to after the paragraph break
                            insertPos = lastParagraphBreak + 2;
                            console.log('📍 Insert BEFORE (at paragraph boundary):', insertPos);
                          } else {
                            // No paragraph break found, insert at start
                            insertPos = 0;
                            console.log('📍 Insert at START (no paragraph break found):', insertPos);
                          }
                        }


                        // Check if we have PDF metadata (new flow)
                        if (dragData && dragData.type === 'pdf-selection' && dragData.bookId) {
                          console.log('📚 PDF text with metadata - calling API for real position');
                          console.log('   bookId:', dragData.bookId);
                          console.log('   bookTitle:', dragData.bookTitle);
                          console.log('   insertPos:', insertPos);
                          if (onAddToNoteAtPosition) {
                            onAddToNoteAtPosition(droppedText, insertPos, dragData.bookId, dragData.bookTitle);
                          } else {
                            console.error('❌ onAddToNoteAtPosition is not defined!');
                          }
                        } else {
                          // Old flow: check for existing citation in text
                          const citationMatch = droppedText.match(/!\[(.+?)-\/page\/(\d+)\/\w+\/\d+\]$/);

                          const before = noteContent.substring(0, insertPos);
                          const after = noteContent.substring(insertPos);

                          if (citationMatch) {
                            // Has old-style citation - from PDF (legacy)
                            const bookTitle = citationMatch[1];
                            const pageNum = parseInt(citationMatch[2], 10);
                            console.log('📚 PDF text with old citation format');

                            const updated = before + '\n\n' + droppedText + '\n\n' + after;
                            if (onReplaceNoteContent) {
                              onReplaceNoteContent(updated);
                            }
                          } else {
                            // No citation - from chatbot or plain text
                            console.log('💬 Plain text from chatbot');
                            const updated = before + '\n\n' + droppedText + '\n\n' + after;
                            if (onReplaceNoteContent) {
                              onReplaceNoteContent(updated);
                            } else if (onAddToNoteDirectly) {
                              onAddToNoteDirectly(droppedText);
                            }
                          }
                        }
                      } else {
                        console.warn('⚠️ No closest element, fallback');
                        if (onAddToNoteDirectly) onAddToNoteDirectly(droppedText);
                      }
                    }
                  }}
                >
                  <NoteRenderer
                    content={selectedNote.content || '*No content yet. Click to start editing...*'}
                    onBubbleClick={onBubbleClick}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 max-w-sm">
            <div className="w-20 h-20 bg-blue-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Không gian học tập</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Chọn một ghi chú bên trái để xem, hoặc tạo ghi chú mới để bắt đầu quá trình học tập của bạn.</p>
            {/* We could potentially put a 'Create Note' button here if we had the prop, but for now just display nice text */}
          </div>
        </div>
      )}
    </div>
  );
}

