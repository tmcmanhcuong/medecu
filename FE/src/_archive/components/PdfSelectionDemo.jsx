import React, { useRef } from 'react';
import { usePdfLineSelection } from '../hooks/usePdfLineSelection';
import PdfLineSelectionOverlay from './PdfLineSelectionOverlay';

/**
 * Demo component to test PDF line selection
 * Simulates PDF text layer with <span> + <br> structure
 */
export default function PdfSelectionDemo() {
    const containerRef = useRef(null);
    const { selectionLines, selectedText, clearSelection } = usePdfLineSelection(containerRef);

    const handleAddToChat = (text) => {
        alert(`Adding to chat:\n\n${text}`);
        clearSelection();
    };

    // Mock PDF content
    const mockPdfPages = [
        {
            pageNumber: 1,
            lines: [
                {
                    spans: [
                        { text: 'This is the first line of the PDF document. ', fontSize: '14px' },
                        { text: 'It contains multiple spans.', fontSize: '14px', fontWeight: 'bold' }
                    ]
                },
                {
                    spans: [
                        { text: 'Second line with ', fontSize: '14px' },
                        { text: 'different ', fontSize: '14px', color: 'blue' },
                        { text: 'formatting.', fontSize: '14px' }
                    ]
                },
                {
                    spans: [
                        { text: 'This is a very long line that will wrap to multiple visual lines when the container width is not wide enough to fit all the text in a single line. ', fontSize: '14px' }
                    ]
                },
                {
                    spans: [
                        { text: 'Short line.', fontSize: '14px' }
                    ]
                },
                {
                    spans: [
                        { text: 'Another paragraph starts here. ', fontSize: '14px' },
                        { text: 'It has multiple sentences. ', fontSize: '14px' },
                        { text: 'Each sentence might be in different spans.', fontSize: '14px' }
                    ]
                }
            ]
        },
        {
            pageNumber: 2,
            lines: [
                {
                    spans: [
                        { text: 'Page 2 - First line', fontSize: '16px', fontWeight: 'bold' }
                    ]
                },
                {
                    spans: [
                        { text: 'This is content on the second page. ', fontSize: '14px' },
                        { text: 'You can select across pages.', fontSize: '14px' }
                    ]
                },
                {
                    spans: [
                        { text: 'Try selecting from page 1 to page 2!', fontSize: '14px', fontStyle: 'italic' }
                    ]
                }
            ]
        }
    ];

    return (
        <div style={{ padding: '40px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '20px', color: '#1f2937' }}>
                    PDF Line Selection Demo
                </h1>

                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ marginTop: 0, color: '#374151' }}>Instructions:</h3>
                    <ul style={{ color: '#6b7280' }}>
                        <li>Click and drag to select text</li>
                        <li>Selection will highlight each line separately</li>
                        <li>Try selecting wrapped text (long line)</li>
                        <li>Try selecting across multiple lines</li>
                        <li>Use action buttons to add to chat or copy</li>
                    </ul>
                </div>

                {/* PDF Container */}
                <div
                    ref={containerRef}
                    data-pdf-container
                    style={{
                        position: 'relative',
                        backgroundColor: 'white',
                        padding: '40px',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        userSelect: 'text',
                        cursor: 'text',
                        lineHeight: '1.6',
                        maxHeight: '600px',
                        overflowY: 'auto'
                    }}
                >
                    {mockPdfPages.map((page, pageIndex) => (
                        <div
                            key={pageIndex}
                            className="pdf-page"
                            style={{
                                marginBottom: '40px',
                                paddingBottom: '20px',
                                borderBottom: pageIndex < mockPdfPages.length - 1 ? '2px dashed #e5e7eb' : 'none'
                            }}
                        >
                            <div style={{
                                fontSize: '12px',
                                color: '#9ca3af',
                                marginBottom: '10px',
                                textAlign: 'center'
                            }}>
                                Page {page.pageNumber}
                            </div>

                            {page.lines.map((line, lineIndex) => (
                                <div key={lineIndex} style={{ marginBottom: '4px' }}>
                                    {line.spans.map((span, spanIndex) => (
                                        <span
                                            key={spanIndex}
                                            style={{
                                                fontSize: span.fontSize || '14px',
                                                fontWeight: span.fontWeight || 'normal',
                                                fontStyle: span.fontStyle || 'normal',
                                                color: span.color || '#1f2937'
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

                    {/* Selection Overlay */}
                    <PdfLineSelectionOverlay
                        selectionLines={selectionLines}
                        selectedText={selectedText}
                        onAddToChat={handleAddToChat}
                        onClearSelection={clearSelection}
                    />
                </div>

                {/* Debug Info */}
                {selectionLines.length > 0 && (
                    <div style={{
                        marginTop: '20px',
                        backgroundColor: '#fef3c7',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #fbbf24'
                    }}>
                        <h4 style={{ marginTop: 0, color: '#92400e' }}>Debug Info:</h4>
                        <p style={{ margin: '5px 0', color: '#78350f' }}>
                            <strong>Lines selected:</strong> {selectionLines.length}
                        </p>
                        <p style={{ margin: '5px 0', color: '#78350f' }}>
                            <strong>Text length:</strong> {selectedText.length} characters
                        </p>
                        <details style={{ marginTop: '10px' }}>
                            <summary style={{ cursor: 'pointer', color: '#92400e', fontWeight: 'bold' }}>
                                Selected Text
                            </summary>
                            <pre style={{
                                backgroundColor: 'white',
                                padding: '10px',
                                borderRadius: '4px',
                                marginTop: '10px',
                                overflow: 'auto',
                                fontSize: '12px',
                                color: '#1f2937'
                            }}>
                                {selectedText}
                            </pre>
                        </details>
                        <details style={{ marginTop: '10px' }}>
                            <summary style={{ cursor: 'pointer', color: '#92400e', fontWeight: 'bold' }}>
                                Line Boxes
                            </summary>
                            <pre style={{
                                backgroundColor: 'white',
                                padding: '10px',
                                borderRadius: '4px',
                                marginTop: '10px',
                                overflow: 'auto',
                                fontSize: '11px',
                                color: '#1f2937'
                            }}>
                                {JSON.stringify(selectionLines.map(line => ({
                                    left: Math.round(line.left),
                                    top: Math.round(line.top),
                                    width: Math.round(line.width),
                                    height: Math.round(line.height)
                                })), null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
