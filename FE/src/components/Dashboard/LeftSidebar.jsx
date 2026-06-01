import { useState, useRef, useEffect } from "react";
import { Search, Plus, MoreVertical, Trash2, Edit3, Copy, CheckSquare, Square, BookOpen, Layers } from "lucide-react";

export default function LeftSidebar({
  notes,
  selectedNoteId,
  searchQuery,
  setSearchQuery,
  isMultiSelectMode,
  selectedNotes,
  onSelectNote,
  onEditNote,
  onDeleteNote,
  onDuplicateNote,
  onCreateNote,
  toggleMultiSelectMode,
  toggleNoteSelection,
  onCreateQuiz,
  onCreateFlashcard,
  formatDate,
  isResizing = false, // New prop for resize optimization
  isLoading = false, // Loading state
  error = null // Error message
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="w-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full"
      style={{
        // Disable pointer events during resize for better performance
        pointerEvents: isResizing ? 'none' : 'auto'
      }}
    >
      {/* Search and Multi-select Toggle */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm ghi chú..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={toggleMultiSelectMode}
          className={`w-full py-2 px-3 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${isMultiSelectMode
            ? "bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500"
            : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            }`}
        >
          {isMultiSelectMode ? (
            <>
              <CheckSquare className="w-4 h-4" />
              Hủy chọn
            </>
          ) : (
            <>
              <Square className="w-4 h-4" />
              Làm bài tập
            </>
          )}
        </button>

        {/* Multi-select Toolbar */}
        {isMultiSelectMode && selectedNotes.length > 0 && (
          <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 mb-2 font-medium">
              Đã chọn {selectedNotes.length} note(s)
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={onCreateQuiz}
                className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-900 border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-colors text-xs font-medium flex items-center justify-center gap-1 min-w-0"
              >
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Quiz</span>
              </button>
              <button
                onClick={onCreateFlashcard}
                className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-900 border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-colors text-xs font-medium flex items-center justify-center gap-1 min-w-0"
              >
                <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Flashcard</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-2 py-2">
          {isLoading ? (
            <div className="text-center py-8 px-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Đang tải ghi chú...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 px-4">
              <p className="text-red-500 text-sm mb-2">❌ Lỗi tải ghi chú</p>
              <p className="text-gray-400 text-xs">{error}</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                {notes.length === 0
                  ? "Chưa có ghi chú nào"
                  : "Không tìm thấy ghi chú phù hợp"}
              </p>
              <p className="text-gray-400 text-xs">
                {notes.length === 0
                  ? "Nhấn 'New Note' để tạo ghi chú mới"
                  : "Thử tìm kiếm với từ khóa khác"}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isNoteSelected = selectedNotes.includes(note.id);
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    if (isMultiSelectMode) {
                      toggleNoteSelection(note.id);
                    } else {
                      onSelectNote(note.id);
                    }
                  }}
                  onDoubleClick={() => {
                    if (!isMultiSelectMode) {
                      onEditNote(note.id);
                    }
                  }}
                  className={`w-full p-2.5 mb-3 rounded-lg cursor-pointer transition-colors relative border-l-4 ${isMultiSelectMode && isNoteSelected
                    ? `bg-blue-100 border-blue-500 ring-2 ring-blue-400`
                    : selectedNoteId === note.id && !isMultiSelectMode
                      ? `bg-blue-50 border-blue-400`
                      : `hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 border-gray-300 dark:border-slate-600 border-r border-t border-b`
                    }`}
                >
                  <div className="flex items-start justify-between mb-1 gap-1">
                    {isMultiSelectMode && (
                      <div className="flex-shrink-0">
                        {isNoteSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate flex-1 min-w-0">
                      {note.title}
                    </h4>
                    {!isMultiSelectMode && (
                      <div className="relative flex-shrink-0" ref={openMenuId === note.id ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === note.id ? null : note.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === note.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditNote(note.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center gap-2 rounded-t-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                              Sửa
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateNote(note.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Nhân bản
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Last modified: {formatDate(note.updated_at)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Note Button */}
      <div className="p-3 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900">
        <button
          onClick={onCreateNote}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">New Note</span>
        </button>
      </div>
    </div>
  );
}

