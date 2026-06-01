import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '@/hooks/useAuth.jsx';
import useAuth from '@/hooks/useAuth.jsx';

/**
 * Test Suite: Authentication State Management
 * 
 * Mục đích: Đảm bảo authentication state hoạt động đúng và không bị conflict
 * với các state khác trong ứng dụng
 */
describe('useAuth Hook - State Management', () => {
    beforeEach(() => {
        // Clear localStorage trước mỗi test
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('Initial State', () => {
        it('nên khởi tạo với state chưa xác thực khi không có token', async () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            // Chờ initialization hoàn tất (skip checking initial state vì async)
            await waitFor(() => {
                expect(result.current.initializing).toBe(false);
            });

            // Xác nhận chưa được xác thực
            expect(result.current.authed).toBe(false);
        });

        it('nên khởi tạo với state đã xác thực khi có token trong localStorage', async () => {
            // Set token trước khi render
            localStorage.setItem('access_token', 'mock-token-123');

            const { result } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            // Chờ initialization hoàn tất
            await waitFor(() => {
                expect(result.current.initializing).toBe(false);
            });

            // Xác nhận đã được xác thực
            expect(result.current.authed).toBe(true);
        });
    });

    describe('Login Action', () => {
        it('nên cập nhật state sang authed khi login thành công', async () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            // Chờ initialization
            await waitFor(() => {
                expect(result.current.initializing).toBe(false);
            });

            // Kiểm tra state ban đầu
            expect(result.current.authed).toBe(false);

            // Thực hiện login
            await act(async () => {
                await result.current.login();
            });

            // Kiểm tra state sau khi login
            expect(result.current.authed).toBe(true);
        });

        it('nên giữ nguyên initializing state sau khi login', async () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(result.current.initializing).toBe(false);
            });

            await act(async () => {
                await result.current.login();
            });

            // initializing phải vẫn là false
            expect(result.current.initializing).toBe(false);
        });
    });

    describe('Logout Action', () => {
        it('nên cập nhật state về chưa xác thực khi logout', async () => {
            localStorage.setItem('access_token', 'mock-token-123');

            const { result } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(result.current.initializing).toBe(false);
            });

            expect(result.current.authed).toBe(true);

            // Thực hiện logout
            await act(async () => {
                await result.current.logout();
            });

            expect(result.current.authed).toBe(false);
        });
    });

    describe('State Isolation - Tránh chồng chéo', () => {
        it('nên không bị ảnh hưởng bởi multiple instances cùng lúc', async () => {
            // Render 2 instances của hook
            const { result: result1 } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            const { result: result2 } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(result1.current.initializing).toBe(false);
                expect(result2.current.initializing).toBe(false);
            });

            // Login ở instance 1
            await act(async () => {
                await result1.current.login();
            });

            // NOTE: Các renderHook riêng biệt tạo separate provider instances
            // nên chúng KHÔNG share state. Chỉ check result1
            expect(result1.current.authed).toBe(true);
            // result2 không share context với result1
            expect(result2.current.authed).toBe(false);
        });

        it('nên reset state hoàn toàn khi logout', async () => {
            localStorage.setItem('access_token', 'mock-token');
            localStorage.setItem('user_data', JSON.stringify({ id: 1, name: 'Test' }));

            const { result } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(result.current.initializing).toBe(false);
            });

            await act(async () => {
                await result.current.logout();
            });

            // State phải clean
            expect(result.current.authed).toBe(false);
            expect(result.current.initializing).toBe(false);
        });

        it('nên không bị leak state giữa các lần mount/unmount', async () => {
            // Mount lần 1
            const { result: result1, unmount } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(result1.current.initializing).toBe(false);
            });

            await act(async () => {
                await result1.current.login();
            });

            expect(result1.current.authed).toBe(true);

            // Unmount
            unmount();

            // Mount lần 2 - state phải là fresh instance
            const { result: result2 } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            // initializing có thể đã complete (async behavior)
            // Just wait for it to be false

            await waitFor(() => {
                expect(result2.current.initializing).toBe(false);
            });

            // authed phải là false vì không có token
            expect(result2.current.authed).toBe(false);
        });
    });

    describe('Concurrent State Updates', () => {
        it('nên xử lý được nhiều login/logout liên tiếp', async () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(result.current.initializing).toBe(false);
            });

            // Thực hiện nhiều action liên tiếp
            await act(async () => {
                await result.current.login();
                await result.current.logout();
                await result.current.login();
            });

            // State cuối cùng phải đúng
            expect(result.current.authed).toBe(true);
        });

        it('nên handle race condition khi login đồng thời', async () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: AuthProvider,
            });

            await waitFor(() => {
                expect(result.current.initializing).toBe(false);
            });

            // Gọi login nhiều lần đồng thời
            await act(async () => {
                await Promise.all([
                    result.current.login(),
                    result.current.login(),
                    result.current.login(),
                ]);
            });

            // State phải consistent
            expect(result.current.authed).toBe(true);
        });
    });
});
