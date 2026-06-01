import React, { useRef } from 'react';
import { usePdfLineSelection } from '../hooks/usePdfLineSelection';
import PdfLineSelectionOverlay from './PdfLineSelectionOverlay';

/**
 * Example: PDF Viewer with line-based text selection
 * 
 * Usage:
 * <PdfViewerWithSelection pdfContent={pdfContent} onAddToChat={handleAddToChat} />
 */
export default function PdfViewerWithSelection({ pdfContent, onAddToChat }) {
    const containerRef = useRef(null);

    // Use the PDF line selection hook
    const { selectionLines, selectedText, clearSelection } = usePdfLineSelection(containerRef);

    const handleAddToChat = (text) => {
        console.log('📤 Adding to chat:', text);
        if (onAddToChat) {
            onAddToChat(text);
        }
        clearSelection();
    };

    return (
        <div
            ref={containerRef}
            data-pdf-container
            style={{
                position: 'relative',
                padding: '20px',
                backgroundColor: '#f9fafb',
                minHeight: '100vh',
                userSelect: 'text', // Enable text selection
                cursor: 'text'
            }}
        >
            {/* PDF Content - rendered as <span> + <br> */}
            {/* This is where your PDF text layer goes */}
            <div className="pdf-text-layer">
                {/* Example structure: */}
                {pdfContent?.pages?.map((page, pageIndex) => (
                    <div key={pageIndex} className="pdf-page" style={{ marginBottom: '20px' }}>
                        {page.lines?.map((line, lineIndex) => (
                            <div key={lineIndex}>
                                {line.spans?.map((span, spanIndex) => (
                                    <span
                                        key={spanIndex}
                                        style={{
                                            fontSize: span.fontSize || '14px',
                                            fontFamily: span.fontFamily || 'serif'
                                        }}
                                    >
                                        {span.text}
                                    </span>
                                ))}
                                {lineIndex < page.lines.length - 1 && <br />}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Selection Overlay - renders multiple boxes for each line */}
            <PdfLineSelectionOverlay
                selectionLines={selectionLines}
                selectedText={selectedText}
                onAddToChat={handleAddToChat}
                onClearSelection={clearSelection}
            />
        </div>
    );
}
