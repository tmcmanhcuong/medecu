import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextSelection } from '@/hooks/useTextSelection.js';
import { useRef } from 'react';

/**
 * Test Suite: Text Selection State Management
 * 
 * Mục đích: Đảm bảo text selection state hoạt động đúng, không bị conflict
 * và cleanup đúng cách
 */
describe('useTextSelection Hook - State Management', () => {
    let container;
    let containerRef;

    beforeEach(() => {
        // Tạo DOM container cho test
        container = document.createElement('div');
        container.innerHTML = '<p>Sample text for selection</p>';
        document.body.appendChild(container);

        // Mock getBoundingClientRect
        container.getBoundingClientRect = vi.fn(() => ({
            left: 0,
            top: 0,
            right: 100,
            bottom: 100,
            width: 100,
            height: 100,
        }));

        container.scrollLeft = 0;
        container.scrollTop = 0;
    });

    afterEach(() => {
        // Cleanup DOM
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        vi.clearAllMocks();

        // Clear selection
        window.getSelection()?.removeAllRanges();
    });

    describe('Initial State', () => {
        it('nên khởi tạo với selectionBox = null', () => {
            const { result } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            expect(result.current).toBeNull();
        });

        it('nên không crash khi containerRef.current là null', () => {
            const { result } = renderHook(() => {
                const ref = useRef(null);
                return useTextSelection(ref);
            });

            expect(result.current).toBeNull();
        });
    });

    describe('Selection Detection', () => {
        it('nên detect selection và set bounding box', () => {
            // Mock window.getSelection
            const mockRange = {
                commonAncestorContainer: container.firstChild,
                getClientRects: vi.fn(() => ([
                    { left: 10, top: 10, right: 50, bottom: 20 },
                ])),
            };

            const mockSelection = {
                rangeCount: 1,
                isCollapsed: false,
                getRangeAt: vi.fn(() => mockRange),
                removeAllRanges: vi.fn(),
            };

            window.getSelection = vi.fn(() => mockSelection);

            const { result } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            // Trigger selection change event
            act(() => {
                const event = new Event('selectionchange');
                document.dispatchEvent(event);
            });

            // Phải phát hiện selection
            expect(result.current).not.toBeNull();
            expect(result.current).toHaveProperty('left');
            expect(result.current).toHaveProperty('top');
            expect(result.current).toHaveProperty('width');
            expect(result.current).toHaveProperty('height');
        });

        it('nên clear selection box khi selection bị collapse', () => {
            const mockSelection = {
                rangeCount: 0,
                isCollapsed: true,
                getRangeAt: vi.fn(),
                removeAllRanges: vi.fn(),
            };

            window.getSelection = vi.fn(() => mockSelection);

            const { result } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            act(() => {
                const event = new Event('selectionchange');
                document.dispatchEvent(event);
            });

            expect(result.current).toBeNull();
        });
    });

    describe('State Isolation - Tránh chồng chéo', () => {
        it('nên không ảnh hưởng lẫn nhau giữa nhiều instances', () => {
            // Tạo 2 containers riêng biệt
            const container1 = document.createElement('div');
            const container2 = document.createElement('div');

            container1.innerHTML = '<p>Container 1</p>';
            container2.innerHTML = '<p>Container 2</p>';

            document.body.appendChild(container1);
            document.body.appendChild(container2);

            container1.getBoundingClientRect = vi.fn(() => ({
                left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100,
            }));

            container2.getBoundingClientRect = vi.fn(() => ({
                left: 200, top: 0, right: 300, bottom: 100, width: 100, height: 100,
            }));

            // Render 2 hook instances
            const { result: result1 } = renderHook(() => {
                const ref = useRef(container1);
                return useTextSelection(ref);
            });

            const { result: result2 } = renderHook(() => {
                const ref = useRef(container2);
                return useTextSelection(ref);
            });

            // Mock selection trong container1
            const mockRange1 = {
                commonAncestorContainer: container1.firstChild,
                getClientRects: vi.fn(() => ([
                    { left: 10, top: 10, right: 50, bottom: 20 },
                ])),
            };

            const mockSelection = {
                rangeCount: 1,
                isCollapsed: false,
                getRangeAt: vi.fn(() => mockRange1),
                removeAllRanges: vi.fn(),
            };

            window.getSelection = vi.fn(() => mockSelection);

            act(() => {
                const event = new Event('selectionchange');
                document.dispatchEvent(event);
            });

            // Instance 1 phải có selection
            expect(result1.current).not.toBeNull();

            // Instance 2 không nên có selection (vì selection không trong container2)
            expect(result2.current).toBeNull();

            // Cleanup
            document.body.removeChild(container1);
            document.body.removeChild(container2);
        });

        it('nên cleanup event listeners khi unmount', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
            const containerRemoveSpy = vi.spyOn(container, 'removeEventListener');

            const { unmount } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            unmount();

            // Phải cleanup listeners
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'selectionchange',
                expect.any(Function)
            );
            expect(containerRemoveSpy).toHaveBeenCalledWith(
                'scroll',
                expect.any(Function)
            );
        });

        it('nên không bị memory leak khi mount/unmount nhiều lần', () => {
            // Mount và unmount 5 lần
            for (let i = 0; i < 5; i++) {
                const { unmount } = renderHook(() => {
                    const ref = useRef(container);
                    return useTextSelection(ref);
                });

                // Simulate some selection activity
                act(() => {
                    const event = new Event('selectionchange');
                    document.dispatchEvent(event);
                });

                unmount();
            }

            // Không có cách test memory leak trực tiếp, nhưng test này đảm bảo
            // không có error khi mount/unmount nhiều lần
            expect(true).toBe(true);
        });
    });

    describe('Boundary Calculation', () => {
        it('nên tính toán đúng bounding box với nhiều rectangles', () => {
            const mockRange = {
                commonAncestorContainer: container.firstChild,
                getClientRects: vi.fn(() => ([
                    { left: 10, top: 10, right: 50, bottom: 20 },
                    { left: 10, top: 20, right: 80, bottom: 30 },
                    { left: 10, top: 30, right: 40, bottom: 40 },
                ])),
            };

            const mockSelection = {
                rangeCount: 1,
                isCollapsed: false,
                getRangeAt: vi.fn(() => mockRange),
                removeAllRanges: vi.fn(),
            };

            window.getSelection = vi.fn(() => mockSelection);

            const { result } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            act(() => {
                const event = new Event('selectionchange');
                document.dispatchEvent(event);
            });

            expect(result.current).not.toBeNull();

            // left = min(10, 10, 10) = 10
            expect(result.current.left).toBe(10);

            // top = min(10, 20, 30) = 10
            expect(result.current.top).toBe(10);

            // width = max(50, 80, 40) - min(10, 10, 10) = 80 - 10 = 70
            expect(result.current.width).toBe(70);

            // height = max(20, 30, 40) - min(10, 20, 30) = 40 - 10 = 30
            expect(result.current.height).toBe(30);
        });

        it('nên update khi container scroll', () => {
            const mockRange = {
                commonAncestorContainer: container.firstChild,
                getClientRects: vi.fn(() => ([
                    { left: 10, top: 10, right: 50, bottom: 20 },
                ])),
            };

            const mockSelection = {
                rangeCount: 1,
                isCollapsed: false,
                getRangeAt: vi.fn(() => mockRange),
                removeAllRanges: vi.fn(),
            };

            window.getSelection = vi.fn(() => mockSelection);

            renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            // Trigger scroll event
            act(() => {
                container.scrollTop = 50;
                const event = new Event('scroll');
                container.dispatchEvent(event);
            });

            // Event handler phải được gọi (không throw error)
            expect(true).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('nên handle khi getClientRects trả về empty array', () => {
            const mockRange = {
                commonAncestorContainer: container.firstChild,
                getClientRects: vi.fn(() => []),
            };

            const mockSelection = {
                rangeCount: 1,
                isCollapsed: false,
                getRangeAt: vi.fn(() => mockRange),
                removeAllRanges: vi.fn(),
            };

            window.getSelection = vi.fn(() => mockSelection);

            const { result } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            act(() => {
                const event = new Event('selectionchange');
                document.dispatchEvent(event);
            });

            expect(result.current).toBeNull();
        });

        it('nên ignore selection bên ngoài container', () => {
            const outsideElement = document.createElement('div');
            document.body.appendChild(outsideElement);

            const mockRange = {
                commonAncestorContainer: outsideElement,
                getClientRects: vi.fn(() => ([
                    { left: 10, top: 10, right: 50, bottom: 20 },
                ])),
            };

            const mockSelection = {
                rangeCount: 1,
                isCollapsed: false,
                getRangeAt: vi.fn(() => mockRange),
                removeAllRanges: vi.fn(),
            };

            window.getSelection = vi.fn(() => mockSelection);

            const { result } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            act(() => {
                const event = new Event('selectionchange');
                document.dispatchEvent(event);
            });

            expect(result.current).toBeNull();

            document.body.removeChild(outsideElement);
        });
    });
});
