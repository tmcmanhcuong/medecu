# 📦 Archive - Project Structure Snapshot

**Date**: 2026-01-16  
**Purpose**: Lưu trữ các components và hooks demo/prototype không còn sử dụng trong production

---

## 📁 Cấu trúc ban đầu (trước khi refactor)

### Components Structure

```
src/components/
├── Dashboard/
│   ├── LeftSidebar.jsx          ✅ Production (giữ lại)
│   ├── MainContent.jsx          ✅ Production (giữ lại)
│   ├── RightSidebar.jsx         ✅ Production (giữ lại)
│   ├── RightSidebar.css         ✅ Production (giữ lại)
│   └── index.js                 ✅ Production (giữ lại)
│
├── layout/
│   ├── NavBar.jsx               ✅ Production (giữ lại)
│   ├── SideBar.jsx              ✅ Production (giữ lại)
│   └── Test.jsx                 ❓ Unknown (cần review)
│
├── Production Components (giữ lại):
│   ├── ChatModeCard.tsx
│   ├── FeatureCard.tsx
│   ├── ToolCard.tsx
│   ├── RequireAuth.jsx
│   ├── NoteRenderer.jsx
│   ├── PDFViewer.jsx
│   ├── PdfLineSelectionOverlay.jsx
│   ├── SelectionOverlay.jsx
│   └── ManualSelectionBox.jsx
│
└── Demo/Prototype Components (archived):
    ├── PdfSelectionDemo.jsx      🗂️ → _archive/
    ├── NoteBlocksDemo.jsx        🗂️ → _archive/
    ├── PdfViewerWithSelection.jsx 🗂️ → _archive/
    ├── MarkdownWithSelection.jsx  🗂️ → _archive/
    ├── NoteBlock.jsx             🗂️ → _archive/
    └── NoteBlockList.jsx         🗂️ → _archive/
```

### Hooks Structure

```
src/hooks/
├── Production Hooks (giữ lại):
│   ├── useAuth.jsx              ✅ Production
│   ├── usePdfTextSelection.js   ✅ Production (RightSidebar)
│   ├── useChatTextSelection.js  ✅ Production (Dashboard)
│   ├── useManualSelection.js    ✅ Production (MainContent)
│   └── useTextSelection.js      ✅ Production (legacy, cần review)
│
└── Demo Hooks (archived):
    ├── usePdfLineSelection.js   🗂️ → _archive/
    ├── useNoteBlocks.js         🗂️ → _archive/
    └── hooks.txt                🗂️ → _archive/ (text file)
```

---

## 🗂️ Files trong Archive

### Components (6 files)

#### 1. `PdfSelectionDemo.jsx`
- **Mục đích**: Demo component để test PDF selection với multi-line highlighting
- **Dependencies**: usePdfLineSelection
- **Trạng thái**: Prototype, không được sử dụng trong production
- **Lý do archive**: Đã được thay thế bởi `RightSidebar.jsx` + `PdfLineSelectionOverlay.jsx`

#### 2. `NoteBlocksDemo.jsx`
- **Mục đích**: Demo component để test drag-drop note blocks
- **Dependencies**: useNoteBlocks, NoteBlockList
- **Trạng thái**: Prototype, không được sử dụng trong production
- **Lý do archive**: Đã được thay thế bởi `MainContent.jsx`

#### 3. `PdfViewerWithSelection.jsx`
- **Mục đích**: Early prototype của PDF viewer với text selection
- **Dependencies**: usePdfLineSelection
- **Trạng thái**: Replaced
- **Lý do archive**: Đã được thay thế hoàn toàn bởi `RightSidebar.jsx`

#### 4. `MarkdownWithSelection.jsx`
- **Mục đích**: Markdown renderer với text selection support
- **Dependencies**: None
- **Trạng thái**: Prototype
- **Lý do archive**: Đã được thay thế bởi `MainContent.jsx` + `NoteRenderer.jsx`

#### 5. `NoteBlock.jsx`
- **Mục đích**: Single draggable note block component
- **Dependencies**: None
- **Trạng thái**: Demo only
- **Lý do archive**: Chỉ được dùng trong `NoteBlocksDemo.jsx`

#### 6. `NoteBlockList.jsx`
- **Mục đích**: Container cho draggable note blocks
- **Dependencies**: NoteBlock
- **Trạng thái**: Demo only
- **Lý do archive**: Chỉ được dùng trong `NoteBlocksDemo.jsx`

