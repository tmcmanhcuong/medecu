import { useState } from 'react';
import { Move, MessageSquare, FileText } from 'lucide-react';

/**
 * SelectionOverlay component - Shows a bounding box around selected text with drag handle
 */
export default function SelectionOverlay({
    box,
    onDragStart,
    onAddToChat,
    buttonLabel = "Add to Chat",
    buttonIcon = "chat"
}) {
    const [isHovered, setIsHovered] = useState(false);

    if (!box) return null;

    // Debug: log when overlay renders
    console.log('🎨 SelectionOverlay rendering:', { left: box.left, top: box.top, _timestamp: box._timestamp });

    // Choose icon based on prop
    const ButtonIcon = buttonIcon === "note" ? FileText : MessageSquare;

    const handleDragStart = (e) => {
        // Get selected text and preserve line breaks
        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) {
            console.warn('❌ No selection found');
            return;
        }

        // Get the actual selected range
        const range = selection.getRangeAt(0);

        // Clone the contents to get the actual DOM structure
        const clonedContent = range.cloneContents();

        // Create a temporary div to extract text properly
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(clonedContent);

        // Remove elements that should be excluded (e.g., timestamps)
        const excludedElements = tempDiv.querySelectorAll('[data-exclude-from-selection]');
        excludedElements.forEach(el => el.remove());

        // Get text content which preserves line breaks from block elements
        const rawText = tempDiv.textContent || tempDiv.innerText || '';

        // Clean text: trim each line but preserve line breaks
        const selectedText = rawText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0) // Remove empty lines
            .join('\n');

        if (!selectedText) {
            console.warn('❌ No text to drag after cleaning');
            return;
        }

        // Store in dataTransfer
        e.dataTransfer.effectAllowed = 'copy'; // Changed from 'move' to 'copy' to match dropEffect
        e.dataTransfer.setData('text/plain', selectedText);

        if (onDragStart) {
            onDragStart(selectedText);
        }
    };

    const handleAddToChat = () => {
        console.log('🎯 handleAddToChat CLICKED!');

        const selection = window.getSelection();

        if (!selection || selection.rangeCount === 0) return;

        // Get the actual selected range
        const range = selection.getRangeAt(0);

        // Clone the contents to get the actual DOM structure
        const clonedContent = range.cloneContents();

        // Create a temporary div to extract text properly
        const tempDiv = document.createElement('div');
        tempDiv.appendChild(clonedContent);

        // Remove elements that should be excluded (e.g., timestamps)
        const excludedElements = tempDiv.querySelectorAll('[data-exclude-from-selection]');
        excludedElements.forEach(el => el.remove());

        // Get text content which preserves line breaks from block elements
        const rawText = tempDiv.textContent || tempDiv.innerText || '';

        console.log('🔍 Add to Chat - Raw selected text:', rawText);
        console.log('🔍 Add to Chat - Selection:', selection.toString());

        // Clean text: trim each line but preserve line breaks
        const selectedText = rawText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0) // Remove empty lines
            .join('\n');

        console.log('✅ Add to Chat - Cleaned text:', selectedText);

        if (selectedText && onAddToChat) {
            console.log('🚀 Calling onAddToChat with text length:', selectedText.length);
            onAddToChat(selectedText);

            // Clear selection after adding
            window.getSelection()?.removeAllRanges();
            console.log('🧹 Selection cleared');
        }
    };

    return (
        <div
            className="selection-overlay"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                position: 'absolute',
                left: `${box.left}px`,
                top: `${box.top}px`,
                width: `${box.width}px`,
                height: `${box.height}px`,
                pointerEvents: 'none',
                zIndex: 10,
                border: '3px solid #3b82f6',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                boxShadow: `
          0 0 0 1px rgba(59, 130, 246, 0.3),
          0 0 20px rgba(59, 130, 246, 0.2),
          inset 0 0 20px rgba(59, 130, 246, 0.05)
        `,
                transition: 'all 0.1s ease-out',
            }}
        >
            {/* Action Buttons Container */}
            <div
                style={{
                    position: 'absolute',
                    top: '-19px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '8px',
                    pointerEvents: 'auto',
                }}
            >
                {/* Add to Chat/Note Button */}
                <button
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log('🖱️ Button MOUSEDOWN - calling handleAddToChat');
                        handleAddToChat();
                    }}
                    className="add-to-chat-btn"
                    title={buttonLabel}
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
                        opacity: isHovered ? 1 : 0.8,
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        width: '32px',
                        height: '32px',
                        border: 'none',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <ButtonIcon className="w-5 h-5" />
                </button>

                {/* Drag Handle - 4-way arrows icon */}
                <div
                    draggable
                    onDragStart={handleDragStart}
                    className="drag-handle"
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
                        opacity: isHovered ? 1 : 0.8,
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        width: '32px',
                        height: '32px',
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
        </div>
    );
}

