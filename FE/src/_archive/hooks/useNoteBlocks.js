import { useState, useRef, useCallback } from 'react';

/**
 * Hook to manage note blocks with citation support
 * Handles adding blocks, reordering, and conversion between markdown/blocks
 */
export function useNoteBlocks(initialNote) {
    const [blocks, setBlocks] = useState(() => {
        // Initialize from note.blocks or convert from markdown
        if (initialNote?.blocks) {
            return initialNote.blocks;
        } else if (initialNote?.content) {
            return markdownToBlocks(initialNote.content);
        }
        return [];
    });

    const citationCounterRef = useRef(0);
    const noteContentRef = useRef(null);

    /**
     * Add a new block with content and citation
     */
    const addBlock = useCallback((content, pageNumber = 0, citationType = 'quote') => {
        if (!content || !content.trim()) return;

        // Generate unique block ID
        const blockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Increment citation counter
        citationCounterRef.current += 1;
        const citationId = citationCounterRef.current;

        // Create citation object
        const citation = {
            type: 'pdf',
            page: pageNumber,
            position: `/page/${pageNumber}/Text/${citationId}`,
            timestamp: Date.now()
        };

        // Create new block
        const newBlock = {
            id: blockId,
            type: citationType, // 'quote' or 'text'
            content: content.trim(),
            citation: citation,
            createdAt: Date.now()
        };

        // Append to blocks
        setBlocks(prevBlocks => [...prevBlocks, newBlock]);

        // Auto-scroll to bottom after a short delay
        setTimeout(() => {
            scrollToBottom();
        }, 100);

        // Focus on new block
        setTimeout(() => {
            focusBlock(blockId);
        }, 200);

        return blockId;
    }, []);

    /**
     * Reorder blocks (for drag & drop)
     */
    const reorderBlocks = useCallback((newBlocks) => {
        setBlocks(newBlocks);
    }, []);

    /**
     * Remove a block
     */
    const removeBlock = useCallback((blockId) => {
        setBlocks(prevBlocks => prevBlocks.filter(b => b.id !== blockId));
    }, []);

    /**
     * Update block content
     */
    const updateBlock = useCallback((blockId, updates) => {
        setBlocks(prevBlocks =>
            prevBlocks.map(b =>
                b.id === blockId ? { ...b, ...updates } : b
            )
        );
    }, []);

    /**
     * Auto-scroll to bottom of note
     */
    const scrollToBottom = useCallback(() => {
        const container = noteContentRef.current;
        if (container) {
            // Find the scrollable parent
            let scrollableParent = container;
            while (scrollableParent && scrollableParent !== document.body) {
                const style = window.getComputedStyle(scrollableParent);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    break;
                }
                scrollableParent = scrollableParent.parentElement;
            }

            if (scrollableParent) {
                scrollableParent.scrollTo({
                    top: scrollableParent.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, []);

    /**
     * Focus on a specific block (with highlight animation)
     */
    const focusBlock = useCallback((blockId) => {
        const blockElement = document.querySelector(`[data-block-id="${blockId}"]`);
        if (blockElement) {
            blockElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Add highlight animation
            blockElement.style.transition = 'box-shadow 0.3s ease';
            blockElement.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';

            setTimeout(() => {
                blockElement.style.boxShadow = '';
            }, 2000);
        }
    }, []);

    /**
     * Convert blocks to markdown (for saving)
     */
    const toMarkdown = useCallback(() => {
        return blocks.map(block => {
            let md = block.content;
            if (block.citation) {
                md += `\n![${block.citation.position}]`;
            }
            return md;
        }).join('\n\n');
    }, [blocks]);

    /**
     * Get blocks data (for saving to database)
     */
    const getBlocksData = useCallback(() => {
        return blocks;
    }, [blocks]);

    return {
        blocks,
        addBlock,
        reorderBlocks,
        removeBlock,
        updateBlock,
        scrollToBottom,
        focusBlock,
        toMarkdown,
        getBlocksData,
        noteContentRef
    };
}

/**
 * Convert markdown string to blocks array
 * Handles existing citations in markdown
 */
function markdownToBlocks(markdown) {
    if (!markdown || !markdown.trim()) return [];

    // Split by citation markers: ![/page/0/Text/1]
    const citationRegex = /!\[(\/page\/(\d+)\/\w+\/(\d+))\]/g;

    const blocks = [];
    let lastIndex = 0;
    let match;
    let blockCounter = 0;

    while ((match = citationRegex.exec(markdown)) !== null) {
        const citationPosition = match[1];
        const pageNumber = parseInt(match[2]);
        const citationId = parseInt(match[3]);

        // Content before this citation
        const content = markdown.substring(lastIndex, match.index).trim();

        if (content) {
            blocks.push({
                id: `block-migrated-${Date.now()}-${blockCounter++}`,
                type: 'quote',
                content: content,
                citation: {
                    type: 'pdf',
                    page: pageNumber,
                    position: citationPosition,
                    timestamp: Date.now()
                },
                createdAt: Date.now()
            });
        }

        lastIndex = match.index + match[0].length;
    }

    // Remaining content after last citation
    const remainingContent = markdown.substring(lastIndex).trim();
    if (remainingContent) {
        blocks.push({
            id: `block-migrated-${Date.now()}-${blockCounter++}`,
            type: 'text',
            content: remainingContent,
            citation: null,
            createdAt: Date.now()
        });
    }

    // If no citations found, treat entire content as single block
    if (blocks.length === 0 && markdown.trim()) {
        blocks.push({
            id: `block-migrated-${Date.now()}-0`,
            type: 'text',
            content: markdown.trim(),
            citation: null,
            createdAt: Date.now()
        });
    }

    return blocks;
}
