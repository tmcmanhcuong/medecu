import { useState, useEffect, useRef } from 'react';

/**
 * PDF text selection hook - handles text selection in PDF viewer with multi-line support
 * Returns array of line boxes instead of single box
 * @param {React.RefObject} containerRef - Reference to PDF container
 */
export function usePdfTextSelection(containerRef) {
    const [selectionLines, setSelectionLines] = useState([]);
    const [selectedText, setSelectedText] = useState('');
    const selectionTimeoutRef = useRef(null);
    const mouseDownTargetRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const container = containerRef.current;

        const handleMouseDown = (e) => {
            // Store the mousedown target to filter text nodes later
            mouseDownTargetRef.current = e.target;
        };

        const handleSelectionChange = () => {
            // Clear previous timeout
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }

            // Reduced debounce for faster response
            selectionTimeoutRef.current = setTimeout(() => {
                // Use requestAnimationFrame for smooth updates
                requestAnimationFrame(() => {
                    const selection = window.getSelection();

                    // Check if there's a valid selection
                    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
                        setSelectionLines([]);
                        setSelectedText('');
                        return;
                    }

                    const range = selection.getRangeAt(0);

                    // Check if selection is within our container
                    if (!container.contains(range.commonAncestorContainer)) {
                        setSelectionLines([]);
                        setSelectedText('');
                        return;
                    }

                    // Get selected text
                    const text = selection.toString();
                    setSelectedText(text);

                    // ADVANCED FILTERING: Only include text nodes within mousedown target's container
                    let filteredRects = [];

                    if (mouseDownTargetRef.current) {
                        // Find a larger parent container (not just immediate block)
                        // This allows selecting across multiple lines/paragraphs
                        const mouseDownBlock = mouseDownTargetRef.current.closest('[data-page-number], .react-pdf__Page, div[style*="position"]')
                            || mouseDownTargetRef.current.closest('div')
                            || mouseDownTargetRef.current;

                        // Get all text nodes in the selection
                        const treeWalker = document.createTreeWalker(
                            range.commonAncestorContainer,
                            NodeFilter.SHOW_TEXT,
                            {
                                acceptNode: (node) => {
                                    // Accept text nodes that are within the selection range
                                    if (range.intersectsNode(node)) {
                                        // More relaxed check - just ensure it's in the same page/container
                                        if (mouseDownBlock.contains(node)) {
                                            return NodeFilter.FILTER_ACCEPT;
                                        }
                                    }
                                    return NodeFilter.FILTER_REJECT;
                                }
                            }
                        );

                        // Collect rects from filtered text nodes
                        let node;
                        while (node = treeWalker.nextNode()) {
                            const nodeRange = document.createRange();
                            nodeRange.selectNodeContents(node);

                            // Get intersection of selection range and node range
                            const intersectionRange = document.createRange();
                            const startContainer = range.startContainer === node ? range.startContainer : node;
                            const endContainer = range.endContainer === node ? range.endContainer : node;
                            const startOffset = range.startContainer === node ? range.startOffset : 0;
                            const endOffset = range.endContainer === node ? range.endOffset : node.textContent?.length || 0;

                            try {
                                intersectionRange.setStart(startContainer, startOffset);
                                intersectionRange.setEnd(endContainer, endOffset);
                                const rects = intersectionRange.getClientRects();
                                filteredRects.push(...Array.from(rects));
                            } catch (e) {
                                // Ignore range errors
                            }
                        }
                    }

                    // If no filtered rects, fall back to original behavior
                    if (filteredRects.length === 0) {
                        filteredRects = Array.from(range.getClientRects());
                    }

                    if (filteredRects.length === 0) {
                        setSelectionLines([]);
                        setSelectedText('');
                        return;
                    }

                    // GROUP RECTS INTO LINES based on Y position
                    const LINE_TOLERANCE = 5; // pixels - rects within this Y distance are on same line
                    const lines = [];

                    // Sort rects by Y position first
                    const sortedRects = [...filteredRects].sort((a, b) => a.top - b.top);

                    sortedRects.forEach(rect => {
                        // Skip zero-size rects
                        if (rect.width === 0 || rect.height === 0) return;

                        // Check if this rect belongs to an existing line
                        let foundLine = false;
                        const rectCenterY = rect.top + (rect.height / 2);

                        for (let line of lines) {
                            const lineCenterY = line.top + (line.height / 2);

                            if (Math.abs(lineCenterY - rectCenterY) <= LINE_TOLERANCE) {
                                // Add to existing line - update bounds
                                line.left = Math.min(line.left, rect.left);
                                line.right = Math.max(line.right, rect.right);
                                line.top = Math.min(line.top, rect.top);
                                line.bottom = Math.max(line.bottom, rect.bottom);
                                line.width = line.right - line.left;
                                line.height = line.bottom - line.top;
                                foundLine = true;
                                break;
                            }
                        }

                        // Create new line if not found
                        if (!foundLine) {
                            lines.push({
                                left: rect.left,
                                right: rect.right,
                                top: rect.top,
                                bottom: rect.bottom,
                                width: rect.width,
                                height: rect.height
                            });
                        }
                    });

                    console.log('📏 Grouped into', lines.length, 'lines');

                    // Convert to container-relative coordinates
                    const containerRect = container.getBoundingClientRect();
                    const computedStyle = window.getComputedStyle(container);
                    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
                    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
                    const scrollTop = container.scrollTop;
                    const scrollLeft = container.scrollLeft;

                    const PADDING_X = 4;
                    const PADDING_Y = 2;

                    const relativeLines = lines.map(line => ({
                        left: line.left - containerRect.left - paddingLeft + scrollLeft - PADDING_X,
                        top: line.top - containerRect.top - paddingTop + scrollTop - PADDING_Y,
                        width: line.width + (PADDING_X * 2),
                        height: line.height + (PADDING_Y * 2)
                    }));

                    setSelectionLines(relativeLines);
                });
            }, 10); // Reduced from 50ms to 10ms for faster response
        };

        const handleMouseUp = () => {
            // Process selection after mouseup
            setTimeout(() => {
                handleSelectionChange();
            }, 10);
        };

        const handleClickOutside = (e) => {
            // Don't clear if clicking on selection action buttons (Move, Add to Note, etc.)
            const isActionButton = e.target.closest('.selection-action-btn');
            if (isActionButton) {
                console.log('📌 Click on action button - keeping PDF selection');
                return;
            }

            // Clear selection when clicking outside PDF container
            if (!container.contains(e.target)) {
                setSelectionLines([]);
                setSelectedText('');
                mouseDownTargetRef.current = null;
                // Clear browser selection
                const selection = window.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                }
            }
        };

        // Listen to selection changes
        container.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }
            container.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); // Re-run when container changes

    return {
        selectionLines,  // Array of line boxes: [{ left, top, width, height }]
        selectedText,    // Combined text from all lines
        pageNumber: (() => {
            // Try to find the page number from the selection
            if (!containerRef.current) return 0;

            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return 0;

            const range = selection.getRangeAt(0);

            // Find the parent page element
            const pageElement = range.commonAncestorContainer.parentElement?.closest('[data-page-number]');
            if (pageElement) {
                const pageNum = parseInt(pageElement.getAttribute('data-page-number'), 10);
                return isNaN(pageNum) ? 0 : pageNum - 1; // Convert to 0-indexed
            }

            return 0;
        })(),
        clearSelection: () => {
            setSelectionLines([]);
            setSelectedText('');
            window.getSelection()?.removeAllRanges();
        }
    };
}
