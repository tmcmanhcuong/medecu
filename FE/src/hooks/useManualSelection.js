import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * Custom hook for manual selection tracking in rendered markdown
 * SIMPLIFIED VERSION - Selection box persists after mouseup
 */
export function useManualSelection(containerRef) {
    const [selectionBox, setSelectionBox] = useState(null);
    const [selectedElements, setSelectedElements] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);
    const [mountCount, setMountCount] = useState(0);

    const isDraggingRef = useRef(false);
    const startPosRef = useRef(null);
    const currentPosRef = useRef(null);
    const scrollOffsetRef = useRef({ x: 0, y: 0 });
    const selectedElementsRef = useRef([]);
    const selectionBoxRef = useRef(null);
    const [containerReady, setContainerReady] = useState(false);

    // Increment mount counter on mount to force useEffect re-run
    useEffect(() => {
        setMountCount(prev => prev + 1);
        console.log('🔄 useManualSelection - Component mounted/remounted');
    }, []);

    // Watch for container to become ready
    useEffect(() => {
        const checkInterval = setInterval(() => {
            if (containerRef.current && !containerReady) {
                console.log('✅ Container is now ready!');
                setContainerReady(true);
                clearInterval(checkInterval);
            }
        }, 50); // Check every 50ms

        // Cleanup after 5 seconds
        const timeout = setTimeout(() => {
            clearInterval(checkInterval);
            if (!containerRef.current) {
                console.warn('⚠️ Container never became ready after 5 seconds');
            }
        }, 5000);

        return () => {
            clearInterval(checkInterval);
            clearTimeout(timeout);
        };
    }, [containerReady]);

    // Reset containerReady when mountCount changes
    useEffect(() => {
        if (mountCount > 0) {
            setContainerReady(false);
        }
    }, [mountCount]);

    // Get scrollable parent
    const getScrollableParent = useCallback((element) => {
        let parent = element?.parentElement;
        while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                return parent;
            }
            parent = parent.parentElement;
        }
        return window;
    }, []);

    // Calculate selection rectangle - FULL WIDTH, vertical only
    const calculateSelectionRect = useCallback((start, current, containerRect) => {
        if (!start || !current) return null;

        const top = Math.min(start.y, current.y) - containerRect.top;
        const bottom = Math.max(start.y, current.y) - containerRect.top;
        const height = bottom - top;

        return { left: 0, top, width: containerRect.width, height };
    }, []);

    // Find intersecting elements - vertical intersection only
    const findIntersectingElements = useCallback((selectionRect, container) => {
        if (!selectionRect || !container) return [];

        const blockElements = container.querySelectorAll(
            'p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, code, td, th'
        );

        const containerRect = container.getBoundingClientRect();
        const selectionTop = selectionRect.top + containerRect.top;
        const selectionBottom = selectionRect.top + selectionRect.height + containerRect.top;

        const intersecting = [];
        blockElements.forEach(element => {
            const elementRect = element.getBoundingClientRect();

            // Use element's CENTER point for intersection test
            // This prevents selecting elements that only slightly overlap
            const elementCenter = (elementRect.top + elementRect.bottom) / 2;

            const verticalIntersects = (
                elementCenter >= selectionTop &&
                elementCenter <= selectionBottom
            );

            if (verticalIntersects) {
                intersecting.push({
                    element,
                    rect: elementRect,
                    text: element.textContent
                });
            }
        });

        return intersecting;
    }, []);

    // Get selected text
    const getSelectedText = useCallback(() => {
        return selectedElements
            .map(item => item.text)
            .filter(text => text.trim())
            .join('\n');
    }, [selectedElements]);

    // Update ref whenever selectionBox changes
    useEffect(() => {
        selectionBoxRef.current = selectionBox;
    }, [selectionBox]);

    useEffect(() => {
        const container = containerRef.current;

        console.log('🔧 useManualSelection - useEffect triggered', {
            containerExists: !!container,
            containerReady,
            containerTagName: container?.tagName,
            containerClassName: container?.className,
            isInitialized,
            mountCount
        });

        if (!container || !containerReady) {
            console.warn('⚠️ useManualSelection - Container not ready, skipping event listeners', {
                containerExists: !!container,
                containerReady
            });
            setIsInitialized(false);
            return;
        }

        // Mark as initialized
        setIsInitialized(true);

        const scrollableParent = getScrollableParent(container);

        const handleMouseDown = (e) => {
            console.log('🖱️ MOUSEDOWN EVENT FIRED', {
                target: e.target.tagName,
                containerExists: !!container,
                containerContainsTarget: container?.contains(e.target),
                hasExistingSelection: !!selectionBox
            });

            const target = e.target;

            // Ignore clicks on buttons, links, inputs, bubbles
            if (target.closest('button, a, input, textarea, [data-bubble]')) {
                return;
            }

            // Ignore clicks on selection overlay action buttons and drag handle
            const isOverlayButton = target.closest('.selection-action-btn, .selection-drag-handle');
            if (isOverlayButton) {
                console.log('🎯 Ignoring overlay button click');
                return;
            }

            // Ignore clicks within chat container (chat has its own text selection)
            const isChatContainer = target.closest('[data-chat-container]');
            if (isChatContainer) {
                console.log('🎯 Ignoring click in chat container');
                return;
            }

            // Ignore clicks within PDF container (PDF has its own text selection)
            const isPdfContainer = target.closest('[data-pdf-container]');
            if (isPdfContainer) {
                console.log('🎯 Ignoring click in PDF container');
                return;
            }

            // If there's an existing selection box, check if click is outside it
            if (selectionBoxRef.current) {
                // Check if click is within the selection box area
                const containerRect = container.getBoundingClientRect();
                const clickX = e.clientX - containerRect.left;
                const clickY = e.clientY - containerRect.top;

                const isInsideSelectionBox = (
                    clickX >= selectionBoxRef.current.left &&
                    clickX <= selectionBoxRef.current.left + selectionBoxRef.current.width &&
                    clickY >= selectionBoxRef.current.top &&
                    clickY <= selectionBoxRef.current.top + selectionBoxRef.current.height
                );

                if (!isInsideSelectionBox) {
                    // Click is outside the selection box - clear it
                    console.log('🖱️ Click outside selection box - clearing selection');
                    setSelectionBox(null);
                    setSelectedElements([]);
                    selectedElementsRef.current = [];

                    // If click is outside container entirely, don't start new selection
                    if (!container.contains(target)) {
                        return;
                    }

                    // Otherwise, fall through to start new selection
                } else {
                    // Click is inside the selection box - do nothing (let user interact with selected text)
                    console.log('🖱️ Click inside selection box - ignoring');
                    return;
                }
            }


            // Click outside container (e.g., left sidebar, right sidebar, chat) - clear selection
            // BUT: Don't clear if clicking on PDF selection action buttons
            if (!container.contains(target)) {
                const isPdfActionButton = target.closest('.selection-action-btn');
                if (isPdfActionButton) {
                    console.log('🖱️ Click on PDF action button - keeping note selection');
                    return;
                }

                console.log('🖱️ Click outside main content - clearing selection');
                setSelectionBox(null);
                setSelectedElements([]);
                selectedElementsRef.current = [];
                return;
            }

            // Click inside container - record start position but don't activate yet
            // This allows native text selection to work if user doesn't drag far
            console.log('🖱️ Click inside container - recording start position');
            startPosRef.current = { x: e.clientX, y: e.clientY };
            currentPosRef.current = { x: e.clientX, y: e.clientY };

            if (scrollableParent === window) {
                scrollOffsetRef.current = { x: window.scrollX, y: window.scrollY };
            } else {
                scrollOffsetRef.current = {
                    x: scrollableParent.scrollLeft,
                    y: scrollableParent.scrollTop
                };
            }

            console.log('🖱️ Ready for potential selection');
        };

        let rafId = null;
        const DRAG_THRESHOLD = 10; // pixels - minimum drag distance to activate custom selection

        const handleMouseMove = (e) => {
            // Check if we should start dragging based on distance moved
            if (!isDraggingRef.current && startPosRef.current) {
                const dx = e.clientX - startPosRef.current.x;
                const dy = e.clientY - startPosRef.current.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > DRAG_THRESHOLD) {
                    // User has dragged far enough - activate custom selection
                    console.log('🖱️ Drag threshold exceeded - activating custom selection');
                    isDraggingRef.current = true;

                    // Prevent default to avoid conflicts with native selection
                    e.preventDefault();

                    // Clear any existing selection box
                    setSelectionBox(null);
                    setSelectedElements([]);
                    selectedElementsRef.current = [];

                    // Clear native text selection to avoid conflict
                    window.getSelection()?.removeAllRanges();
                } else {
                    // Not dragged far enough yet - allow native selection
                    return;
                }
            }

            if (!isDraggingRef.current) return;

            currentPosRef.current = { x: e.clientX, y: e.clientY };

            // Throttle with requestAnimationFrame (60fps max)
            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                rafId = null;

                const containerRect = container.getBoundingClientRect();

                // First, calculate drag rectangle to find intersecting elements
                const selectionRect = calculateSelectionRect(
                    startPosRef.current,
                    currentPosRef.current,
                    containerRect
                );

                if (selectionRect && selectionRect.height > 5) {
                    // Find intersecting elements
                    const intersecting = findIntersectingElements(selectionRect, container);
                    selectedElementsRef.current = intersecting;
                    setSelectedElements(intersecting);

                    // Calculate tight-fit box from actual elements
                    if (intersecting.length > 0) {
                        let minTop = Infinity;
                        let maxBottom = -Infinity;
                        let minLeft = Infinity;
                        let maxRight = -Infinity;

                        // Cache for text width measurements
                        const widthCache = new Map();

                        // Helper function to measure actual text content width (with cache)
                        const measureTextWidth = (element) => {
                            const cacheKey = element.textContent + element.className;
                            if (widthCache.has(cacheKey)) {
                                return widthCache.get(cacheKey);
                            }

                            try {
                                const span = document.createElement('span');
                                span.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;';

                                const styles = window.getComputedStyle(element);
                                span.style.font = styles.font;

                                span.textContent = element.textContent;

                                document.body.appendChild(span);
                                const width = span.getBoundingClientRect().width;
                                document.body.removeChild(span);

                                widthCache.set(cacheKey, width);
                                return width;
                            } catch (e) {
                                return element.getBoundingClientRect().width;
                            }
                        };

                        intersecting.forEach(item => {
                            const rect = item.element.getBoundingClientRect();

                            // Quick multi-line check (avoid getComputedStyle in loop)
                            const isMultiLine = rect.height > 40; // Approximate: > 2 lines

                            let actualRight;

                            if (isMultiLine) {
                                actualRight = rect.right;
                            } else {
                                const textWidth = measureTextWidth(item.element);
                                actualRight = rect.left + textWidth;
                            }

                            minTop = Math.min(minTop, rect.top);
                            maxBottom = Math.max(maxBottom, rect.bottom);
                            minLeft = Math.min(minLeft, rect.left);
                            maxRight = Math.max(maxRight, actualRight);
                        });

                        // Create tight-fit box (both width and height)
                        // Add padding to ensure text is fully visible
                        const PADDING_X = 20; // Horizontal padding (left/right)
                        const PADDING_Y = 4;  // Vertical padding (top/bottom)

                        const tightBox = {
                            left: minLeft - containerRect.left - PADDING_X,
                            top: minTop - containerRect.top - PADDING_Y,
                            width: maxRight - minLeft + (PADDING_X * 2),
                            height: maxBottom - minTop + (PADDING_Y * 2)
                        };

                        setSelectionBox(tightBox);
                    } else {
                        // No elements, use drag rect
                        setSelectionBox(selectionRect);
                    }
                }
            }); // Close requestAnimationFrame
        };

        const handleMouseUp = (e) => {
            if (isDraggingRef.current) {
                console.log('🖱️ Selection ended - box already tight-fit');
                console.log('📊 Final selected elements:', selectedElementsRef.current.length);
                isDraggingRef.current = false;
            }

            // Always reset startPosRef to prepare for next interaction
            startPosRef.current = null;

            // No need to recalculate - tight-fit is already done in handleMouseMove
        };

        const handleScroll = () => {
            if (!isDraggingRef.current) return;

            const containerRect = container.getBoundingClientRect();
            const selectionRect = calculateSelectionRect(
                startPosRef.current,
                currentPosRef.current,
                containerRect
            );

            if (selectionRect) {
                setSelectionBox(selectionRect);
                const intersecting = findIntersectingElements(selectionRect, container);
                selectedElementsRef.current = intersecting;
                setSelectedElements(intersecting);
            }
        };

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        if (scrollableParent) {
            scrollableParent.addEventListener('scroll', handleScroll);
        }

        const initTime = new Date().toISOString();
        console.log(`✅ useManualSelection - Event listeners attached at ${initTime}`);

        return () => {
            const cleanupTime = new Date().toISOString();
            console.log(`🧹 useManualSelection - Cleaning up event listeners at ${cleanupTime}`);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            if (scrollableParent) {
                scrollableParent.removeEventListener('scroll', handleScroll);
            }

            setIsInitialized(false);
        };
    }, [containerRef, containerReady, mountCount, calculateSelectionRect, findIntersectingElements, getScrollableParent]);

    // Monitor container readiness - DO NOT use containerRef.current in dependency array!
    // This is an anti-pattern that React doesn't track properly
    useEffect(() => {
        const checkContainer = () => {
            if (containerRef.current) {
                console.log('✅ Container ref is ready:', {
                    tagName: containerRef.current.tagName,
                    className: containerRef.current.className
                });
            } else {
                console.warn('⚠️ Container ref is null');
            }
        };

        // Check immediately
        checkContainer();

        // Also check after a short delay to catch late mounts
        const timeoutId = setTimeout(checkContainer, 100);

        return () => clearTimeout(timeoutId);
    }, []); // Empty dependency - only run on mount

    return {
        selectionBox,
        selectedElements,
        getSelectedText,
        isInitialized, // Export for debugging
        clearSelection: () => {
            setSelectionBox(null);
            setSelectedElements([]);
            selectedElementsRef.current = [];
        }
    };
}