### Hooks (3 files)

#### 1. `usePdfLineSelection.js` (14KB)
- **Mục đích**: Hook để handle multi-line text selection trong PDF
- **Sử dụng bởi**: PdfSelectionDemo, PdfViewerWithSelection (cả 2 đều bị archive)
- **Trạng thái**: Demo only
- **Lý do archive**: Đã được thay thế bởi `usePdfTextSelection.js` (production version)

#### 2. `useNoteBlocks.js` (7KB)
- **Mục đích**: Hook để manage drag-drop note blocks state
- **Sử dụng bởi**: NoteBlocksDemo (đã archive)
- **Trạng thái**: Demo only
- **Lý do archive**: Logic đã được integrate vào `MainContent.jsx`

#### 3. `hooks.txt`
- **Mục đích**: Unknown text file
- **Trạng thái**: Không phải code file
- **Lý do archive**: Không phải file code, không rõ mục đích

---

## 📊 Comparison: Demo vs Production

### PDF Selection Feature

| Aspect | Demo (Archived) | Production (Current) |
|--------|-----------------|---------------------|
| **Component** | `PdfSelectionDemo.jsx` | `RightSidebar.jsx` |
| **Overlay** | Inline | `PdfLineSelectionOverlay.jsx` (separated) |
| **Hook** | `usePdfLineSelection.js` | `usePdfTextSelection.js` |
| **Features** | Basic selection | + Citation support, + Chat integration |
| **Integration** | Standalone demo | Integrated with Dashboard |

### Note Blocks Feature

| Aspect | Demo (Archived) | Production (Current) |
|--------|-----------------|---------------------|
| **Component** | `NoteBlocksDemo.jsx` | `MainContent.jsx` |
| **Blocks** | `NoteBlockList.jsx` + `NoteBlock.jsx` | Inline in MainContent |
| **Hook** | `useNoteBlocks.js` | Integrated logic |
| **Features** | Drag-drop only | + Edit, + Selection, + Markdown |

---

## 🔄 Migration Notes

### If you need to restore Demo features:

#### PDF Selection Demo
```bash
# Copy back to components
cp src/_archive/components/PdfSelectionDemo.jsx src/components/
cp src/_archive/hooks/usePdfLineSelection.js src/hooks/

# Add route in App.jsx
import PdfSelectionDemo from './components/PdfSelectionDemo';
<Route path="/pdf-demo" element={<PdfSelectionDemo />} />
```

#### Note Blocks Demo
```bash
# Copy back all related files
cp src/_archive/components/NoteBlocksDemo.jsx src/components/
cp src/_archive/components/NoteBlock.jsx src/components/
cp src/_archive/components/NoteBlockList.jsx src/components/
cp src/_archive/hooks/useNoteBlocks.js src/hooks/

# Add route
import NoteBlocksDemo from './components/NoteBlocksDemo';
<Route path="/notes-demo" element={<NoteBlocksDemo />} />
```

---

## 📝 Refactoring History

### Phase 1: Initial Cleanup (2026-01-16)
- **Action**: Moved unused demo files to _archive/
- **Files moved**: 9 files (6 components + 3 hooks)
- **Impact**: -39% total files in src/
- **Status**: ✅ Complete

### Future Phases:
- **Phase 2**: Reorganize by feature (planned)
- **Phase 3**: Create barrel exports (planned)
- **Phase 4**: Review & refactor useTextSelection.js (planned)

---

## ⚠️ Important Notes

### Do NOT delete these files permanently because:
1. **Learning reference** - Good examples of component patterns
2. **Feature reference** - Có thể cần reference logic
3. **Backup** - Nếu cần rollback hoặc restore một feature
4. **Documentation** - Shows evolution of codebase

### When is it safe to delete?
- ✅ After 3+ months không cần reference
- ✅ After feature hoàn toàn stable trong production
- ✅ After team đã familiar với production code
- ✅ After documentation đầy đủ

---

## 📚 Related Documentation

- See: `REFACTORING_PLAN.md` - Full refactoring plan
- See: `src/components/README.md` - Component structure guide (planned)
- See: `src/hooks/README.md` - Hooks guide (planned)

---

**Last Updated**: 2026-01-16  
**Maintained by**: Development Team  
**Archive Status**: Active (do not delete)
