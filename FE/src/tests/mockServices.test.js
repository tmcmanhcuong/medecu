import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    mockExercises,
    mockJob,
    getMockJob,
    submitMockAnswers,
    getMockAnalysis,
    mockUsers,
    mockLogin,
    mockSignup,
    mockNotes,
    mockFlashcard,
    mockQuizz,
} from '@/services/mock.jsx';

/**
 * Test Suite: Mock Data State Consistency
 * 
 * Mục đích: Đảm bảo mock data không bị mutation và các functions
 * không modify global state
 */
describe('Mock Services - State Consistency', () => {
    let originalExercises;
    let originalUsers;
    let originalNotes;

    beforeEach(() => {
        // Lưu bản copy của data gốc
        originalExercises = JSON.parse(JSON.stringify(mockExercises));
        originalUsers = JSON.parse(JSON.stringify(mockUsers));
        originalNotes = JSON.parse(JSON.stringify(mockNotes));
    });

    describe('Mock Exercises State', () => {
        it('nên không mutate mockExercises khi gọi getMockJob', async () => {
            await getMockJob();

            expect(mockExercises).toEqual(originalExercises);
        });

        it('nên không mutate mockExercises khi submit answers', async () => {
            const answers = {
                'ex_01': 'C',
                'ex_02': 'B',
            };

            await submitMockAnswers(answers);

            // mockExercises phải không thay đổi
            expect(mockExercises).toEqual(originalExercises);
        });

        it('nên handle empty answers object', async () => {
            const result = await submitMockAnswers({});

            expect(result.summary.correct).toBe(0);
            expect(result.summary.total).toBe(mockExercises.length);
            expect(result.results.every(r => r.error === 'Chưa chọn đáp án')).toBe(true);
        });

        it('nên calculate correct answers chính xác', async () => {
            const answers = {
                'ex_01': 'C', // Correct
                'ex_02': 'B', // Correct
                'ex_03': 'B', // Correct
                'ex_04': 'B', // Correct
            };

            const result = await submitMockAnswers(answers);

            expect(result.summary.correct).toBe(4);
            expect(result.summary.total).toBe(4);
            expect(result.results.every(r => r.is_correct)).toBe(true);
        });
    });

    describe('Mock Users State - Authentication', () => {
        it('nên không mutate mockUsers khi login', async () => {
            await mockLogin('student@example.com', '123456');

            expect(mockUsers).toEqual(originalUsers);
        });

        it('nên reject với invalid credentials', async () => {
            try {
                await mockLogin('invalid@example.com', 'wrong');
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).toContain('Sai email hoặc mật khẩu');
            }
        });

        it('nên case-insensitive cho email', async () => {
            const result1 = await mockLogin('STUDENT@EXAMPLE.COM', '123456');
            const result2 = await mockLogin('student@example.com', '123456');

            expect(result1.user.email).toBe(result2.user.email.toLowerCase());
        });

        it('nên không trả về password trong response', async () => {
            const result = await mockLogin('student@example.com', '123456');

            expect(result.user.password).toBeUndefined();
            expect(result.user).toHaveProperty('id');
            expect(result.user).toHaveProperty('email');
            expect(result.user).toHaveProperty('role');
            expect(result.token).toBeDefined();
        });
    });

    describe('Mock Signup State', () => {
        it('nên thêm user mới vào mockUsers array', async () => {
            const initialLength = mockUsers.length;

            await mockSignup('newuser@example.com', 'password123', 'student');

            expect(mockUsers.length).toBe(initialLength + 1);
        });

        it('nên reject khi email đã tồn tại', async () => {
            try {
                await mockSignup('student@example.com', '123456');
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).toContain('Email đã được đăng ký');
            }
        });

        it('nên tạo unique ID và token cho user mới', async () => {
            const result1 = await mockSignup('user1@example.com', 'pass');

            // Wait một chút để đảm bảo timestamp khác
            await new Promise(resolve => setTimeout(resolve, 10));

            const result2 = await mockSignup('user2@example.com', 'pass');

            expect(result1.user.id).not.toBe(result2.user.id);
            expect(result1.token).not.toBe(result2.token);
        });

        it('nên không trả về password trong signup response', async () => {
            const result = await mockSignup('test@example.com', 'password');

            expect(result.user.password).toBeUndefined();
            expect(result.user).toHaveProperty('id');
            expect(result.user).toHaveProperty('email');
            expect(result.token).toBeDefined();
        });
    });

    describe('Mock Analysis State', () => {
        it('nên không mutate mockExercises khi get analysis', async () => {
            const answers = {
                'ex_01': 'C',
                'ex_02': 'A',
            };

            await getMockAnalysis(answers);

            expect(mockExercises).toEqual(originalExercises);
        });

        it('nên return insights, recommendations, và next_actions', async () => {
            const result = await getMockAnalysis({});

            expect(result).toHaveProperty('insights');
            expect(result).toHaveProperty('recommendations');
            expect(result).toHaveProperty('next_actions');
            expect(Array.isArray(result.insights)).toBe(true);
            expect(Array.isArray(result.recommendations)).toBe(true);
            expect(Array.isArray(result.next_actions)).toBe(true);
        });

        it('nên calculate correct count trong insights', async () => {
            const answers = {
                'ex_01': 'C', // Correct
                'ex_02': 'B', // Correct
            };

            const result = await getMockAnalysis(answers);

            expect(result.insights[0]).toContain('2/4');
        });
    });

    describe('State Isolation Between Functions', () => {
        it('các functions không nên share mutable state', async () => {
            // Call multiple functions
            await getMockJob();
            await submitMockAnswers({ 'ex_01': 'A' });
            await getMockAnalysis({ 'ex_01': 'C' });
            await mockLogin('student@example.com', '123456');

            // All original data phải còn nguyên
            expect(mockExercises).toEqual(originalExercises);
            expect(mockNotes).toEqual(originalNotes);
        });

        it('concurrent calls không nên conflict', async () => {
            const promises = [
                submitMockAnswers({ 'ex_01': 'A' }),
                submitMockAnswers({ 'ex_01': 'B' }),
                submitMockAnswers({ 'ex_01': 'C' }),
                getMockAnalysis({ 'ex_01': 'A' }),
                getMockAnalysis({ 'ex_01': 'C' }),
            ];

            const results = await Promise.all(promises);

            // Mỗi result phải độc lập
            expect(results[0].results[0].selected_answer).toBe('A');
            expect(results[1].results[0].selected_answer).toBe('B');
            expect(results[2].results[0].selected_answer).toBe('C');

            // Original data không đổi
            expect(mockExercises).toEqual(originalExercises);
        });
    });

    describe('Mock Data Structure Validation', () => {
        it('mockExercises nên có cấu trúc đúng', () => {
            mockExercises.forEach(exercise => {
                expect(exercise).toHaveProperty('id');
                expect(exercise).toHaveProperty('prompt');
                expect(exercise).toHaveProperty('options');
                expect(exercise).toHaveProperty('correct_answer');
                expect(exercise).toHaveProperty('explanation');
                expect(exercise).toHaveProperty('difficulty');
                expect(exercise).toHaveProperty('tags');
                expect(Array.isArray(exercise.options)).toBe(true);
                expect(Array.isArray(exercise.tags)).toBe(true);
            });
        });

        it('mockNotes nên có cấu trúc đúng', () => {
            mockNotes.forEach(note => {
                expect(note).toHaveProperty('id');
                expect(note).toHaveProperty('id_user');
                expect(note).toHaveProperty('title');
                expect(note).toHaveProperty('content');
                expect(note).toHaveProperty('created_at');
                expect(note).toHaveProperty('updated_at');
                expect(note).toHaveProperty('description');
                expect(note).toHaveProperty('color');
                expect(note).toHaveProperty('attachments');
                expect(Array.isArray(note.attachments)).toBe(true);
            });
        });

        it('mockFlashcard nên có cấu trúc đúng', () => {
            mockFlashcard.forEach(flashcard => {
                expect(flashcard).toHaveProperty('type');
                expect(flashcard).toHaveProperty('owner');
                expect(flashcard).toHaveProperty('from_note');
                expect(flashcard).toHaveProperty('from_book');
                expect(flashcard).toHaveProperty('title');
                expect(flashcard).toHaveProperty('question');
                expect(Array.isArray(flashcard.question)).toBe(true);
            });
        });

        it('mockQuizz nên có cấu trúc đúng', () => {
            mockQuizz.forEach(quiz => {
                expect(quiz).toHaveProperty('type');
                expect(quiz).toHaveProperty('owner');
                expect(quiz).toHaveProperty('question');
                expect(Array.isArray(quiz.question)).toBe(true);

                quiz.question.forEach(q => {
                    expect(q).toHaveProperty('question');
                    expect(q).toHaveProperty('a');
                    expect(q).toHaveProperty('b');
                    expect(q).toHaveProperty('c');
                    expect(q).toHaveProperty('d');
                    expect(q).toHaveProperty('anwser');
                });
            });
        });
    });

    describe('Immutability Tests', () => {
        it('không thể mutate mockExercises từ returned data', async () => {
            const job = await getMockJob();

            // Try to mutate returned exercises
            job.result_payload.exercises[0].prompt = 'Modified';

            // Original phải không đổi
            expect(mockExercises[0].prompt).not.toBe('Modified');
            expect(mockExercises).toEqual(originalExercises);
        });

        it('không thể mutate returned results từ submitAnswers', async () => {
            const result = await submitMockAnswers({ 'ex_01': 'C' });

            // Try to mutate
            result.results[0].is_correct = false;

            // Call lại phải return consistent results
            const result2 = await submitMockAnswers({ 'ex_01': 'C' });
            expect(result2.results[0].is_correct).toBe(true);
        });
    });
});
