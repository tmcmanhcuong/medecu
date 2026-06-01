import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function NoteRenderer({ content, onBubbleClick }) {
    // Find all references in order of appearance
    // Matches both formats:
    // - New: ![bookTitle-/page/0/Text/1]
    // - Old: ![/page/0/Text/1]
    const references = content.match(/!\[([^-\]]*-)?\/page\/\d+\/[^\]]+\]/g) || [];

    // Create a mapping: reference -> number (first appearance gets the number)
    const refMap = {};
    let counter = 1;

    references.forEach((ref) => {
        if (!refMap[ref]) {
            refMap[ref] = counter++;
        }
    });

    // Replace references with special markers, preserving order
    let processedContent = content;
    Object.keys(refMap).forEach((ref) => {
        const number = refMap[ref];
        // Replace all occurrences of this reference with the same number
        const regex = new RegExp(ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        processedContent = processedContent.replace(regex, `{{BUBBLE:${number}:${ref}}}`);
    });

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-6" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-5" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4" {...props} />,
                p: ({ node, children, ...props }) => {
                    // Process text nodes to replace bubble markers
                    const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                            const parts = child.split(/\{\{BUBBLE:(\d+):([^}]+)\}\}/);
                            if (parts.length > 1) {
                                const elements = [];
                                for (let i = 0; i < parts.length; i++) {
                                    if (i % 3 === 0 && parts[i]) {
                                        // Regular text
                                        elements.push(parts[i]);
                                    } else if (i % 3 === 1) {
                                        // Bubble number
                                        const bubbleNum = parts[i];
                                        const refText = parts[i + 1];
                                        elements.push(
                                            <span
                                                key={`bubble-${i}`}
                                                data-bubble="true"
                                                className="inline-flex items-center justify-center font-bold text-white mx-1 cursor-pointer hover:scale-110 transition-transform pointer-events-auto"
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#60a5fa',
                                                    fontSize: '11px',
                                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                                                    verticalAlign: 'baseline',
                                                    position: 'relative',
                                                    top: '-2px',
                                                    zIndex: 10,
                                                }}
                                                title={refText}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    console.log('Bubble clicked!', { refText, bubbleNum });
                                                    if (onBubbleClick) {
                                                        console.log('Calling onBubbleClick...');
                                                        onBubbleClick(refText, bubbleNum);
                                                    } else {
                                                        console.warn('onBubbleClick is not defined');
                                                    }
                                                }}
                                            >
                                                {bubbleNum}
                                            </span>
                                        );
                                    }
                                }
                                return elements;
                            }
                        }
                        return child;
                    });
                    return <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed" {...props}>{processedChildren}</p>;
                },
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-3 text-gray-600 dark:text-gray-400" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-3 text-gray-600 dark:text-gray-400" {...props} />,
                li: ({ node, children, ...props }) => {
                    // Also process li children for bubbles
                    const processedChildren = React.Children.map(children, (child) => {
                        if (typeof child === 'string') {
                            const parts = child.split(/\{\{BUBBLE:(\d+):([^}]+)\}\}/);
                            if (parts.length > 1) {
                                const elements = [];
                                for (let i = 0; i < parts.length; i++) {
                                    if (i % 3 === 0 && parts[i]) {
                                        elements.push(parts[i]);
                                    } else if (i % 3 === 1) {
                                        const bubbleNum = parts[i];
                                        const refText = parts[i + 1];
                                        elements.push(
                                            <span
                                                key={`bubble-li-${i}`}
                                                data-bubble="true"
                                                className="inline-flex items-center justify-center font-bold text-white mx-1 cursor-pointer hover:scale-110 transition-transform pointer-events-auto"
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#60a5fa',
                                                    fontSize: '11px',
                                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                                                    verticalAlign: 'baseline',
                                                    position: 'relative',
                                                    top: '-2px',
                                                    zIndex: 10,
                                                }}
                                                title={refText}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    console.log('Bubble clicked (li)!', { refText, bubbleNum });
                                                    if (onBubbleClick) {
                                                        console.log('Calling onBubbleClick...');
                                                        onBubbleClick(refText, bubbleNum);
                                                    } else {
                                                        console.warn('onBubbleClick is not defined');
                                                    }
                                                }}
                                            >
                                                {bubbleNum}
                                            </span>
                                        );
                                    }
                                }
                                return elements;
                            }
                        }
                        return child;
                    });
                    return <li className="mb-1" {...props}>{processedChildren}</li>;
                },
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...props} />,
                code: ({ node, inline, ...props }) =>
                    inline
                        ? <code className="bg-gray-100 dark:bg-slate-800 text-pink-600 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                        : <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono" {...props} />,
                a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                table: ({ node, ...props }) => <table className="border-collapse w-full my-4" {...props} />,
                th: ({ node, ...props }) => <th className="border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 p-2 font-semibold text-left" {...props} />,
                td: ({ node, ...props }) => <td className="border border-gray-300 dark:border-slate-600 p-2" {...props} />,
                hr: ({ node, ...props }) => <hr className="my-6 border-gray-300 dark:border-slate-600" {...props} />,
            }}
        >
            {processedContent}
        </ReactMarkdown>
    );
}
