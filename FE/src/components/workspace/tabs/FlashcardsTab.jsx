import React, { useState } from 'react';
import { Clock3, ChevronLeft, ChevronRight, LayoutGrid, Sparkles, Loader2, AlertCircle, Trash2 } from 'lucide-react';

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

export default function FlashcardsTab({
  notebookId,
  flashcardSets = [],
  selectedFlashcardSetId,
  onSelectFlashcardSet,
  onGenerateFlashcards,
  onDeleteFlashcardSet,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeSet =
    flashcardSets.find((set) => set.id === selectedFlashcardSetId) || flashcardSets[0] || null;
  const isGenerating = activeSet?.status === 'generating';
  const isFailed = activeSet?.status === 'failed';
  const hasCards = (activeSet?.cards || []).length > 0;
  const card = hasCards ? activeSet.cards[currentIndex] : null;
  const debugInfo = activeSet?.debugInfo || null;

  React.useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [activeSet?.id]);

  const handleNext = () => {
    if (!hasCards) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.min(prev + 1, activeSet.cards.length - 1));
  };

  const handlePrev = () => {
    if (!hasCards) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="h-full flex gap-4 px-6 py-4 bg-[linear-gradient(180deg,#fbfbfd_0%,#f5f7fb_100%)]">
      <aside className="w-[320px] border border-[#e0e0e0] rounded-2xl bg-white/90 backdrop-blur-sm p-3 overflow-y-auto shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[11px] tracking-[0.16em] uppercase text-[#8a8a8f]">Flashcards</h3>
          </div>
          <button
            type="button"
            onClick={onGenerateFlashcards}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#0066cc] text-[#0066cc] bg-[#f0f7ff] hover:bg-[#e7f2ff] transition-colors"
          >
            Tạo flashcard
          </button>
        </div>
        <div className="space-y-2">
          {flashcardSets.map((set) => (
            <button
              key={set.id}
              type="button"
              onClick={() => onSelectFlashcardSet(set.id)}
              className={`w-full text-left p-3 rounded-lg border ${activeSet?.id === set.id
                ? 'border-[#0066cc] bg-[#f0f7ff]'
                : 'border-[#ececf0] bg-[#fafafd]'
                }`}
            >
              <p className="text-xs font-semibold text-[#1d1d1f] truncate">{set.title}</p>
              <p className="text-[11px] text-[#6e6e73] mt-1">
                {set.cards?.length || 0} thẻ
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
                    onDeleteFlashcardSet?.(set.id);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#ececf0] bg-white text-[#8a8a8f] hover:border-[#ffd5d5] hover:text-[#c25b5b] transition-colors"
                  aria-label="Xóa bộ flashcard"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </button>
          ))}
          {!flashcardSets.length && <p className="text-xs text-[#6e6e73]">Chưa có bộ flashcard.</p>}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-y-auto pr-1">
        <div className="rounded-2xl border border-white/70 bg-white/80 backdrop-blur-sm shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f] mt-1">Flashcards từ Notebook</h3>
              <p className="text-sm text-[#6e6e73] mt-1">
                {activeSet?.sourceTitle || 'Notebook'}{activeSet?.cacheFile ? ` · ${activeSet.cacheFile.split('/').pop()}` : ''}
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs border border-purple-200 text-purple-700 bg-purple-50">
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
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8a8f]">Tổng thẻ</p>
                <p className="mt-1 text-xl font-semibold text-[#1d1d1f]">{activeSet.cards.length}</p>
              </div>
              <div className="rounded-xl border border-[#ececf0] bg-[#fafafd] p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8a8f]">Đang xem</p>
                <p className="mt-1 text-xl font-semibold text-[#1d1d1f]">{currentIndex + 1}</p>
              </div>
              <div className="rounded-xl border border-[#ececf0] bg-[#fafafd] p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8a8f]">Trạng thái</p>
                <p className="mt-1 text-xl font-semibold text-[#1d1d1f]">{isFlipped ? 'Mặt sau' : 'Mặt trước'}</p>
              </div>
            </div>
          )}
        </div>

        {!activeSet || !hasCards ? (
          <div className="rounded-2xl border border-dashed border-[#d2d2d7] bg-white p-6">
            <p className="text-sm text-[#5a5a63]">
              Chưa có dữ liệu flashcard. Bạn có thể tạo flashcard ngay trong tab này.
            </p>
          </div>
        ) : isGenerating ? (
          <div className="rounded-2xl border border-white/70 bg-white/92 shadow-sm p-8">
            <div className="flex flex-col items-center justify-center text-center min-h-[360px]">
              <div className="relative flex items-center justify-center w-28 h-28 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98)_0%,rgba(245,240,255,0.88)_62%,rgba(230,219,255,0.64)_100%)]">
                <div className="absolute inset-0 rounded-full border-4 border-[#e6dbff]" />
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#6b3bd6] border-r-[#8f63e8] animate-spin" />
                <LayoutGrid className="w-9 h-9 text-[#6b3bd6]" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-[#1d1d1f]">Đang tạo bộ flashcard</h3>
              <p className="mt-2 max-w-xl text-sm text-[#5f5f68] leading-relaxed">
                Agent đang sinh từng thẻ từ notebook. Khi hoàn tất, bạn sẽ thấy ngay mặt trước của thẻ đầu tiên.
              </p>
            </div>
          </div>
        ) : isFailed ? (
          <div className="rounded-2xl border border-[#ffd9d9] bg-[#fff8f8] p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#c25b5b] mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#8d3d3d]">Không thể tạo flashcard</p>
                <p className="mt-1 text-sm text-[#7a5555]">
                  {activeSet.errorMessage || 'Agent không trả về dữ liệu hợp lệ cho bộ flashcard này.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsFlipped((prev) => !prev)}
                className="w-full max-w-2xl min-h-[320px] rounded-3xl border border-white/70 bg-white shadow-sm p-8 text-left relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,103,214,0.08),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(107,59,214,0.08),transparent_35%)]" />
                <div className="relative z-10">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#7a7a7a] mb-2">
                    {isFlipped ? 'Mặt sau' : 'Mặt trước'}
                  </p>
                  <p className={`font-semibold ${isFlipped ? 'text-lg text-[#2f2f33]' : 'text-2xl text-[#1d1d1f] leading-relaxed'}`}>
                    {isFlipped ? card.back : card.front}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-xs text-[#6e6e73]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Chạm để lật thẻ
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#d2d2d7] text-sm bg-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Thẻ trước
              </button>
              <span className="text-sm text-[#5f5f68]">
                {currentIndex + 1} / {activeSet.cards.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= activeSet.cards.length - 1}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#d2d2d7] text-sm bg-white disabled:opacity-50"
              >
                Thẻ sau
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
