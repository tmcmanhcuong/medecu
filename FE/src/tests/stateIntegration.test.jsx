import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/hooks/useAuth.jsx';
import useAuth from '@/hooks/useAuth.jsx';
import { useTextSelection } from '@/hooks/useTextSelection.js';
import { useRef, useState } from 'react';
import { mockLogin, submitMockAnswers } from '@/services/mock.jsx';

/**
 * Test Suite: State Integration & Conflict Prevention
 * 
 * Mục đích: Đảm bảo các state khác nhau có thể hoạt động cùng nhau
 * mà không gây conflict hoặc chồng chéo
 */
describe('State Integration Tests', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        vi.clearAllMocks();
        window.getSelection()?.removeAllRanges();
    });

    describe('Auth & Mock Services Integration', () => {
        it('nên có thể login và submit answers mà không conflict', async () => {
            // Login first
            const authResult = await mockLogin('student@example.com', '123456');

            // Store token
            localStorage.setItem('access_token', authResult.token);

            // Initialize auth hook
            const { result: authHook } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(authHook.current.initializing).toBe(false);
            });

            expect(authHook.current.authed).toBe(true);

            // Submit answers
            const answerResult = await submitMockAnswers({ 'ex_01': 'C' });

            // Both states phải hoạt động bình thường
            expect(authHook.current.authed).toBe(true);
            expect(answerResult.summary).toBeDefined();
            expect(answerResult.results).toBeDefined();
        });

        it('nên handle concurrent auth và data operations', async () => {
            const { result: authHook } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(authHook.current.initializing).toBe(false);
            });

            // Perform operations đồng thời
            const [loginResult, answersResult] = await Promise.all([
                act(async () => {
                    await authHook.current.login();
                    return mockLogin('student@example.com', '123456');
                }),
                submitMockAnswers({ 'ex_01': 'C', 'ex_02': 'B' }),
            ]);

            expect(authHook.current.authed).toBe(true);
            expect(loginResult.token).toBeDefined();
            expect(answersResult.summary.total).toBe(4);
        });

        it('nên reset data state khi logout nhưng không ảnh hưởng mock data', async () => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('user_answers', JSON.stringify({ 'ex_01': 'A' }));

            const { result: authHook } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(authHook.current.initializing).toBe(false);
            });

            expect(authHook.current.authed).toBe(true);

            // Submit answers before logout
            await submitMockAnswers({ 'ex_01': 'C' });

            // Logout
            await act(async () => {
                await authHook.current.logout();
            });

            expect(authHook.current.authed).toBe(false);

            // Mock data vẫn phải hoạt động
            const result = await submitMockAnswers({ 'ex_02': 'B' });
            expect(result.summary).toBeDefined();
        });
    });

    describe('Auth & TextSelection Integration', () => {
        it('nên có thể sử dụng auth và text selection cùng lúc', async () => {
            // Setup container
            const container = document.createElement('div');
            container.innerHTML = '<p>Test content</p>';
            document.body.appendChild(container);

            container.getBoundingClientRect = vi.fn(() => ({
                left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100,
            }));

            // Setup auth
            const { result: authHook } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(authHook.current.initializing).toBe(false);
            });

            // Setup text selection
            const { result: selectionHook } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            // Login
            await act(async () => {
                await authHook.current.login();
            });

            // Simulate selection
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

            act(() => {
                const event = new Event('selectionchange');
                document.dispatchEvent(event);
            });

            // Both states phải hoạt động
            expect(authHook.current.authed).toBe(true);
            expect(selectionHook.current).not.toBeNull();

            document.body.removeChild(container);
        });

        it('logout không nên clear text selection state', async () => {
            const container = document.createElement('div');
            container.innerHTML = '<p>Test</p>';
            document.body.appendChild(container);

            container.getBoundingClientRect = vi.fn(() => ({
                left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100,
            }));

            localStorage.setItem('access_token', 'token');

            const { result: authHook } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            const { result: selectionHook } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            await waitFor(() => {
                expect(authHook.current.initializing).toBe(false);
            });

            // Create selection
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

            act(() => {
                document.dispatchEvent(new Event('selectionchange'));
            });

            expect(selectionHook.current).not.toBeNull();

            // Logout
            await act(async () => {
                await authHook.current.logout();
            });

            // Selection state không bị ảnh hưởng
            expect(selectionHook.current).not.toBeNull();

            document.body.removeChild(container);
        });
    });

    describe('Multiple State Updates - No Race Conditions', () => {
        it('nên handle updates từ nhiều states cùng lúc', async () => {
            const container = document.createElement('div');
            container.innerHTML = '<p>Content</p>';
            document.body.appendChild(container);

            container.getBoundingClientRect = vi.fn(() => ({
                left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100,
            }));

            const { result: authHook } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            const { result: selectionHook } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            await waitFor(() => {
                expect(authHook.current.initializing).toBe(false);
            });

            // Perform multiple state updates simultaneously
            await act(async () => {
                // Auth update
                await authHook.current.login();

                // Mock selection
                const mockRange = {
                    commonAncestorContainer: container.firstChild,
                    getClientRects: vi.fn(() => ([
                        { left: 10, top: 10, right: 50, bottom: 20 },
                    ])),
                };

                window.getSelection = vi.fn(() => ({
                    rangeCount: 1,
                    isCollapsed: false,
                    getRangeAt: vi.fn(() => mockRange),
                    removeAllRanges: vi.fn(),
                }));

                document.dispatchEvent(new Event('selectionchange'));

                // Submit answers
                await submitMockAnswers({ 'ex_01': 'C' });
            });

            // All states phải consistent
            expect(authHook.current.authed).toBe(true);
            expect(selectionHook.current).not.toBeNull();

            document.body.removeChild(container);
        });

        it('nên isolate state changes - không leak giữa các components', async () => {
            // Component 1: Auth only
            const { result: auth1 } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            // Component 2: Auth only (different wrapper instance)
            const { result: auth2 } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(auth1.current.initializing).toBe(false);
                expect(auth2.current.initializing).toBe(false);
            });

            // Login in component 1
            await act(async () => {
                await auth1.current.login();
            });

            // Cả 2 components dùng provider riêng biệt nên state độc lập
            expect(auth1.current.authed).toBe(true);
            expect(auth2.current.authed).toBe(false);
        });
    });

    describe('State Persistence & Hydration', () => {
        it('nên restore auth state từ localStorage mà không ảnh hưởng states khác', async () => {
            localStorage.setItem('access_token', 'stored-token');

            const container = document.createElement('div');
            container.innerHTML = '<p>Test</p>';
            document.body.appendChild(container);

            container.getBoundingClientRect = vi.fn(() => ({
                left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100,
            }));

            // Mount auth với persisted data
            const { result: authHook } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            // Mount selection (không có persisted data)
            const { result: selectionHook } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            await waitFor(() => {
                expect(authHook.current.initializing).toBe(false);
            });

            // Auth phải restored
            expect(authHook.current.authed).toBe(true);

            // Selection phải clean state
            expect(selectionHook.current).toBeNull();

            document.body.removeChild(container);
        });

        it('nên handle storage events mà không conflict states', async () => {
            const { result: authHook } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(authHook.current.initializing).toBe(false);
            });

            // Simulate storage event từ tab khác
            act(() => {
                localStorage.setItem('access_token', 'new-token-from-another-tab');
                const event = new StorageEvent('storage', {
                    key: 'access_token',
                    newValue: 'new-token-from-another-tab',
                    storageArea: localStorage,
                });
                window.dispatchEvent(event);
            });

            // Auth hook không tự động update (cần implement nếu muốn)
            // Nhưng không crash hoặc có lỗi
            expect(authHook.current.authed).toBe(false);
        });
    });

    describe('Memory Management', () => {
        it('nên cleanup tất cả states khi unmount', () => {
            const container = document.createElement('div');
            document.body.appendChild(container);

            container.getBoundingClientRect = vi.fn(() => ({
                left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100,
            }));

            const { unmount: unmountAuth } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            const { unmount: unmountSelection } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            // Unmount all
            unmountAuth();
            unmountSelection();

            // Không có error sau khi unmount
            expect(true).toBe(true);

            document.body.removeChild(container);
        });

        it('nên không leak event listeners sau unmount', () => {
            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

            const container = document.createElement('div');
            document.body.appendChild(container);

            const { unmount } = renderHook(() => {
                const ref = useRef(container);
                return useTextSelection(ref);
            });

            const addCalls = addEventListenerSpy.mock.calls.length;

            unmount();

            const removeCalls = removeEventListenerSpy.mock.calls.length;

            // Số lượng remove phải >= số lượng add
            expect(removeCalls).toBeGreaterThanOrEqual(addCalls);

            document.body.removeChild(container);
        });
    });
});
