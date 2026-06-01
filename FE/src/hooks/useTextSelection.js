import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook to track text selection and show a bounding box overlay
 */
export function useTextSelection(containerRef) {
    const [selectionBox, setSelectionBox] = useState(null);
    const [isUserSelecting, setIsUserSelecting] = useState(false);
    const selectionTimeoutRef = useRef(null);

    // Track mousedown position to detect browser auto-expansion
    // These MUST be at top level, not inside useEffect
    const mouseDownPosRef = useRef(null);
    const mouseDownTargetRef = useRef(null);
    const mouseUpPosRef = useRef(null); // NEW: track mouseup position

    useEffect(() => {
        console.log('🔍 useTextSelection - containerRef.current:', containerRef.current);
        if (!containerRef.current) return;

        const container = containerRef.current;
        console.log('✅ useTextSelection - Container found:', container.className);

        // Find the scrollable parent once
        let scrollableParent = container.parentElement;
        console.log('🔍 Looking for scrollable parent, starting from:', container.className);

        while (scrollableParent && scrollableParent !== document.body) {
            const style = window.getComputedStyle(scrollableParent);
            const overflowY = style.overflowY;
            console.log('  Checking:', scrollableParent.className, 'overflowY:', overflowY);

            if (overflowY === 'auto' || overflowY === 'scroll') {
                console.log('  ✅ Found scrollable parent:', scrollableParent.className);
                break;
            }
            scrollableParent = scrollableParent.parentElement;
        }

        if (!scrollableParent || scrollableParent === document.body) {
            console.log('  ⚠️ No scrollable parent found, using document.body');
            scrollableParent = document.body;
        }

        // Track when user starts selecting
        const handleMouseDown = (e) => {
            // Ignore clicks on bubbles (they have their own onClick handlers)
            const isBubble = e.target.closest('[data-bubble]');
            if (isBubble) {
                console.log('🎯 Ignoring bubble click in useTextSelection');
                return;
            }

            // Ignore clicks on selection overlay buttons (they have pointerEvents: auto)
            const isOverlayButton = e.target.closest('.add-to-chat-btn, .drag-handle');
            if (isOverlayButton) {
                console.log('🎯 Ignoring overlay button click');
                return;
            }

            // Click outside container - clear selection
            if (!container.contains(e.target)) {
                console.log('🖱️ Click outside container - clearing selection');
                setSelectionBox(null);
                return;
            }

            // Click inside container - track for selection
            console.log('🖱️ Mouse down - starting selection');
            setIsUserSelecting(true);

            // Store mousedown position and target
            mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
            mouseDownTargetRef.current = e.target;
            mouseUpPosRef.current = null; // Reset mouseup
            console.log('📍 Stored mousedown position:', mouseDownPosRef.current);
        };

        const handleMouseUp = (e) => {
            console.log('🖱️ Mouse up - ending selection');

            // If mouseup is within container, immediately process selection
            if (container.contains(e.target)) {
                // Store mouseup position
                mouseUpPosRef.current = { x: e.clientX, y: e.clientY };
                console.log('📍 Stored mouseup position:', mouseUpPosRef.current);

                console.log('🖱️ Mouse up inside container - processing with retries');

                // Try immediately
                setTimeout(() => {
                    handleSelectionChange();
                }, 10);

                // Retry after 50ms (browser may need time to finalize)
                setTimeout(() => {
                    const sel = window.getSelection();
                    console.log('🔄 Retry 1 (50ms):', {
                        hasSelection: !!sel,
                        rangeCount: sel?.rangeCount,
                        isCollapsed: sel?.isCollapsed,
                        text: sel?.toString().substring(0, 30)
                    });
                    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                        handleSelectionChange();
                    }
                }, 50);

                // Retry after 100ms (for slower browsers)
                setTimeout(() => {
                    const sel = window.getSelection();
                    console.log('🔄 Retry 2 (100ms):', {
                        hasSelection: !!sel,
                        rangeCount: sel?.rangeCount,
                        isCollapsed: sel?.isCollapsed,
                        text: sel?.toString().substring(0, 30)
                    });
                    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                        handleSelectionChange();
                    }
                }, 100);

                // Final retry after 200ms
                setTimeout(() => {
                    const sel = window.getSelection();
                    console.log('🔄 Retry 3 (200ms):', {
                        hasSelection: !!sel,
                        rangeCount: sel?.rangeCount,
                        isCollapsed: sel?.isCollapsed,
                        text: sel?.toString().substring(0, 30)
                    });
                    if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
                        handleSelectionChange();
                    }
                }, 200);
            }

            setTimeout(() => {
                setIsUserSelecting(false);
            }, 250);
        };

        const handleSelectionChange = () => {
            console.log('🔄 handleSelectionChange called');

            // Clear previous timeout
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }

            // Debounce selection change to avoid multiple rapid updates
            selectionTimeoutRef.current = setTimeout(() => {
                const selection = window.getSelection();

                console.log('🔍 Selection state:', {
                    hasSelection: !!selection,
                    rangeCount: selection?.rangeCount,
                    isCollapsed: selection?.isCollapsed,
                    toString: selection?.toString().substring(0, 50)
                });

                // Check if there's a selection
                if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
                    console.log('❌ No valid selection - setting box to null');
                    setSelectionBox(null);
                    return;
                }

                const range = selection.getRangeAt(0);

                // DEBUG: Log range details
                console.log('🔍 Range details:', {
                    startContainer: range.startContainer,
                    startOffset: range.startOffset,
                    endContainer: range.endContainer,
                    endOffset: range.endOffset,
                    toString: range.toString().substring(0, 50),
                    collapsed: range.collapsed
                });
                let actualRange = range;
                let useTextNodeExtraction = false;

                // CRITICAL FIX: Only use text node extraction when browser ACTUALLY auto-expands
                // Browser auto-expands when startContainer or endContainer is an ELEMENT node
                // For normal TEXT node selections, use browser's native selection
                const isAutoExpanded = range.startContainer.nodeType === Node.ELEMENT_NODE ||
                    range.endContainer.nodeType === Node.ELEMENT_NODE;

                if (isAutoExpanded) {
                    console.log('⚠️ Browser auto-expanded selection - using text node extraction to correct it');
                    useTextNodeExtraction = true;
                } else {
                    console.log('✅ Normal text selection - using browser native selection');
                    useTextNodeExtraction = false;
                }

                // Check if selection is within our container
                if (!container.contains(actualRange.commonAncestorContainer)) {
                    setSelectionBox(null);
                    return;
                }

                // Process selection - no need to check isUserSelecting
                console.log('✅ Processing selection');

                let rects = [];

                if (useTextNodeExtraction) {
                    console.log('🔍 Extracting text nodes from selection...');

                    // Check if we have mousedown information
                    const hasMouseInfo = mouseDownTargetRef.current && mouseDownPosRef.current;
                    console.log('📍 Has mouse info:', hasMouseInfo, 'Target:', mouseDownTargetRef.current?.nodeName, mouseDownTargetRef.current?.className);

                    // Find the closest block-level element that was clicked
                    let mouseDownBlock = null;
                    if (hasMouseInfo) {
                        const target = mouseDownTargetRef.current;
                        console.log('🎯 Mousedown target details:', {
                            nodeName: target.nodeName,
                            className: target.className,
                            textContent: target.textContent?.substring(0, 50)
                        });

                        // Try multiple strategies to find the block element
                        // Strategy 1: Look for prose children first
                        mouseDownBlock = target.closest('.prose > *');
                        console.log('  Strategy 1 (.prose > *):', mouseDownBlock?.tagName);

                        // Strategy 2: Look for specific prose elements
                        if (!mouseDownBlock) {
                            mouseDownBlock = target.closest('.prose p, .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6, .prose li, .prose blockquote, .prose pre, .prose ol, .prose ul');
                            console.log('  Strategy 2 (prose elements):', mouseDownBlock?.tagName);
                        }

                        // Strategy 3: Look for any block element
                        if (!mouseDownBlock) {
                            mouseDownBlock = target.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, ol, ul, div');
                            console.log('  Strategy 3 (any block):', mouseDownBlock?.tagName);
                        }

                        // Strategy 4: If target itself is a block element
                        if (!mouseDownBlock && target.nodeType === Node.ELEMENT_NODE) {
                            const tagName = target.tagName.toLowerCase();
                            if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre', 'ol', 'ul', 'div'].includes(tagName)) {
                                mouseDownBlock = target;
                                console.log('  Strategy 4 (target is block):', mouseDownBlock?.tagName);
                            }
                        }

                        console.log('📦 Final mousedown block element:', mouseDownBlock?.tagName, mouseDownBlock?.className, mouseDownBlock?.textContent?.substring(0, 30));
                    }

                    // Check if selection spans multiple blocks
                    // If it does, we should NOT filter by mouseDownBlock
                    const startBlock = range.startContainer.parentElement?.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote');
                    const endBlock = range.endContainer.parentElement?.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote');
                    const selectionSpansMultipleBlocks = range.startContainer !== range.endContainer && startBlock !== endBlock;

                    console.log('🔍 Range boundaries:', {
                        startContainer: range.startContainer.nodeName,
                        startContainerText: range.startContainer.textContent?.substring(0, 30),
                        startOffset: range.startOffset,
                        endContainer: range.endContainer.nodeName,
                        endContainerText: range.endContainer.textContent?.substring(0, 30),
                        endOffset: range.endOffset,
                        startBlock: startBlock?.tagName,
                        startBlockText: startBlock?.textContent?.substring(0, 30),
                        endBlock: endBlock?.tagName,
                        endBlockText: endBlock?.textContent?.substring(0, 30),
                        blocksMatch: startBlock === endBlock,
                        selectionSpansMultipleBlocks
                    });

                    // CRITICAL FIX: Detect browser auto-expansion
                    // If startContainer or endContainer is an ELEMENT node, browser has auto-expanded
                    const isAutoExpanded = range.startContainer.nodeType === Node.ELEMENT_NODE ||
                        range.endContainer.nodeType === Node.ELEMENT_NODE;

                    console.log('⚠️ Auto-expansion detected:', isAutoExpanded);

                    // If auto-expanded, we need to find the ACTUAL text nodes that were selected
                    let correctedRange = range;
                    if (isAutoExpanded && hasMouseInfo) {
                        console.log('🔧 Attempting to correct auto-expanded selection using mouse position...');

                        // Get all text nodes in the selection
                        const correctionWalker = document.createTreeWalker(
                            range.commonAncestorContainer,
                            NodeFilter.SHOW_TEXT,
                            null
                        );

                        const textNodesInSelection = [];
                        let correctionNode;
                        while (correctionNode = correctionWalker.nextNode()) {
                            if (correctionNode.textContent.trim() && selection.containsNode(correctionNode, true)) {
                                textNodesInSelection.push(correctionNode);
                            }
                        }

                        console.log('📝 Text nodes in auto-expanded selection:', textNodesInSelection.length);

                        if (textNodesInSelection.length > 0) {
                            // NEW APPROACH: Use drag rectangle to filter nodes
                            // Calculate the drag rectangle from mousedown to mouseup
                            const mouseDown = mouseDownPosRef.current;
                            const mouseUp = mouseUpPosRef.current;

                            if (mouseDown && mouseUp) {
                                const dragRect = {
                                    left: Math.min(mouseDown.x, mouseUp.x),
                                    top: Math.min(mouseDown.y, mouseUp.y),
                                    right: Math.max(mouseDown.x, mouseUp.x),
                                    bottom: Math.max(mouseDown.y, mouseUp.y)
                                };

                                console.log('📐 Drag rectangle:', dragRect);

                                // Filter nodes that intersect with drag rectangle
                                const nodesInDragRect = textNodesInSelection.filter(n => {
                                    const rect = n.parentElement?.getBoundingClientRect();
                                    if (!rect) return false;

                                    // Check if node rect intersects with drag rect
                                    const intersects = !(
                                        rect.right < dragRect.left ||
                                        rect.left > dragRect.right ||
                                        rect.bottom < dragRect.top ||
                                        rect.top > dragRect.bottom
                                    );

                                    console.log(`  Node "${n.textContent.substring(0, 20)}..." - rect: {top: ${rect.top.toFixed(0)}, bottom: ${rect.bottom.toFixed(0)}}, intersects: ${intersects}`);
                                    return intersects;
                                });

                                console.log('📝 Text nodes intersecting drag rect:', nodesInDragRect.length);

                                // If we have mouseDownBlock, further filter to only nodes within it
                                let finalNodes = nodesInDragRect;
                                if (mouseDownBlock) {
                                    finalNodes = nodesInDragRect.filter(n => mouseDownBlock.contains(n));
                                    console.log('📝 Text nodes in mousedown block:', finalNodes.length);
                                }

                                if (finalNodes.length > 0) {
                                    // Create a new range with just the filtered nodes
                                    const newRange = document.createRange();
                                    const firstNode = finalNodes[0];
                                    const lastNode = finalNodes[finalNodes.length - 1];

                                    newRange.setStart(firstNode, 0);
                                    newRange.setEnd(lastNode, lastNode.textContent.length);

                                    correctedRange = newRange;
                                    console.log('✅ Corrected range using drag rect:', {
                                        startContainer: correctedRange.startContainer.nodeName,
                                        startText: correctedRange.startContainer.textContent?.substring(0, 30),
                                        endContainer: correctedRange.endContainer.nodeName,
                                        endText: correctedRange.endContainer.textContent?.substring(0, 30),
                                        nodeCount: finalNodes.length
                                    });
                                } else {
                                    console.log('⚠️ No nodes found in drag rectangle, keeping original range');
                                }
                            } else {
                                console.log('⚠️ Missing mousedown or mouseup position, using Y-position fallback');
                                // Fallback to old Y-position logic
                                const mouseY = mouseDownPosRef.current?.y || 0;
                                console.log('📍 Mouse Y position:', mouseY);

                                const nodesAtOrBelowMouse = textNodesInSelection.filter(n => {
                                    const rect = n.parentElement?.getBoundingClientRect();
                                    if (!rect) return false;

                                    // Include node if its top is at or below mouse Y (with some tolerance)
                                    const isBelow = rect.top >= (mouseY - 50); // 50px tolerance
                                    console.log(`  Node "${n.textContent.substring(0, 20)}..." - top: ${rect.top}, mouseY: ${mouseY}, include: ${isBelow}`);
                                    return isBelow;
                                });

                                console.log('📝 Text nodes at or below mouse:', nodesAtOrBelowMouse.length);

                                // If we have mouseDownBlock, further filter to only nodes within it
                                let finalNodes = nodesAtOrBelowMouse;
                                if (mouseDownBlock) {
                                    finalNodes = nodesAtOrBelowMouse.filter(n => mouseDownBlock.contains(n));
                                    console.log('📝 Text nodes in mousedown block:', finalNodes.length);
                                }

                                if (finalNodes.length > 0) {
                                    // Create a new range with just the filtered nodes
                                    const newRange = document.createRange();
                                    const firstNode = finalNodes[0];
                                    const lastNode = finalNodes[finalNodes.length - 1];

                                    newRange.setStart(firstNode, 0);
                                    newRange.setEnd(lastNode, lastNode.textContent.length);

                                    correctedRange = newRange;
                                    console.log('✅ Corrected range:', {
                                        startContainer: correctedRange.startContainer.nodeName,
                                        startText: correctedRange.startContainer.textContent?.substring(0, 30),
                                        endContainer: correctedRange.endContainer.nodeName,
                                        endText: correctedRange.endContainer.textContent?.substring(0, 30),
                                        nodeCount: finalNodes.length
                                    });
                                } else {
                                    console.log('⚠️ No nodes found at or below mouse position, keeping original range');
                                }
                            }
                        }
                    }

                    // Use corrected range for all subsequent operations
                    range = correctedRange;

                    // Get all text nodes that are actually selected
                    // Use the mousedown block as the root ONLY if selection is within single block
                    // Otherwise use commonAncestorContainer to get all selected text
                    const treeRoot = (hasMouseInfo && mouseDownBlock && !selectionSpansMultipleBlocks)
                        ? mouseDownBlock
                        : range.commonAncestorContainer;
                    console.log('🌳 Tree root for text node extraction:', treeRoot.nodeName, treeRoot.className);

                    const walker = document.createTreeWalker(
                        treeRoot,
                        NodeFilter.SHOW_TEXT,
                        null
                    );

                    const selectedTextNodes = [];
                    let node;

                    while (node = walker.nextNode()) {
                        // Skip empty text nodes
                        if (!node.textContent.trim()) {
                            continue;
                        }

                        // Check if this text node is within the selection
                        // Use a more precise check: create a range for this node and see if it intersects
                        const nodeRange = document.createRange();
                        nodeRange.selectNodeContents(node);

                        // Check if the selection range intersects with this text node's range
                        const intersects = (
                            range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
                            range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0
                        );

                        if (intersects || selection.containsNode(node, true)) {
                            // Only filter by mousedown block if selection is within single block
                            if (hasMouseInfo && mouseDownBlock && !selectionSpansMultipleBlocks) {
                                // Check if this text node belongs to the mousedown block
                                const isSameBlock = mouseDownBlock.contains(node);

                                if (isSameBlock) {
                                    selectedTextNodes.push(node);
                                    console.log('✅ Text node in mousedown block:', node.textContent.substring(0, 30));
                                } else {
                                    console.log('⚠️ Skipping text node from different block:', node.textContent.substring(0, 30));
                                }
                            } else {
                                // Multi-block selection or no mousedown info - include all selected nodes
                                selectedTextNodes.push(node);
                                console.log('✅ Text node selected (multi-block):', node.textContent.substring(0, 30));
                            }
                        }
                    }

                    console.log('📝 Found text nodes:', selectedTextNodes.length);

                    if (selectedTextNodes.length === 0) {
                        console.log('⚠️ No text nodes found in selection, skipping');
                        setSelectionBox(null);
                        return;
                    }

                    // Get rects from each selected text node
                    // For partial selections, we need to use the actual selection range
                    selectedTextNodes.forEach((textNode, idx) => {
                        const nodeRange = document.createRange();

                        // Check if this is the start or end node of the selection
                        const isStartNode = textNode === range.startContainer;
                        const isEndNode = textNode === range.endContainer;

                        if (isStartNode && isEndNode) {
                            // Selection is within a single text node
                            nodeRange.setStart(textNode, range.startOffset);
                            nodeRange.setEnd(textNode, range.endOffset);
                        } else if (isStartNode) {
                            // This is the start node
                            nodeRange.setStart(textNode, range.startOffset);
                            nodeRange.setEnd(textNode, textNode.textContent.length);
                        } else if (isEndNode) {
                            // This is the end node
                            nodeRange.setStart(textNode, 0);
                            nodeRange.setEnd(textNode, range.endOffset);
                        } else {
                            // This is a middle node, select all of it
                            nodeRange.selectNodeContents(textNode);
                        }

                        const nodeRects = nodeRange.getClientRects();
                        rects.push(...Array.from(nodeRects));
                        console.log(`  📐 Node ${idx}: ${nodeRects.length} rects`);
                    });

                    console.log('📐 Total rects from text nodes:', rects.length);
                } else {
                    // Normal selection - use range.getClientRects() directly
                    rects = Array.from(actualRange.getClientRects());
                    console.log('📐 Total rects:', rects.length);
                }

                if (rects.length === 0) {
                    console.log('⚠️ No rects found, skipping');
                    setSelectionBox(null);
                    return;
                }

                // Filter out empty rects (width or height = 0)
                const validRects = rects.filter(r => r.width > 0 && r.height > 0);

                if (validRects.length === 0) {
                    console.log('⚠️ No valid rects found, skipping');
                    setSelectionBox(null);
                    return;
                }

                // Calculate the bounding box from all valid rects
                const minLeft = Math.min(...validRects.map(r => r.left));
                const minTop = Math.min(...validRects.map(r => r.top));
                const maxRight = Math.max(...validRects.map(r => r.right));
                const maxBottom = Math.max(...validRects.map(r => r.bottom));

                const rangeRect = {
                    left: minLeft,
                    top: minTop,
                    right: maxRight,
                    bottom: maxBottom,
                    width: maxRight - minLeft,
                    height: maxBottom - minTop
                };

                // DEBUG: Log range rect
                console.log('📐 Range rect (from valid rects):', {
                    left: rangeRect.left,
                    top: rangeRect.top,
                    width: rangeRect.width,
                    height: rangeRect.height,
                    validRectsCount: validRects.length
                });

                // Calculate the overall bounding box
                const containerRect = container.getBoundingClientRect();

                // DEBUG: Log container details
                console.log('📦 Container details:', {
                    tagName: container.tagName,
                    className: container.className,
                    id: container.id,
                    containerRect: {
                        top: containerRect.top,
                        left: containerRect.left,
                        width: containerRect.width,
                        height: containerRect.height
                    },
                    scrollableParentScrollTop: scrollableParent?.scrollTop
                });

                // Get detailed selection info for debugging
                const selectedText = selection.toString();
                const startContainer = range.startContainer;
                const endContainer = range.endContainer;
                const startOffset = range.startOffset;
                const endOffset = range.endOffset;

                // Debug logs
                console.log('📍 Selection Debug:', {
                    selectedText: selectedText.substring(0, 100) + (selectedText.length > 100 ? '...' : ''),
                    selectedTextLength: selectedText.length,
                    rangeRect,
                    containerRect,
                    scrollableParent: scrollableParent?.className,
                    scrollTop: scrollableParent?.scrollTop,
                    rangeTop: rangeRect.top,
                    containerTop: containerRect.top,
                    diff: rangeRect.top - containerRect.top,
                    startContainer: startContainer.nodeName,
                    endContainer: endContainer.nodeName,
                    startOffset,
                    endOffset,
                    startText: startContainer.textContent?.substring(0, 50),
                    endText: endContainer.textContent?.substring(0, 50)
                });

                // Convert to container-relative coordinates
                // containerRect is the INNER content div (noteContentRef), which MOVES as you scroll
                // So containerRect.top changes from positive to negative as you scroll down
                // We do NOT need to add scrollOffset because the movement is already reflected in containerRect.top
                const scrollOffset = scrollableParent ? scrollableParent.scrollTop : 0;

                // Add padding around the selection box for better visual appearance
                const PADDING_X = 20; // Horizontal padding (left/right) - matches manual selection
                const PADDING_Y = 4; // Vertical padding (top/bottom)

                const box = {
                    left: rangeRect.left - containerRect.left - PADDING_X,
                    top: rangeRect.top - containerRect.top - PADDING_Y,
                    width: rangeRect.width + (PADDING_X * 2),
                    height: rangeRect.height + (PADDING_Y * 2),
                    _timestamp: Date.now(), // Debug: to see if box is updating
                };

                console.log('📦 Selection Box (NEW):', {
                    ...box,
                    selectedTextPreview: selectedText.substring(0, 30) + '...'
                });
                console.log('🔢 Raw values:', {
                    'rangeRect.left': rangeRect.left,
                    'rangeRect.top': rangeRect.top,
                    'containerRect.left': containerRect.left,
                    'containerRect.top': containerRect.top,
                    'scrollOffset (not used)': scrollOffset,
                    'calculated left': rangeRect.left - containerRect.left,
                    'calculated top': rangeRect.top - containerRect.top,
                    'note': 'containerRect moves with scroll, so no need to add scrollOffset'
                });

                setSelectionBox(box);
            }, 10); // 10ms debounce - faster response for user interactions
        };

        // Listen to mouse events
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        // Listen to selection changes with immediate logging
        const selectionChangeListener = () => {
            const sel = window.getSelection();
            console.log('📢 selectionchange event fired:', {
                hasSelection: !!sel,
                rangeCount: sel?.rangeCount,
                isCollapsed: sel?.isCollapsed,
                text: sel?.toString().substring(0, 30)
            });
            handleSelectionChange();
        };
        document.addEventListener('selectionchange', selectionChangeListener);

        // Listen to scroll events on the scrollable parent to update position
        if (scrollableParent) {
            scrollableParent.addEventListener('scroll', handleSelectionChange);
        }

        return () => {
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('selectionchange', selectionChangeListener);
            if (scrollableParent) {
                scrollableParent.removeEventListener('scroll', handleSelectionChange);
            }
        };
    }, [containerRef]);

    return selectionBox;
}
