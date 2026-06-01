import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GripVertical, FileText, ExternalLink } from 'lucide-react';

/**
 * NoteBlock - Single draggable block in a note
 * Contains content + optional citation
 */
export default function NoteBlock({
    block,
    index,
    isDragging,
    isDropTarget,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onCitationClick
}) {
    const handleCitationClick = (e) => {
        e.preventDefault();
        if (block.citation && onCitationClick) {
            onCitationClick(block.citation.position);
        }
    };

    return (
        <div
            data-block-id={block.id}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            className={`note-block group relative ${isDragging ? 'opacity-30' : ''} ${isDropTarget ? 'ring-2 ring-blue-400' : ''}`}
            style={{
                marginBottom: '12px',
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: block.citation ? '#fef3c7' : 'white',
                transition: 'all 0.2s ease',
                cursor: 'move'
            }}
        >
            {/* Drag Handle */}
            <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            {/* Block Content */}
            <div className="pl-6">
                <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {block.content}
                    </ReactMarkdown>
                </div>

                {/* Citation (if exists) */}
                {block.citation && (
                    <div
                        onClick={handleCitationClick}
                        className="mt-3 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 transition-colors"
                        title="Click to view in PDF"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-gray-200 dark:border-slate-700">
                            {block.citation.position}
                        </span>
                        <span className="text-gray-400">
                            • Page {block.citation.page + 1}
                        </span>
                        <ExternalLink className="w-3 h-3 ml-auto" />
                    </div>
                )}
            </div>

            {/* Block Type Indicator */}
            {block.type === 'quote' && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400 rounded-l-lg"
                    title="Quote from PDF"
                />
            )}
        </div>
    );
}
