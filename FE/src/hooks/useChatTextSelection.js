import { useEffect, useState, useRef } from 'react';

/**
 * Simple text selection hook for chat messages
 * Detects when user selects text and shows a selection box
 * @param {React.RefObject} containerRef - Reference to chat messages container
 * @param {boolean} isChatOpen - Whether chat window is open
 */
export function useChatTextSelection(containerRef, isChatOpen) {
    const [selectionBox, setSelectionBox] = useState(null);
    const selectionTimeoutRef = useRef(null);

    useEffect(() => {
        console.log('💬 useChatTextSelection - useEffect called');
        console.log('💬 isChatOpen:', isChatOpen);
        console.log('💬 containerRef.current:', containerRef.current);

        // Only initialize if chat is open
        if (!isChatOpen) {
            console.log('❌ Chat is closed, skipping initialization');
            return;
        }

        if (!containerRef.current) {
            console.log('❌ No container ref, returning early');
            return;
        }

        const container = containerRef.current;
        console.log('✅ Chat container found:', container.className);

        const handleSelectionChange = () => {
            console.log('💬 handleSelectionChange called');

            // Clear previous timeout
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }

            // Debounce to avoid rapid updates
            selectionTimeoutRef.current = setTimeout(() => {
                const selection = window.getSelection();

                // Check if there's a valid selection
                if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
                    setSelectionBox(null);
                    return;
                }

                const range = selection.getRangeAt(0);

                // Check if selection is within our container
                if (!container.contains(range.commonAncestorContainer)) {
                    setSelectionBox(null);
                    return;
                }

                // Get the bounding rect of the selection
                const rects = range.getClientRects();
                if (rects.length === 0) {
                    setSelectionBox(null);
                    return;
                }

                // Calculate bounding box from all rects
                const minLeft = Math.min(...Array.from(rects).map(r => r.left));
                const minTop = Math.min(...Array.from(rects).map(r => r.top));
                const maxRight = Math.max(...Array.from(rects).map(r => r.right));
                const maxBottom = Math.max(...Array.from(rects).map(r => r.bottom));

                const containerRect = container.getBoundingClientRect();

                // Get scroll offset
                const scrollTop = container.scrollTop;
                const scrollLeft = container.scrollLeft;

                // Get container padding (p-4 = 16px in Tailwind)
                const computedStyle = window.getComputedStyle(container);
                const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
                const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

                // Add padding - minimal padding for chat bubbles
                const PADDING_X = 0; // No horizontal padding to fit text exactly
                const PADDING_Y = 2; // Minimal vertical padding

                // TEMPORARY: Add offset to fix position
                // TODO: Find root cause of offset issue
                const TEMP_OFFSET_Y = 0; // Vertical offset
                const TEMP_OFFSET_X = -32; // Horizontal offset - increased to align with text

                console.log('🔧 OFFSET VALUES:', { TEMP_OFFSET_X, TEMP_OFFSET_Y, scrollTop, scrollLeft });

                const box = {
                    // Position calculation:
                    // 1. minLeft/minTop are viewport coordinates
                    // 2. containerRect.left/top are also viewport coordinates
                    // 3. We need position relative to container's content (not viewport)
                    // 4. ADD scrollTop/scrollLeft to account for scrolled content
                    left: minLeft - containerRect.left + scrollLeft + paddingLeft - PADDING_X + TEMP_OFFSET_X,
                    top: minTop - containerRect.top + scrollTop - paddingTop - PADDING_Y + TEMP_OFFSET_Y,
                    // Add extra padding to width to prevent right side cutoff
                    width: maxRight - minLeft + (PADDING_X * 2) + 32, // Add 32px to compensate for offset
                    height: maxBottom - minTop + (PADDING_Y * 2),
                };

                console.log('💬 Chat selection box DEBUG:', {
                    'Final box': box,
                    'minTop (viewport)': minTop,
                    'minLeft (viewport)': minLeft,
                    'containerRect.top': containerRect.top,
                    'containerRect.left': containerRect.left,
                    'paddingTop': paddingTop,
                    'paddingLeft': paddingLeft,
                    'scrollTop': scrollTop,
                    'scrollLeft': scrollLeft,
                    'Calculation': {
                        'minTop - containerRect.top': minTop - containerRect.top,
                        'minus paddingTop': minTop - containerRect.top - paddingTop,
                        'minus PADDING_Y': minTop - containerRect.top - paddingTop - PADDING_Y
                    }
                });
                setSelectionBox(box);
            }, 50); // 50ms debounce
        };

        const handleMouseUp = () => {
            console.log('💬 Mouse up in chat');
            // Process selection after mouseup
            setTimeout(() => {
                handleSelectionChange();
            }, 10);
        };

        const handleMouseDown = (e) => {
            console.log('💬 Mouse down in chat, target:', e.target);

            // Check if clicking on selection overlay buttons (chat or PDF)
            const isOverlayButton = e.target.closest('.add-to-chat-btn, .drag-handle, .selection-overlay, .selection-action-btn');
            if (isOverlayButton) {
                console.log('💬 Click on overlay button - keeping selection');
                // Don't clear selection when clicking overlay
                return;
            }

            // Clear selection if clicking outside container
            if (!container.contains(e.target)) {
                console.log('💬 Click outside chat container - clearing');
                setSelectionBox(null);
                window.getSelection()?.removeAllRanges();
            } else {
                console.log('💬 Click inside chat container (not on overlay) - clearing selection');
                setSelectionBox(null);
                window.getSelection()?.removeAllRanges();
            }
        };

        // Listen to selection changes
        console.log('💬 Adding event listeners...');
        // selectionchange must be on document (it's a global event)
        document.addEventListener('selectionchange', handleSelectionChange);
        // mouseup and mousedown only on container to avoid conflicts with PDF drag
        container.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('mousedown', handleMouseDown);

        return () => {
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }
            document.removeEventListener('selectionchange', handleSelectionChange);
            container.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('mousedown', handleMouseDown);
        };
    }, [isChatOpen]); // Re-run when chat opens/closes

    return selectionBox;
}
