import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, Download, Maximize2 } from "lucide-react";
import { getAllBooks, downloadBookFile, getBookContent } from "../../services/book";
import { loadBookWithCache } from "../../services/cache";
import { usePdfTextSelection } from "../../hooks/usePdfTextSelection";
import PdfLineSelectionOverlay from "../PdfLineSelectionOverlay";
import { generateOutline } from "../../services/AI/aiService";
import './RightSidebar.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function RightSidebar({
  selectedNote,
  onClose,
  isResizing = false,
  selectedHighlight = null, // Position string like "/page/0/Text/2"
  onAddToNote, // Callback to add selected text to note with citation
  onAddToNoteDirectly, // Callback to add text directly without citation (for AI)
  onAddToChat, // Callback to add selected text to chat
}) {
  const [numPages, setNumPages] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [containerWidth, setContainerWidth] = useState(600);
  const [loadError, setLoadError] = useState(null);

  // State for dynamically loaded PDF from server
  const [pdfData, setPdfData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Ref for PDF container to enable text selection
  const pdfContainerRef = useRef(null);

  // Selection for PDF text - using multi-line selection hook
  const { selectionLines, selectedText, pageNumber, clearSelection } = usePdfTextSelection(pdfContainerRef);

  // Citation counter for unique references
  const citationCounterRef = useRef(0);

  // Loading state for AI processing
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  // Helper function to calculate text similarity (Levenshtein-based)
  const calculateSimilarity = (str1, str2) => {
    // Normalize strings: lowercase, remove extra whitespace
    const normalize = (str) => str.toLowerCase().replace(/\s+/g, ' ').trim();
    const s1 = normalize(str1);
    const s2 = normalize(str2);

    // If one string contains the other, high similarity
    if (s1.includes(s2) || s2.includes(s1)) {
      const longer = Math.max(s1.length, s2.length);
      const shorter = Math.min(s1.length, s2.length);
      return shorter / longer; // Ratio of overlap
    }

    // Simple character-based similarity
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;

    let matches = 0;
    const minLen = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLen; i++) {
      if (s1[i] === s2[i]) matches++;
    }

    return matches / maxLen;
  };

  // Wrapper function to add citation when adding PDF text to note
  const handleAddToNoteWithCitation = async (selectedText) => {
    if (!onAddToNote || !selectedText) return;

    try {
      // Get book ID from pdfData
      const bookId = pdfData?.id;
      const bookTitle = pdfData?.title?.replace(/\.pdf$/i, '') || 'unknown';

      if (!bookId) {
        console.warn('⚠️ No book ID available, using fallback citation');
        // Fallback to simple citation
        citationCounterRef.current += 1;
        const citation = `![${bookTitle}-/page/0/Text/${citationCounterRef.current}]`;
        const textWithCitation = `${selectedText.trim()}\n${citation}`;
        onAddToNote(textWithCitation);
        return;
      }

      console.log('🔍 Fetching book content to find matching position...');

      // Fetch book content from API
      const contentResponse = await getBookContent(bookId);

      if (!contentResponse?.data?.contents || contentResponse.data.contents.length === 0) {
        console.warn('⚠️ No book content available, using fallback citation');
        citationCounterRef.current += 1;
        const citation = `![${bookTitle}-/page/0/Text/${citationCounterRef.current}]`;
        const textWithCitation = `${selectedText.trim()}\n${citation}`;
        onAddToNote(textWithCitation);
        return;
      }

      const contents = contentResponse.data.contents;
      console.log(`📚 Comparing with ${contents.length} content items...`);

      // Find the best matching content
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const content of contents) {
        const similarity = calculateSimilarity(selectedText, content.content);

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = content;
        }
      }

      console.log(`✅ Best match found with similarity: ${(bestSimilarity * 100).toFixed(2)}%`);
      console.log(`📍 Position: ${bestMatch?.position}`);

      // Use the position from the best match
      let citation;
      if (bestMatch && bestSimilarity > 0.3) { // Threshold for acceptable match
        citation = `![${bookTitle}-${bestMatch.position}]`;
        console.log(`✨ Using matched position: ${citation}`);
      } else {
        // Fallback if no good match found
        console.warn('⚠️ No good match found, using fallback citation');
        citationCounterRef.current += 1;
        citation = `![${bookTitle}-/page/0/Text/${citationCounterRef.current}]`;
      }

      // Append text with citation
      const textWithCitation = `${selectedText.trim()}\n${citation}`;

      // Call original onAddToNote with text + citation
      onAddToNote(textWithCitation);

    } catch (error) {
      console.error('❌ Error finding matching position:', error);
      // Fallback to simple citation on error
      citationCounterRef.current += 1;
      const bookTitle = pdfData?.title?.replace(/\.pdf$/i, '') || 'unknown';
      const citation = `![${bookTitle}-/page/0/Text/${citationCounterRef.current}]`;
      const textWithCitation = `${selectedText.trim()}\n${citation}`;
      onAddToNote(textWithCitation);
    }
  };

  // Wrapper function to add AI-enhanced summary to note
  const handleAddToNoteWithAI = async (selectedText) => {
    if (!onAddToNoteDirectly || !selectedText) {
      console.warn('❌ onAddToNoteDirectly not available or no text selected');
      return;
    }

    try {
      setIsAIProcessing(true);
      console.log('🤖 Processing text with AI...');
      console.log('📝 Selected text from PDF:', selectedText);

      // Extract note content up to first ## header as style template
      let styleTemplate = '';
      if (selectedNote && selectedNote.content) {
        const noteContent = selectedNote.content;
        // Find the position of first ## header
        const firstH2Index = noteContent.indexOf('\n##');

        if (firstH2Index !== -1) {
          // Extract content from start to first ## (inclusive of the header line)
          const endOfH2Line = noteContent.indexOf('\n', firstH2Index + 1);
          styleTemplate = noteContent.substring(0, endOfH2Line !== -1 ? endOfH2Line : firstH2Index + 3);
        } else {
          // If no ## found, use entire note content as style
          styleTemplate = noteContent;
        }

        console.log('📋 Style template extracted (up to first ##):', styleTemplate.substring(0, 100) + '...');
      }

      // Call AI service to generate outline/summary with style
      console.log('🔄 Calling generateOutline API...');
      const response = await generateOutline(selectedText, styleTemplate);

      // Extract text from response array
      const aiGeneratedText = response[0]?.text || response.text || selectedText;

      console.log('✅ AI processing complete');
      console.log('📄 AI generated text length:', aiGeneratedText.length);

      // Append AI-generated text to the end of the note (no citation needed)
      const textToAdd = `\n\n${aiGeneratedText.trim()}`;

      // Call onAddToNoteDirectly to append to note without citation
      onAddToNoteDirectly(textToAdd);

      // Clear selection after successful add
      clearSelection();
    } catch (error) {
      console.error('❌ Error processing text with AI:', error);
      console.error('   Error details:', error.message);
      // Fallback to regular add if AI fails
      alert(`Lỗi khi xử lý với AI: ${error.message}\n\nSẽ thêm văn bản gốc vào note.`);
      handleAddToNoteWithCitation(selectedText);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const containerRef = useRef(null);

  // Load PDF and content from server when component mounts
  useEffect(() => {
    async function loadPDF() {
      try {
        setPdfLoading(true);
        console.log('📚 Loading PDF from server using original functions...');

        // Use original getAllBooks function
        const booksResponse = await getAllBooks(1, 1);

        if (!booksResponse.data || booksResponse.data.length === 0) {
          throw new Error('No books available');
        }

        const firstBook = booksResponse.data[0];
        const { id, title, path } = firstBook;

        console.log(`📖 First book: "${title}" (ID: ${id}) at path: ${path}`);

        // Use cache function to load with caching
        const blobUrl = await loadBookWithCache(title, path);

        setPdfData({
          id,
          title,
          path,
          blobUrl
        });

        console.log('✅ PDF loaded:', title);

        // Load book content (highlights) using book ID
        console.log('📄 Loading book content for ID:', id);
        const contentResponse = await getBookContent(id);

        if (contentResponse?.data?.contents) {
          setHighlights(contentResponse.data.contents);
          console.log('✅ Book content loaded:', contentResponse.data.contents.length, 'highlights');
        }
      } catch (error) {
        console.error('❌ Failed to load PDF from server:', error);
        setLoadError(error.message);
      } finally {
        setPdfLoading(false);
      }
    }

    if (selectedNote) {
      loadPDF();
    }
  }, [selectedNote]);

  if (!selectedNote) return null;

  // Get the first PDF attachment (fallback)
  const pdfAttachment = selectedNote.attachments?.find(att => att.type.includes('pdf'));

  // Use loaded PDF data from server API only
  const pdfUrl = pdfData?.blobUrl || pdfAttachment?.url;
  const pdfName = pdfData?.title || pdfAttachment?.name || 'Document';
  const pdfSize = pdfAttachment?.size || '1.2 MB';

  // Highlights are now loaded from API in the main useEffect above

  // Calculate container width - ensure PDF fits within RightSidebar
  useEffect(() => {
    if (!pdfContainerRef.current) return;

    const updateWidth = () => {
      if (pdfContainerRef.current) {
        const width = pdfContainerRef.current.offsetWidth;
        if (width > 0) {
          // Subtract padding from both sides (total 48px: 16px left + 16px right from py-4 gap-4)
          // This ensures PDF doesn't overflow the container
          setContainerWidth(Math.max(width - 48, 250));
        }
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame for smooth updates during resize
      requestAnimationFrame(updateWidth);
    });

    resizeObserver.observe(pdfContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Auto-scroll to selected highlight
  useEffect(() => {
    if (!selectedHighlight || !pdfContainerRef.current) return;

    console.log('🎯 Auto-scroll triggered for highlight:', selectedHighlight);

    // Wait for PDF to render
    const scrollTimer = setTimeout(() => {
      const highlightElement = pdfContainerRef.current.querySelector(`[data-highlight-position="${selectedHighlight}"]`);
      console.log('🔍 Found highlight element:', highlightElement);

      if (highlightElement) {
        highlightElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });
        console.log('✅ Scrolled to highlight');
      } else {
        console.warn('❌ Highlight element not found for position:', selectedHighlight);
      }
    }, 800); // Increased wait time to ensure PDF is fully rendered

    return () => clearTimeout(scrollTimer);
  }, [selectedHighlight]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoadError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF Load Error:', error);
    setLoadError(error.message);
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = pdfName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  };



  // Get highlights for a specific page - ONLY selected highlight
  const getHighlightsForPage = (pageNum) => {
    // If no highlight is selected, return empty array
    if (!selectedHighlight) return [];

    // Find the selected highlight
    const selectedH = highlights.find(h => h.position === selectedHighlight);
    if (!selectedH) return [];

    // Check if this highlight is on the current page
    const pageMatch = selectedH.position.match(/\/page\/(\d+)\//);
    const highlightPage = pageMatch ? parseInt(pageMatch[1]) + 1 : 1;

    if (highlightPage !== pageNum) return [];

    // Return only the selected highlight
    try {
      const coords = JSON.parse(selectedH.box);
      return [{
        x: coords[0],
        y: coords[1],
        width: coords[2] - coords[0],
        height: coords[3] - coords[1],
        content: selectedH.content,
        position: selectedH.position
      }];
    } catch (error) {
      return [];
    }
  };



  return (
    <div
      className="w-full bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 flex flex-col h-full"
      style={{
        contain: 'layout style paint'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
              <path d="M14 2v6h6" />
              <path d="M9 13h6" />
              <path d="M9 17h6" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{pdfName}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              PDF Document • {pdfSize}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFullscreen}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors p-1.5 hover:bg-white dark:bg-slate-900 rounded-lg"
            title="Full Screen"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="text-blue-600 hover:text-blue-700 transition-colors p-1.5 hover:bg-white dark:bg-slate-900 rounded-lg"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors p-1.5 hover:bg-white dark:bg-slate-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PDF Viewer - Continuous Scroll */}
      <div
        ref={pdfContainerRef}
        data-pdf-container="true"
        className="flex-1 overflow-auto bg-gray-100 dark:bg-slate-800 pdf-container relative"
        style={{
          pointerEvents: isResizing ? 'none' : 'auto',
          userSelect: 'text'
        }}
      >
        {/* Multi-line Selection Overlay for PDF */}
        <PdfLineSelectionOverlay
          selectionLines={selectionLines}
          selectedText={selectedText}
          onAddToNote={handleAddToNoteWithCitation}
          onAddToNoteWithAI={handleAddToNoteWithAI}
          onAddToChat={onAddToChat}
          onClearSelection={clearSelection}
          isAIProcessing={isAIProcessing}
          bookId={pdfData?.id}
          bookTitle={pdfData?.title}
          pageNumber={pageNumber}
        />

        <style>{`
          [data-pdf-container] ::selection {
            background: rgba(59, 130, 246, 0.3);
            color: inherit;
          }
          [data-pdf-container] ::-moz-selection {
            background: rgba(59, 130, 246, 0.3);
            color: inherit;
          }
        `}</style>
        {pdfLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Đang tải PDF từ server...</p>
            <p className="text-gray-400 text-sm mt-2">Vui lòng đợi...</p>
          </div>
        ) : pdfUrl ? (
          <div className="flex flex-col items-center py-4 gap-4">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-500 dark:text-gray-400">Loading PDF...</span>
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center p-8 text-red-600">
                  <p className="font-semibold">Failed to load PDF</p>
                  <p className="text-sm mt-2">{loadError}</p>
                </div>
              }
            >
              {numPages && Array.from(new Array(numPages), (el, index) => {
                const pageNum = index + 1;
                const pageHighlights = getHighlightsForPage(pageNum);
                const currentScale = containerWidth / 612; // Approximation base width

                return (
                  <div key={`page_${pageNum}`} className="relative mb-4 shadow-lg" data-page-number={pageNum}>
                    <Page
                      pageNumber={pageNum}
                      width={containerWidth}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className="bg-white dark:bg-slate-900"
                      loading={
                        <div className="bg-white dark:bg-slate-900 h-[800px] w-full flex items-center justify-center text-gray-400">
                          Loading Page {pageNum}...
                        </div>
                      }
                    />

                    {/* Highlight Overlays - Only selected */}
                    {pageHighlights.map((highlight, index) => (
                      <div
                        key={`highlight_${pageNum}_${index}`}
                        data-highlight-position={highlight.position}
                        className="absolute pointer-events-none pdf-highlight"
                        style={{
                          left: `${highlight.x * currentScale}px`,
                          top: `${highlight.y * currentScale}px`,
                          width: `${highlight.width * currentScale}px`,
                          height: `${highlight.height * currentScale}px`,
                          backgroundColor: 'rgba(255, 255, 0, 0.3)', // Yellow highlight
                          border: '2px solid rgba(255, 200, 0, 0.7)', // Yellow border
                          borderRadius: '2px',
                          zIndex: 20,
                        }}
                        title={highlight.content}
                      />
                    ))
                    }

                    {/* Page info */}
                    <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white dark:bg-slate-900/80 px-2 py-1 rounded">
                      Page {pageNum}
                    </div>
                  </div>
                );
              })}
            </Document>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <p className="text-gray-400">No PDF attached</p>
          </div>
        )}
      </div>
    </div>
  );
}
