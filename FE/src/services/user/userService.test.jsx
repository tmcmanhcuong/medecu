import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import {
    createUser,
    registerUser,
    updateUser,
    authenticateUser,
    loginUser,
    deleteUser
} from './userService.jsx';

// Mock axios
vi.mock('axios');

describe('User Service', () => {
    beforeEach(() => {
        // Reset mocks trước mỗi test
        vi.clearAllMocks();
    });

    describe('createUser', () => {
        it('should create a user successfully', async () => {
            const mockUserData = {
                username: 'testuser',
                email: 'test@example.com',
                full_name: 'Test User'
            };

            const mockResponse = {
                data: {
                    message: 'User created successfully',
                    data: {
                        ...mockUserData,
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        created_at: '2026-01-18T00:00:00Z',
                        updated_at: '2026-01-18T00:00:00Z'
                    }
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            const result = await createUser(mockUserData);

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/users/'),
                mockUserData,
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle validation errors', async () => {
            const mockError = {
                response: {
                    data: {
                        detail: [
                            { loc: ['email'], msg: 'Invalid email format', type: 'value_error' }
                        ]
                    }
                }
            };

            axios.post.mockRejectedValue(mockError);

            await expect(createUser({ username: 'test' }))
                .rejects
                .toThrow('Invalid email format');
        });

        it('should handle network errors', async () => {
            axios.post.mockRejectedValue(new Error('Network Error'));

            await expect(createUser({ username: 'test' }))
                .rejects
                .toThrow('Network Error');
        });
    });

    describe('registerUser', () => {
        it('should register a user successfully', async () => {
            const mockResponse = {
                data: {
                    message: 'User created successfully',
                    data: {
                        username: 'newuser',
                        email: 'new@example.com',
                        full_name: 'New User',
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        created_at: '2026-01-18T00:00:00Z',
                        updated_at: '2026-01-18T00:00:00Z'
                    }
                }
            };

            axios.post.mockResolvedValue(mockResponse);

            const result = await registerUser('newuser', 'new@example.com', 'New User');

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/users/'),
                {
                    username: 'newuser',
                    email: 'new@example.com',
                    full_name: 'New User'
                },
                expect.any(Object)
            );
            expect(result).toEqual(mockResponse.data);
        });
    });

    describe('updateUser', () => {
        it('should update a user successfully', async () => {
            const userId = '123e4567-e89b-12d3-a456-426614174000';
            const updateData = {
                email: 'updated@example.com',
                full_name: 'Updated Name'
            };

            const mockResponse = {
                data: {
                    message: 'User updated successfully',
                    data: {
                        username: 'testuser',
                        ...updateData,
                        id: userId,
                        created_at: '2026-01-18T00:00:00Z',
                        updated_at: '2026-01-18T01:00:00Z'
                    }
                }
            };

            axios.patch.mockResolvedValue(mockResponse);

            const result = await updateUser(userId, updateData);

            expect(axios.patch).toHaveBeenCalledWith(
                expect.stringContaining(`/users/${userId}`),
                updateData,
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle update errors', async () => {
            const mockError = {
                response: {
                    data: {
                        detail: [
                            { loc: ['email'], msg: 'Email already exists', type: 'value_error' }
                        ]
                    }
                }
            };

            axios.patch.mockRejectedValue(mockError);

            await expect(updateUser('123', { email: 'test@example.com' }))
                .rejects
                .toThrow('Email already exists');
        });
    });

    describe('authenticateUser', () => {
        it('should authenticate user and return token', async () => {
            const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
            const mockResponse = {
                data: mockToken
            };

            axios.post.mockResolvedValue(mockResponse);

            const result = await authenticateUser('test@example.com', 'password123');

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/users/authenticate'),
                {
                    email: 'test@example.com',
                    password: 'password123'
                },
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            expect(result).toBe(mockToken);
        });

        it('should handle authentication errors', async () => {
            const mockError = {
                response: {
                    data: {
                        detail: [
                            { loc: ['password'], msg: 'Invalid credentials', type: 'value_error' }
                        ]
                    }
                }
            };

            axios.post.mockRejectedValue(mockError);

            await expect(authenticateUser('test@example.com', 'wrongpassword'))
                .rejects
                .toThrow('Invalid credentials');
        });
    });

    describe('loginUser', () => {
        it('should call authenticateUser', async () => {
            const mockToken = 'token123';
            const mockResponse = {
                data: mockToken
            };

            axios.post.mockResolvedValue(mockResponse);

            const result = await loginUser('test@example.com', 'password123');

            expect(result).toBe(mockToken);
        });
    });

    describe('deleteUser', () => {
        it('should delete a user successfully', async () => {
            const userId = '123e4567-e89b-12d3-a456-426614174000';
            const mockResponse = {
                data: {
                    message: 'User deleted successfully',
                    data: {}
                }
            };

            axios.delete.mockResolvedValue(mockResponse);

            const result = await deleteUser(userId);

            expect(axios.delete).toHaveBeenCalledWith(
                expect.stringContaining(`/users/${userId}`),
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' }
                })
            );
            expect(result).toEqual(mockResponse.data);
        });

        it('should handle delete errors', async () => {
            const mockError = {
                response: {
                    data: {
                        detail: [
                            { loc: ['user_id'], msg: 'User not found', type: 'value_error' }
                        ]
                    }
                }
            };

            axios.delete.mockRejectedValue(mockError);

            await expect(deleteUser('invalid-id'))
                .rejects
                .toThrow('User not found');
        });
    });

    describe('Error handling', () => {
        it('should handle errors with message property', async () => {
            const mockError = {
                response: {
                    data: {
                        message: 'Custom error message'
                    }
                }
            };

            axios.post.mockRejectedValue(mockError);

            await expect(createUser({ username: 'test' }))
                .rejects
                .toThrow('Custom error message');
        });

        it('should handle errors without response data', async () => {
            const mockError = new Error('Connection timeout');

            axios.post.mockRejectedValue(mockError);

            await expect(createUser({ username: 'test' }))
                .rejects
                .toThrow('Connection timeout');
        });

        it('should handle multiple validation errors', async () => {
            const mockError = {
                response: {
                    data: {
                        detail: [
                            { loc: ['email'], msg: 'Invalid email', type: 'value_error' },
                            { loc: ['username'], msg: 'Username too short', type: 'value_error' }
                        ]
                    }
                }
            };

            axios.post.mockRejectedValue(mockError);

            await expect(createUser({ username: 'a' }))
                .rejects
                .toThrow('Invalid email, Username too short');
        });
    });
});
