import React from 'react';
import { FileText, Move, MessageCircle, Sparkles } from 'lucide-react';

/**
 * Multi-line selection overlay for PDF viewer
 * Renders separate highlight boxes for each line
 */
export default function PdfLineSelectionOverlay({
    selectionLines,
    selectedText,
    onAddToNote,  // Adds to note with citation
    onAddToNoteWithAI,  // Adds to note with AI enhancement (new)
    onAddToChat,  // Adds to chat input
    onClearSelection,
    isAIProcessing = false,  // Loading state for AI processing
    bookId = null,  // Book ID for API calls
    bookTitle = null,  // Book title for citation
    pageNumber = 0  // Page number for citation
}) {
    const isProcessingRef = React.useRef(false);

    if (!selectionLines || selectionLines.length === 0) {
        return null;
    }



    // Calculate position for action buttons (center of first line)
    const firstLine = selectionLines[0];
    const buttonX = firstLine.left + (firstLine.width / 2);
    const buttonY = firstLine.top - 35; // Moved higher to avoid covering text

    const handleAddToNote = () => {
        if (isProcessingRef.current) {
            return;
        }

        isProcessingRef.current = true;


        if (selectedText && onAddToNote) {
            onAddToNote(selectedText);
        } else {
            console.warn('❌ Cannot add to note:', {
                hasText: !!selectedText,
                hasCallback: !!onAddToNote
            });
        }

        if (onClearSelection) {
            onClearSelection();
        }

        // Reset flag after a short delay
        setTimeout(() => {
            isProcessingRef.current = false;
        }, 500);
    };

    const handleAddToChat = () => {


        if (selectedText && onAddToChat) {
            onAddToChat(selectedText);
        } else {
            console.warn('❌ Cannot add to chat:', {
                hasText: !!selectedText,
                hasCallback: !!onAddToChat
            });
        }

        if (onClearSelection) {
            onClearSelection();
        }
    };

    const handleAddToNoteWithAI = () => {
        if (isAIProcessing) {
            return;
        }



        if (selectedText && onAddToNoteWithAI) {
            onAddToNoteWithAI(selectedText);
        } else {
            console.warn('❌ Cannot add to note with AI:', {
                hasText: !!selectedText,
                hasCallback: !!onAddToNoteWithAI
            });
        }

        // Don't clear selection immediately - let the AI handler do it after success
    };

    const handleDragStart = (e) => {
        if (!selectedText) return;

        // Pass metadata as JSON so drop handler can call API to find real position
        const dragData = {
            text: selectedText,
            bookId: bookId,
            bookTitle: bookTitle?.replace(/\.pdf$/i, '') || 'unknown',
            pageNumber: pageNumber,
            type: 'pdf-selection'
        };

        console.log('🚀 Drag started with data:', dragData);
        console.log('   bookId:', bookId);
        console.log('   bookTitle:', bookTitle);
        console.log('   pageNumber:', pageNumber);

        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', selectedText); // Fallback plain text
        e.dataTransfer.setData('application/json', JSON.stringify(dragData)); // Metadata for API lookup

        console.log('✅ Drag data set successfully');
    };

    const handleDragEnd = (e) => {

    };

    return (
        <>
            {/* Render highlight box for each line */}
            {selectionLines.map((line, index) => (
                <div
                    key={index}
                    className="pdf-line-selection-box"
                    style={{
                        position: 'absolute',
                        left: `${line.left}px`,
                        top: `${line.top}px`,
                        width: `${line.width}px`,
                        height: `${line.height}px`,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        pointerEvents: 'none',
                        zIndex: 10,
                        transition: 'all 0.05s ease-out'
                    }}
                />
            ))}

            {/* Action buttons - positioned above first line */}
            <div
                style={{
                    position: 'absolute',
                    left: `${buttonX}px`,
                    top: `${buttonY}px`,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '8px',
                    pointerEvents: 'none', // Changed to 'none' - buttons will override with 'auto'
                    zIndex: 10000 // Higher than chatbot (z-50)
                }}
            >
                {/* Add to Note Button */}
                <button
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        handleAddToNote();
                    }}
                    className="selection-action-btn"
                    title="Add to Note"
                    style={{
                        cursor: 'pointer',
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '6px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        transition: 'transform 0.2s ease',
                        pointerEvents: 'auto',
                        zIndex: 10000
                    }}
                    onMouseEnter={(e) => {

                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {

                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <FileText className="w-5 h-5" />
                </button>

                {/* Add to Note with AI Button */}
                <button
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        handleAddToNoteWithAI();
                    }}
                    disabled={isAIProcessing}
                    className="selection-action-btn"
                    title={isAIProcessing ? "Processing with AI..." : "Add to Note with AI"}
                    style={{
                        cursor: isAIProcessing ? 'not-allowed' : 'pointer',
                        backgroundColor: isAIProcessing ? '#a78bfa' : '#8b5cf6', // Lighter purple when processing
                        color: 'white',
                        padding: '6px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        transition: 'transform 0.2s ease, background-color 0.2s ease',
                        pointerEvents: 'auto',
                        zIndex: 10000,
                        opacity: isAIProcessing ? 0.8 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!isAIProcessing) {

                            e.currentTarget.style.transform = 'scale(1.1)';
                        }
                    }}
                    onMouseLeave={(e) => {

                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {isAIProcessing ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                        <Sparkles className="w-5 h-5" />
                    )}
                </button>

                {/* Add to Chat Button */}
                <button
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        handleAddToChat();
                    }}
                    className="selection-action-btn"
                    title="Add to Chat"
                    style={{
                        cursor: 'pointer',
                        backgroundColor: '#f97316', // Orange color
                        color: 'white',
                        padding: '6px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        transition: 'transform 0.2s ease',
                        pointerEvents: 'auto',
                        zIndex: 10000
                    }}
                    onMouseEnter={(e) => {

                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {

                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <MessageCircle className="w-5 h-5" />
                </button>

                {/* Drag Handle */}
                <div
                    draggable
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    className="selection-drag-handle"
                    style={{
                        cursor: 'grab',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '6px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        width: '32px',
                        height: '32px',
                        transition: 'transform 0.2s ease',
                        pointerEvents: 'auto',
                        zIndex: 10000
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseDown={(e) => {
                        e.currentTarget.style.cursor = 'grabbing';
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.cursor = 'grab';
                    }}
                >
                    <Move className="w-5 h-5" />
                </div>
            </div>
        </>
    );
}
