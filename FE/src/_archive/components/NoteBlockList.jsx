import React, { useState, useRef } from 'react';
import NoteBlock from './NoteBlock';

/**
 * NoteBlockList - Container for draggable note blocks
 * Handles drag & drop reordering
 */
export default function NoteBlockList({
    blocks,
    onBlocksReorder,
    onCitationClick
}) {
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dropTargetIndex, setDropTargetIndex] = useState(null);
    const containerRef = useRef(null);
    const autoScrollIntervalRef = useRef(null);

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());

        // Add ghost image
        const ghostElement = e.currentTarget.cloneNode(true);
        ghostElement.style.opacity = '0.5';
        ghostElement.style.position = 'absolute';
        ghostElement.style.top = '-1000px';
        document.body.appendChild(ghostElement);
        e.dataTransfer.setDragImage(ghostElement, 0, 0);

        setTimeout(() => {
            document.body.removeChild(ghostElement);
        }, 0);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDropTargetIndex(null);

        // Clear auto-scroll
        if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
        }
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (index !== draggedIndex) {
            setDropTargetIndex(index);
        }

        // Auto-scroll when dragging near edges
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const threshold = 80;
        const scrollSpeed = 10;

        // Clear existing interval
        if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
        }

        // Scroll up
        if (e.clientY < rect.top + threshold) {
            autoScrollIntervalRef.current = setInterval(() => {
                container.scrollTop -= scrollSpeed;
            }, 50);
        }
        // Scroll down
        else if (e.clientY > rect.bottom - threshold) {
            autoScrollIntervalRef.current = setInterval(() => {
                container.scrollTop += scrollSpeed;
            }, 50);
        }
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();

        if (draggedIndex === null || draggedIndex === dropIndex) {
            handleDragEnd();
            return;
        }

        // Calculate actual drop position
        let actualDropIndex = dropIndex;
        if (draggedIndex < dropIndex) {
            actualDropIndex = dropIndex - 1;
        }

        // Reorder blocks
        const newBlocks = [...blocks];
        const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
        newBlocks.splice(actualDropIndex, 0, draggedBlock);

        onBlocksReorder(newBlocks);

        handleDragEnd();
    };

    // Handle drop at the end of list
    const handleDropAtEnd = (e) => {
        e.preventDefault();

        if (draggedIndex === null) return;

        const newBlocks = [...blocks];
        const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
        newBlocks.push(draggedBlock);

        onBlocksReorder(newBlocks);
        handleDragEnd();
    };

    if (!blocks || blocks.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No content yet</p>
                <p className="text-sm mt-2">Select text from PDF and click "Add to Note"</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="note-blocks-container">
            {blocks.map((block, index) => (
                <React.Fragment key={block.id}>
                    {/* Drop Indicator Above */}
                    {dropTargetIndex === index && draggedIndex !== null && draggedIndex !== index && (
                        <div
                            className="drop-indicator animate-pulse"
                            style={{
                                height: '3px',
                                backgroundColor: '#3b82f6',
                                borderRadius: '2px',
                                marginBottom: '8px',
                                boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
                            }}
                        />
                    )}

                    {/* Block */}
                    <NoteBlock
                        block={block}
                        index={index}
                        isDragging={draggedIndex === index}
                        isDropTarget={dropTargetIndex === index}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onCitationClick={onCitationClick}
                    />
                </React.Fragment>
            ))}

            {/* Drop Zone at the End */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setDropTargetIndex(blocks.length);
                }}
                onDrop={handleDropAtEnd}
                className={`drop-zone-end ${dropTargetIndex === blocks.length ? 'active' : ''}`}
                style={{
                    minHeight: '40px',
                    border: dropTargetIndex === blocks.length ? '2px dashed #3b82f6' : '2px dashed transparent',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    marginTop: '8px'
                }}
            >
                {dropTargetIndex === blocks.length && draggedIndex !== null && (
                    <span className="text-blue-500 font-medium">Drop here</span>
                )}
            </div>
        </div>
    );
}
