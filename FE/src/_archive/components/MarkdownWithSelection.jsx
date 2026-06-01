import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useManualSelection } from '../hooks/useManualSelection';
import ManualSelectionBox from './ManualSelectionBox';

/**
 * Example component showing how to use manual selection with ReactMarkdown
 */
export default function MarkdownWithSelection({ content, onAddToChat }) {
    const containerRef = useRef(null);

    // Use manual selection hook
    const {
        selectionBox,
        selectedElements,
        getSelectedText,
        clearSelection
    } = useManualSelection(containerRef);

    const handleAddToChat = (text) => {
        console.log('📝 Adding to chat:', text);
        if (onAddToChat) {
            onAddToChat(text);
        }
    };

    return (
        <div
            ref={containerRef}
            className="markdown-container"
            style={{
                position: 'relative',
                padding: '24px',
                maxWidth: '800px',
                margin: '0 auto',
                userSelect: 'none', // Disable native text selection
                cursor: 'crosshair' // Show crosshair cursor for selection
            }}
        >
            {/* Manual Selection Box Overlay */}
            <ManualSelectionBox
                selectionBox={selectionBox}
                selectedElements={selectedElements}
                onAddToChat={handleAddToChat}
                onClearSelection={clearSelection}
            />

            {/* Rendered Markdown Content */}
            <div
                className="prose prose-sm md:prose-base lg:prose-lg max-w-none"
                style={{
                    userSelect: 'none' // Prevent native selection
                }}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ node, ...props }) => (
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-6" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-5" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                            <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-6 mb-3 text-gray-600 dark:text-gray-400" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                            <ol className="list-decimal pl-6 mb-3 text-gray-600 dark:text-gray-400" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                            <li className="mb-1" {...props} />
                        ),
                        blockquote: ({ node, ...props }) => (
                            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...props} />
                        ),
                        code: ({ node, inline, ...props }) =>
                            inline ? (
                                <code className="bg-gray-100 dark:bg-slate-800 text-pink-600 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                            ) : (
                                <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono" {...props} />
                            ),
                        a: ({ node, ...props }) => (
                            <a className="text-blue-600 hover:text-blue-800 underline" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                            <table className="border-collapse w-full my-4" {...props} />
                        ),
                        th: ({ node, ...props }) => (
                            <th className="border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 p-2 font-semibold text-left" {...props} />
                        ),
                        td: ({ node, ...props }) => (
                            <td className="border border-gray-300 dark:border-slate-600 p-2" {...props} />
                        ),
                        hr: ({ node, ...props }) => (
                            <hr className="my-6 border-gray-300 dark:border-slate-600" {...props} />
                        ),
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>

            {/* Debug Info (optional) */}
            {selectedElements.length > 0 && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        backgroundColor: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        maxWidth: '300px',
                        fontSize: '12px',
                        zIndex: 1000
                    }}
                >
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                        Selected: {selectedElements.length} elements
                    </div>
                    <div style={{
                        maxHeight: '100px',
                        overflow: 'auto',
                        fontSize: '11px',
                        color: '#666'
                    }}>
                        {getSelectedText()}
                    </div>
                </div>
            )}
        </div>
    );
}
