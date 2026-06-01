import React from 'react';
import { BadgeCheck, CheckCircle2, Clock3, Hash, Loader2, Sparkles, AlertCircle, Trash2 } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return 'Vừa tạo';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return 'Vừa tạo';
  }
};

const formatDebugValue = (value) => {
  if (value == null || value === '') return '-';
  return String(value);
};

const copyDebugToClipboard = async (debugInfo) => {
  if (!debugInfo || !navigator?.clipboard?.writeText) return;
  await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
};

export default function QuizTab({
  notebookId,
  quizSets = [],
  selectedQuizSetId,
  onSelectQuizSet,
  onGenerateQuiz,
  onDeleteQuizSet,
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState({});
  const activeSet = quizSets.find((set) => set.id === selectedQuizSetId) || quizSets[0] || null;
  const isGenerating = activeSet?.status === 'generating';
  const isFailed = activeSet?.status === 'failed';
  const currentQuestion = activeSet?.questions?.[currentIndex] || null;
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = activeSet?.questions?.reduce((total, question, idx) => {
    if (selectedAnswers[idx] === question.correct_index) return total + 1;
    return total;
  }, 0) || 0;

  React.useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswers({});
  }, [activeSet?.id]);

  const goNext = () => {
    if (!activeSet) return;
    setCurrentIndex((prev) => Math.min(prev + 1, activeSet.questions.length - 1));
  };

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const chooseAnswer = (optionIdx) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optionIdx }));
  };

  const debugInfo = activeSet?.debugInfo || null;

  return (
    <div className="w-full py-4 px-6 h-full overflow-hidden flex gap-4 bg-[linear-gradient(180deg,#fbfbfd_0%,#f5f7fb_100%)]">
      <aside className="w-[320px] border border-[#e0e0e0] rounded-2xl bg-white/90 backdrop-blur-sm p-3 overflow-y-auto shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[11px] tracking-[0.16em] uppercase text-[#8a8a8f]">Quiz</h3>
          </div>
          <button
            type="button"
            onClick={onGenerateQuiz}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#0066cc] text-[#0066cc] bg-[#f0f7ff] hover:bg-[#e7f2ff] transition-colors"
          >
            Tạo quiz
          </button>
        </div>
        <div className="space-y-2">
          {quizSets.map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => onSelectQuizSet(set.id)}
              className={`w-full text-left p-3 rounded-lg border ${(activeSet?.id === set.id)
                ? 'border-[#0066cc] bg-[#f0f7ff]'
                : 'border-[#ececf0] bg-[#fafafd]'
                }`}
            >
              <p className="text-xs font-semibold text-[#1d1d1f] truncate">{set.title}</p>
              <p className="text-[11px] text-[#6e6e73] mt-1">
                {set.questions?.length || 0} câu hỏi
                {set.sourceTitle ? ` · ${set.sourceTitle}` : ''}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-h-[24px]">
                  {set.status === 'generating' && (
                    <p className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white border border-[#dbe7ff] text-[#3b67d6]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Đang tạo
                    </p>
                  )}
                  {set.status === 'failed' && (
                    <p className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white border border-[#ffd5d5] text-[#c25b5b]">
                      <AlertCircle className="w-3 h-3" />
                      Tạo thất bại
                    </p>
                  )}
                  {set.origin === 'api' && set.status !== 'generating' && set.status !== 'failed' && (
                    <p className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white border border-[#dbe7ff] text-[#3b67d6]">
                      <Sparkles className="w-3 h-3" />
                      API result
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteQuizSet?.(set.id);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ececf0] bg-white text-[#8a8a8f] hover:border-[#ffd5d5] hover:text-[#c25b5b] transition-colors"
                  aria-label="Xóa bộ quiz"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </button>
          ))}
          {!quizSets.length && (
            <p className="text-xs text-[#6e6e73]">Chưa có quiz nào.</p>
          )}
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto pr-1">
        <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-sm shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f] mt-1">Quiz từ Notebook</h3>
              <p className="text-sm text-[#6e6e73] mt-1">
                {activeSet?.sourceTitle || 'Notebook'}{activeSet?.cacheFile ? ` · ${activeSet.cacheFile.split('/').pop()}` : ''}
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs border border-blue-200 text-blue-700 bg-blue-50">
              {notebookId ? `Notebook ${notebookId.slice(0, 8)}` : 'Notebook'}
            </span>
          </div>

          {activeSet?.createdAt && (
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-[#5f5f68]">
              <Clock3 className="w-3.5 h-3.5" />
              {formatDate(activeSet.createdAt)}
            </div>
          )}

          {debugInfo && (
            <details className="mt-4 rounded-xl border border-[#ececf0] bg-[#fafafd] p-3">
              <summary className="cursor-pointer text-xs font-semibold tracking-[0.12em] uppercase text-[#6e6e73]">
                Debug
              </summary>
              <div className="mt-3 space-y-3 text-xs text-[#4a4a4f]">
                <button
                  type="button"
                  onClick={() => copyDebugToClipboard(debugInfo)}
                  className="inline-flex items-center rounded-lg border border-[#d2d2d7] bg-white px-3 py-1.5 text-[11px] font-medium text-[#4a4a4f] hover:border-[#0066cc] hover:text-[#0066cc]"
                >
                  Copy Debug JSON
                </button>
                <p><strong>Origin:</strong> {formatDebugValue(debugInfo.finalOrigin || activeSet?.origin)}</p>
                <p><strong>Notebook:</strong> {formatDebugValue(debugInfo.notebookTitle)} ({formatDebugValue(debugInfo.notebookId)})</p>
                <p><strong>Items:</strong> {formatDebugValue(debugInfo.finalItemCount)}</p>
                <p><strong>Lỗi:</strong> {formatDebugValue(debugInfo.error)}</p>
                {(debugInfo.attempts || []).map((attempt, index) => (
                  <div key={`${attempt.step}-${index}`} className="rounded-lg border border-[#e6e6eb] bg-white p-3">
                    <p><strong>Step:</strong> {formatDebugValue(attempt.step)}</p>
                    <p><strong>Endpoint:</strong> {formatDebugValue(attempt.endpoint || attempt.actionType)}</p>
                    <p><strong>Item count:</strong> {formatDebugValue(attempt.itemCount ?? attempt.parsedCount)}</p>
                    <p><strong>Cache file:</strong> {formatDebugValue(attempt.cacheFile)}</p>
                    <p className="mt-2"><strong>Request payload</strong></p>
                    <pre className="mt-1 overflow-x-auto rounded bg-[#f5f5f7] p-2 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {attempt.requestPayload ? JSON.stringify(attempt.requestPayload, null, 2) : '-'}
                    </pre>
                    <p className="mt-2"><strong>Response preview</strong></p>
                    <pre className="mt-2 overflow-x-auto rounded bg-[#f5f5f7] p-2 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {attempt.responsePreview || attempt.answerPreview || attempt.providerMetadataPreview || '-'}
                    </pre>
                  </div>
                ))}
              </div>
            </details>
          )}

          {activeSet && !isGenerating && !isFailed && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="rounded-xl border border-[#ececf0] bg-[#fafafd] p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8a8f]">Tổng câu</p>
                <p className="mt-1 text-xl font-semibold text-[#1d1d1f]">{activeSet.questions.length}</p>
              </div>
              <div className="rounded-xl border border-[#ececf0] bg-[#fafafd] p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8a8f]">Đã trả lời</p>
                <p className="mt-1 text-xl font-semibold text-[#1d1d1f]">{answeredCount}</p>
              </div>
              <div className="rounded-xl border border-[#ececf0] bg-[#fafafd] p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8a8f]">Đúng</p>
                <p className="mt-1 text-xl font-semibold text-[#1d1d1f]">{correctCount}</p>
              </div>
            </div>
          )}
        </div>

        {!activeSet ? (
          <div className="rounded-2xl border border-dashed border-[#d2d2d7] bg-white p-6">
            <p className="text-sm text-[#5a5a63]">
              Chưa có dữ liệu quiz. Bạn có thể tạo quiz mới ngay trong tab này.
            </p>
          </div>
        ) : isGenerating ? (
          <div className="rounded-2xl border border-white/70 bg-white/92 shadow-sm p-8">
            <div className="flex flex-col items-center justify-center text-center min-h-[360px]">
              <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98)_0%,rgba(240,247,255,0.86)_62%,rgba(214,231,255,0.65)_100%)]">
                <div className="absolute inset-0 rounded-full border-4 border-[#d6e7ff]" />
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#0066cc] border-r-[#3b67d6] animate-spin" />
                <Loader2 className="w-9 h-9 text-[#0066cc] animate-spin" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-[#1d1d1f]">Đang tạo bộ quiz</h3>
              <p className="mt-2 max-w-xl text-sm text-[#5f5f68] leading-relaxed">
                Prompt đang được gửi ngầm tới agent. Khi hoàn tất, câu hỏi đầu tiên sẽ xuất hiện ngay trong khu vực này.
              </p>
            </div>
          </div>
        ) : isFailed ? (
          <div className="rounded-2xl border border-[#ffd9d9] bg-[#fff8f8] p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#c25b5b] mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#8d3d3d]">Không thể tạo quiz</p>
                <p className="mt-1 text-sm text-[#7a5555]">
                  {activeSet.errorMessage || 'Agent không trả về dữ liệu hợp lệ cho bộ quiz này.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-white/70 bg-white/90 shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-xs text-[#6e6e73]">
                  Câu {currentIndex + 1} / {activeSet.questions.length}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#6e6e73]">
                  <Hash className="w-3.5 h-3.5" />
                  API array
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {activeSet.questions.map((question, idx) => {
                  const selected = selectedAnswers[idx];
                  const isDone = selected !== undefined;
                  const isCorrect = isDone && selected === question.correct_index;
                  return (
                    <button
                      key={`${question.question}-${idx}`}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`min-w-10 px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${currentIndex === idx
                        ? 'border-[#0066cc] bg-[#0066cc] text-white'
                        : isDone
                          ? isCorrect
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                          : 'border-[#ececf0] bg-[#fafafd] text-[#3f3f45]'
                        }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <p className="text-lg font-semibold text-[#1d1d1f] leading-relaxed">
                {currentQuestion?.question}
              </p>

              <div className="mt-4 grid gap-2">
                {(currentQuestion?.options || []).map((opt, idx) => {
                  const selected = selectedAnswers[currentIndex] === idx;
                  const showResult = selectedAnswers[currentIndex] !== undefined;
                  const isCorrect = currentQuestion?.correct_index === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => chooseAnswer(idx)}
                      className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-all ${selected
                        ? isCorrect
                          ? 'border-green-300 bg-green-50 text-green-800 shadow-[0_0_0_1px_rgba(34,197,94,0.08)]'
                          : 'border-red-300 bg-red-50 text-red-700'
                        : showResult && isCorrect
                          ? 'border-green-300 bg-green-50 text-green-800'
                          : 'border-[#ececf0] bg-[#fafafd] text-[#3f3f45] hover:border-[#cfd6e6] hover:bg-white'
                        }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/80 border border-current/15 text-[11px] font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{opt}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedAnswers[currentIndex] !== undefined && currentQuestion?.explanation && (
                <div className="mt-4 rounded-xl border border-[#dbe7ff] bg-[#f7fbff] p-4">
                  <div className="flex items-center gap-2 text-[#3b67d6] text-xs font-semibold uppercase tracking-[0.12em] mb-2">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Giải thích
                  </div>
                  <p className="text-sm text-[#3f3f45] leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="px-3 py-2 rounded-lg border border-[#d2d2d7] text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={currentIndex >= activeSet.questions.length - 1}
                  className="px-3 py-2 rounded-lg border border-[#d2d2d7] text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
