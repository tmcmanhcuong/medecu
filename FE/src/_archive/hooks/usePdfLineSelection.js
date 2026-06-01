import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Custom hook for PDF text selection with multi-line support
 * Handles <span> + <br> structure and renders selection per line
 */
export function usePdfLineSelection(containerRef) {
    const [selectionLines, setSelectionLines] = useState([]);
    const [selectedText, setSelectedText] = useState('');

    const isDraggingRef = useRef(false);
    const startPosRef = useRef(null);
    const currentPosRef = useRef(null);
    const selectionTimeoutRef = useRef(null);

    /**
     * Group text nodes into logical lines based on Y position
     * @param {Array} textNodes - Array of text nodes with their rects
     * @returns {Array} Array of line objects with nodes and bounding rect
     */
    const groupNodesIntoLines = useCallback((textNodes) => {
        if (!textNodes || textNodes.length === 0) return [];

        // Sort nodes by Y position first
        const sortedNodes = [...textNodes].sort((a, b) => a.rect.top - b.rect.top);

        const lines = [];
        const LINE_TOLERANCE = 5; // pixels - nodes within this Y distance are on same line

        sortedNodes.forEach(nodeData => {
            const { node, rect } = nodeData;

            // Check if this node belongs to an existing line
            let foundLine = false;
            for (let line of lines) {
                const lineY = line.top + (line.height / 2); // Center Y of line
                const nodeY = rect.top + (rect.height / 2); // Center Y of node

                if (Math.abs(lineY - nodeY) <= LINE_TOLERANCE) {
                    // Add to existing line
                    line.nodes.push(nodeData);

                    // Update line bounds
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
                    nodes: [nodeData],
                    left: rect.left,
                    right: rect.right,
                    top: rect.top,
                    bottom: rect.bottom,
                    width: rect.right - rect.left,
                    height: rect.bottom - rect.top
                });
            }
        });

        console.log('📏 Grouped into lines:', lines.length, lines);
        return lines;
    }, []);

    /**
     * Get all text nodes within a selection range
     * Handles partial selections and <br> boundaries
     */
    const getSelectedTextNodes = useCallback((range, container) => {
        if (!range || !container) return [];

        const textNodes = [];
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null
        );

        let node;
        while (node = walker.nextNode()) {
            // Skip empty text nodes
            if (!node.textContent.trim()) continue;

            // Check if this text node intersects with selection
            const nodeRange = document.createRange();
            nodeRange.selectNodeContents(node);

            const intersects = (
                range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
                range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0
            );

            if (intersects) {
                // Get the actual selected portion of this node
                const isStartNode = node === range.startContainer;
                const isEndNode = node === range.endContainer;

                let selectionRange = document.createRange();

                if (isStartNode && isEndNode) {
                    // Selection within single node
                    selectionRange.setStart(node, range.startOffset);
                    selectionRange.setEnd(node, range.endOffset);
                } else if (isStartNode) {
                    // Start node
                    selectionRange.setStart(node, range.startOffset);
                    selectionRange.setEnd(node, node.textContent.length);
                } else if (isEndNode) {
                    // End node
                    selectionRange.setStart(node, 0);
                    selectionRange.setEnd(node, range.endOffset);
                } else {
                    // Middle node - select all
                    selectionRange.selectNodeContents(node);
                }

                // Get all rects for this node (handles wrapped text)
                const rects = selectionRange.getClientRects();

                // Add each rect as a separate entry (for wrapped spans)
                Array.from(rects).forEach(rect => {
                    if (rect.width > 0 && rect.height > 0) {
                        textNodes.push({
                            node,
                            rect,
                            text: selectionRange.toString()
                        });
                    }
                });
            }
        }

        console.log('📝 Found text nodes:', textNodes.length);
        return textNodes;
    }, []);

    /**
     * Calculate selection boxes based on drag rectangle
     * Uses intersection with drag rect to filter nodes
     */
    const calculateDragSelection = useCallback((start, current, container) => {
        if (!start || !current || !container) return;

        const dragRect = {
            left: Math.min(start.x, current.x),
            top: Math.min(start.y, current.y),
            right: Math.max(start.x, current.x),
            bottom: Math.max(start.y, current.y)
        };

        console.log('📐 Drag rectangle:', dragRect);

        // Get all spans in container
        const spans = container.querySelectorAll('span');
        const intersectingNodes = [];

        spans.forEach(span => {
            const rect = span.getBoundingClientRect();

            // Check if span intersects with drag rectangle
            const intersects = !(
                rect.right < dragRect.left ||
                rect.left > dragRect.right ||
                rect.bottom < dragRect.top ||
                rect.top > dragRect.bottom
            );

            if (intersects && span.textContent.trim()) {
                // Get text node inside span
                const textNode = Array.from(span.childNodes).find(
                    child => child.nodeType === Node.TEXT_NODE
                );

                if (textNode) {
                    intersectingNodes.push({
                        node: textNode,
                        rect,
                        text: textNode.textContent
                    });
                }
            }
        });

        console.log('📝 Intersecting nodes:', intersectingNodes.length);

        // Group into lines
        const lines = groupNodesIntoLines(intersectingNodes);

        // Convert to container-relative coordinates
        const containerRect = container.getBoundingClientRect();
        const relativeLines = lines.map(line => ({
            left: line.left - containerRect.left,
            top: line.top - containerRect.top,
            width: line.width,
            height: line.height,
            nodes: line.nodes
        }));

        setSelectionLines(relativeLines);

        // Extract selected text
        const text = lines
            .map(line => line.nodes.map(n => n.text).join(''))
            .join('\n');
        setSelectedText(text);

    }, [groupNodesIntoLines]);

    /**
     * Process browser native selection
     */
    const processNativeSelection = useCallback(() => {
        const selection = window.getSelection();
        const container = containerRef.current;

        if (!selection || !container || selection.rangeCount === 0 || selection.isCollapsed) {
            setSelectionLines([]);
            setSelectedText('');
            return;
        }

        const range = selection.getRangeAt(0);

        // Check if selection is within container
        if (!container.contains(range.commonAncestorContainer)) {
            setSelectionLines([]);
            setSelectedText('');
            return;
        }

        console.log('🔍 Processing native selection');

        // Get selected text nodes
        const textNodes = getSelectedTextNodes(range, container);

        if (textNodes.length === 0) {
            setSelectionLines([]);
            setSelectedText('');
            return;
        }

        // Group into lines
        const lines = groupNodesIntoLines(textNodes);

        // Convert to container-relative coordinates
        const containerRect = container.getBoundingClientRect();
        const relativeLines = lines.map(line => ({
            left: line.left - containerRect.left,
            top: line.top - containerRect.top,
            width: line.width,
            height: line.height,
            nodes: line.nodes
        }));

        setSelectionLines(relativeLines);

        // Extract selected text
        const text = selection.toString();
        setSelectedText(text);

        console.log('✅ Selection processed:', relativeLines.length, 'lines');

    }, [containerRef, getSelectedTextNodes, groupNodesIntoLines]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        console.log('🔍 usePdfLineSelection - Container:', container.className);

        // Find scrollable parent
        let scrollableParent = container.parentElement;
        while (scrollableParent && scrollableParent !== document.body) {
            const style = window.getComputedStyle(scrollableParent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                break;
            }
            scrollableParent = scrollableParent.parentElement;
        }

        const handleMouseDown = (e) => {
            // Ignore clicks on buttons, overlays
            if (e.target.closest('button, .selection-overlay, [data-bubble]')) {
                return;
            }

            // Click outside container - clear
            if (!container.contains(e.target)) {
                setSelectionLines([]);
                setSelectedText('');
                return;
            }

            // Start drag selection
            isDraggingRef.current = true;
            startPosRef.current = { x: e.clientX, y: e.clientY };
            currentPosRef.current = { x: e.clientX, y: e.clientY };

            console.log('🖱️ Drag selection started');
        };

        let rafId = null;
        const handleMouseMove = (e) => {
            if (!isDraggingRef.current) return;

            currentPosRef.current = { x: e.clientX, y: e.clientY };

            // Throttle with RAF
            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                rafId = null;
                calculateDragSelection(
                    startPosRef.current,
                    currentPosRef.current,
                    container
                );
            });
        };

        const handleMouseUp = (e) => {
            if (isDraggingRef.current) {
                console.log('🖱️ Drag selection ended');
                isDraggingRef.current = false;

                // Process final selection
                setTimeout(() => {
                    processNativeSelection();
                }, 50);
            }
        };

        const handleSelectionChange = () => {
            if (isDraggingRef.current) return; // Skip during drag

            // Debounce
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }

            selectionTimeoutRef.current = setTimeout(() => {
                processNativeSelection();
            }, 10);
        };

        const handleScroll = () => {
            // Recalculate positions on scroll
            if (selectionLines.length > 0) {
                processNativeSelection();
            }
        };

        // Event listeners
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('selectionchange', handleSelectionChange);

        if (scrollableParent) {
            scrollableParent.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }
            if (rafId) {
                cancelAnimationFrame(rafId);
            }

            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('selectionchange', handleSelectionChange);

            if (scrollableParent) {
                scrollableParent.removeEventListener('scroll', handleScroll);
            }
        };
    }, [containerRef, calculateDragSelection, processNativeSelection, selectionLines.length]);

    return {
        selectionLines,      // Array of line boxes: [{ left, top, width, height, nodes }]
        selectedText,        // Combined text from all lines
        clearSelection: () => {
            setSelectionLines([]);
            setSelectedText('');
            window.getSelection()?.removeAllRanges();
        }
    };
}
