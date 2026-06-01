import React from 'react';
import { Move, MessageSquare } from 'lucide-react';

/**
 * Visual selection box overlay for manual selection
 * Shows a blue rectangle and action buttons
 */
export default function ManualSelectionBox({
    selectionBox,
    selectedElements,
    onAddToChat,
    onClearSelection
}) {
    if (!selectionBox || !selectedElements || selectedElements.length === 0) {
        return null;
    }

    console.log('📦 Rendering selection box:', {
        box: selectionBox,
        elementCount: selectedElements.length
    });

    const handleAddToChat = () => {
        // Extract text and clean it - properly exclude bubbles
        const text = selectedElements
            .map(item => {
                // Clone the element to avoid modifying the original DOM
                const clone = item.element.cloneNode(true);

                // Remove all bubble elements (they have data-bubble attribute)
                const bubbles = clone.querySelectorAll('[data-bubble]');
                bubbles.forEach(bubble => bubble.remove());

                // Get clean text without bubbles
                let cleanText = clone.textContent.trim();

                // Remove leading numbers (e.g., "1. ", "2. " from ordered lists)
                cleanText = cleanText.replace(/^\d+\.\s*/, '');

                return cleanText;
            })
            .filter(t => t.trim()) // Remove empty lines
            .join('\n');

        if (text && onAddToChat) {
            onAddToChat(text);
        }

        if (onClearSelection) {
            onClearSelection();
        }
    };




    const handleDragStart = (e) => {
        console.log('🚀 DRAG START EVENT TRIGGERED!');
        console.log('📦 Selected elements count:', selectedElements?.length);

        // Extract and clean text for drag operation - properly exclude bubbles
        const text = selectedElements
            .map(item => {
                // Clone the element to avoid modifying the original DOM
                const clone = item.element.cloneNode(true);

                // Remove all bubble elements
                const bubbles = clone.querySelectorAll('[data-bubble]');
                bubbles.forEach(bubble => bubble.remove());

                // Get clean text without bubbles
                let cleanText = clone.textContent.trim();

                // Remove leading numbers from ordered lists
                cleanText = cleanText.replace(/^\d+\.\s*/, '');

                return cleanText;
            })
            .filter(t => t.trim())
            .join('\n');

        console.log('🎯 Drag start - extracted text:', text);
        console.log('📏 Text length:', text.length);

        if (!text) {
            console.warn('❌ No text to drag!');
            return;
        }

        e.dataTransfer.effectAllowed = 'copy'; // Changed to 'copy' to match dropEffect
        e.dataTransfer.setData('text/plain', text);
        console.log('✅ Data set in dataTransfer');
    };


    return (
        <>
            {/* Selection Box */}
            <div
                className="manual-selection-box"
                style={{
                    position: 'absolute',
                    left: `${selectionBox.left}px`,
                    top: `${selectionBox.top}px`,
                    width: `${selectionBox.width}px`,
                    height: `${selectionBox.height}px`,
                    border: '2px solid #3b82f6',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)',
                    transition: 'all 0.05s ease-out'
                }}
            />

            {/* Action Buttons */}
            <div
                style={{
                    position: 'absolute',
                    left: `${selectionBox.left + selectionBox.width / 2}px`,
                    top: `${selectionBox.top - 20}px`,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '8px',
                    pointerEvents: 'auto',
                    zIndex: 1001
                }}
            >


                {/* Add to Chat Button */}
                <button
                    onClick={handleAddToChat}
                    className="selection-action-btn"
                    title="Add to Chat"
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
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <MessageSquare className="w-5 h-5" />
                </button>

                {/* Drag Handle */}
                <div
                    draggable
                    onDragStart={handleDragStart}
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
                        transition: 'transform 0.2s ease'
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
