import { describe, it, expect, vi } from 'vitest';
import {
    generateQuizAndFlashcard,
    extractQuizQuestions,
    extractFlashcardQuestions,
    updateQuizAnswer,
    checkQuizAnswer,
    calculateQuizScore,
    chatWithRAG,
    extractChatOutput,
    extractIntermediateSteps,
    extractSourceDocuments,
    formatChatResponse,
    generateOutline,
    extractOutlineText,
    extractBubbleCitations,
    removeBubbleCitations
} from './aiService';

// Mock fetch globally
global.fetch = vi.fn();

describe('quizService', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        vi.clearAllMocks();
    });

    describe('generateQuizAndFlashcard', () => {
        it('should successfully generate quiz and flashcard', async () => {
            const mockResponse = [
                {
                    output: {
                        owner: "system",
                        items: [
                            {
                                type: "quiz",
                                questions: [
                                    {
                                        id: "q1",
                                        question: "Test question?",
                                        done: false,
                                        options: {
                                            a: "Option A",
                                            b: "Option B",
                                            c: "Option C",
                                            d: "Option D"
                                        },
                                        answer: "b",
                                        latest_answer: null,
                                        explanation: "Test explanation"
                                    }
                                ]
                            },
                            {
                                type: "flashcard",
                                questions: [
                                    {
                                        id: "f1",
                                        question: "What is Random Forest?",
                                        explanation: "An ensemble learning algorithm."
                                    }
                                ]
                            }
                        ]
                    }
                }
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            const result = await generateQuizAndFlashcard('test prompt');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('generating-quizz-and-answer'),
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'user-prompt': 'test prompt'
                    }),
                })
            );

            expect(result).toEqual(mockResponse);
        });

        it('should throw error when API request fails', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ detail: 'Internal Server Error' }),
            });

            await expect(generateQuizAndFlashcard("hãy tạo câu hỏi về Random Forest for Stock Price Prediction")).rejects.toThrow();
        });
    });

    describe('extractQuizQuestions', () => {
        it('should extract quiz questions from API response', () => {
            const mockResponse = [
                {
                    output: {
                        items: [
                            {
                                type: "quiz",
                                questions: [
                                    { id: "q1", question: "Question 1?" },
                                    { id: "q2", question: "Question 2?" }
                                ]
                            }
                        ]
                    }
                }
            ];

            const questions = extractQuizQuestions(mockResponse);
            expect(questions).toHaveLength(2);
            expect(questions[0].id).toBe('q1');
        });

        it('should return empty array for invalid response', () => {
            const questions = extractQuizQuestions({});
            expect(questions).toEqual([]);
        });
    });

    describe('extractFlashcardQuestions', () => {
        it('should extract flashcard questions from API response', () => {
            const mockResponse = [
                {
                    output: {
                        items: [
                            {
                                type: "flashcard",
                                questions: [
                                    { id: "f1", question: "Flashcard 1?" }
                                ]
                            }
                        ]
                    }
                }
            ];

            const flashcards = extractFlashcardQuestions(mockResponse);
            expect(flashcards).toHaveLength(1);
            expect(flashcards[0].id).toBe('f1');
        });
    });

    describe('updateQuizAnswer', () => {
        it('should update quiz answer correctly', () => {
            const questions = [
                { id: "q1", question: "Test?", done: false, latest_answer: null },
                { id: "q2", question: "Test 2?", done: false, latest_answer: null }
            ];

            const updated = updateQuizAnswer(questions, 'q1', 'b');

            expect(updated[0].latest_answer).toBe('b');
            expect(updated[0].done).toBe(true);
            expect(updated[1].latest_answer).toBe(null);
        });
    });

    describe('checkQuizAnswer', () => {
        it('should return true for correct answer', () => {
            const question = { id: "q1", answer: "b" };
            expect(checkQuizAnswer(question, 'b')).toBe(true);
        });

        it('should return false for incorrect answer', () => {
            const question = { id: "q1", answer: "b" };
            expect(checkQuizAnswer(question, 'a')).toBe(false);
        });
    });

    describe('calculateQuizScore', () => {
        it('should calculate score correctly', () => {
            const questions = [
                { id: "q1", answer: "b", latest_answer: "b" },
                { id: "q2", answer: "a", latest_answer: "c" },
                { id: "q3", answer: "d", latest_answer: "d" },
            ];

            const score = calculateQuizScore(questions);

            expect(score.correct).toBe(2);
            expect(score.total).toBe(3);
            expect(score.percentage).toBe(67); // 2/3 = 66.67% rounded to 67
        });

        it('should handle empty questions array', () => {
            const score = calculateQuizScore([]);
            expect(score.correct).toBe(0);
            expect(score.total).toBe(0);
            expect(score.percentage).toBe(0);
        });
    });

    describe('chatWithRAG', () => {
        it('should successfully chat with RAG', async () => {
            const mockResponse = [
                {
                    output: "**Thông tin về Random Forest**\n\nRandom Forest là một phương pháp học máy...",
                    intermediateSteps: [
                        {
                            action: {
                                tool: "Postgres_PGVector_Store2",
                                toolInput: {
                                    input: "Random Forest for Stock Price Prediction"
                                }
                            },
                            observation: '[{"response":[{"type":"text","text":"{\\"pageContent\\":\\"Random Forest content...\\",\\"metadata\\":{},\\"id\\":\\"123\\"}"}]}]'
                        }
                    ]
                }
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            const result = await chatWithRAG('test prompt');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('chat-with-rag'),
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'user-prompt': 'test prompt'
                    }),
                })
            );

            expect(result).toEqual(mockResponse);
        });

        it('should throw error when RAG API request fails', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ detail: 'Internal Server Error' }),
            });

            await expect(chatWithRAG('test prompt')).rejects.toThrow();
        });
    });

    describe('extractChatOutput', () => {
        it('should extract chat output from API response', () => {
            const mockResponse = [
                {
                    output: "This is the AI response",
                    intermediateSteps: []
                }
            ];

            const output = extractChatOutput(mockResponse);
            expect(output).toBe("This is the AI response");
        });

        it('should return empty string for invalid response', () => {
            const output = extractChatOutput({});
            expect(output).toBe('');
        });
    });

    describe('extractIntermediateSteps', () => {
        it('should extract intermediate steps from API response', () => {
            const mockResponse = [
                {
                    output: "Response",
                    intermediateSteps: [
                        { action: { tool: "test" }, observation: "data" }
                    ]
                }
            ];

            const steps = extractIntermediateSteps(mockResponse);
            expect(steps).toHaveLength(1);
            expect(steps[0].action.tool).toBe('test');
        });

        it('should return empty array for invalid response', () => {
            const steps = extractIntermediateSteps({});
            expect(steps).toEqual([]);
        });
    });

    describe('extractSourceDocuments', () => {
        it('should extract source documents from intermediate steps', () => {
            const mockSteps = [
                {
                    observation: '[{"response":[{"type":"text","text":"{\\"pageContent\\":\\"Test content\\",\\"metadata\\":{},\\"id\\":\\"123\\"}"}]}]'
                }
            ];

            const sources = extractSourceDocuments(mockSteps);
            expect(sources).toHaveLength(1);
            expect(sources[0].content).toBe('Test content');
            expect(sources[0].id).toBe('123');
        });

        it('should handle invalid intermediate steps', () => {
            const sources = extractSourceDocuments([{ observation: 'invalid json' }]);
            expect(sources).toEqual([]);
        });

        it('should return empty array for empty steps', () => {
            const sources = extractSourceDocuments([]);
            expect(sources).toEqual([]);
        });
    });

    describe('formatChatResponse', () => {
        it('should format chat response with sources', () => {
            const mockResponse = [
                {
                    output: "AI response",
                    intermediateSteps: [
                        {
                            observation: '[{"response":[{"type":"text","text":"{\\"pageContent\\":\\"Source content\\",\\"metadata\\":{},\\"id\\":\\"456\\"}"}]}]'
                        }
                    ]
                }
            ];

            const formatted = formatChatResponse(mockResponse);
            expect(formatted.output).toBe("AI response");
            expect(formatted.sources).toHaveLength(1);
            expect(formatted.hasSource).toBe(true);
        });

        it('should handle response without sources', () => {
            const mockResponse = [
                {
                    output: "AI response",
                    intermediateSteps: []
                }
            ];

            const formatted = formatChatResponse(mockResponse);
            expect(formatted.output).toBe("AI response");
            expect(formatted.sources).toEqual([]);
            expect(formatted.hasSource).toBe(false);
        });
    });

    describe('generateOutline', () => {
        it('should successfully generate outline', async () => {
            const mockResponse = {
                text: "# GraphRAG: Giải quyết bài toán tổng hợp tri thức toàn diện\n\nBài viết giới thiệu GraphRAG..."
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            const result = await generateOutline(
                'The use of retrieval-augmented generation (RAG)...',
                '# Project Phoenix Kickoff\n\nThis document outlines...'
            );

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('outline'),
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        content: 'The use of retrieval-augmented generation (RAG)...',
                        style: '# Project Phoenix Kickoff\n\nThis document outlines...'
                    }),
                })
            );

            expect(result).toEqual(mockResponse);
        });

        it('should work without style parameter', async () => {
            const mockResponse = {
                text: "Summary text"
            };

            global.fetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            const result = await generateOutline('Content to summarize');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    body: JSON.stringify({
                        content: 'Content to summarize',
                        style: ''
                    }),
                })
            );

            expect(result).toEqual(mockResponse);
        });

        it('should throw error when outline API request fails', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ detail: 'Internal Server Error' }),
            });

            await expect(generateOutline('test content')).rejects.toThrow();
        });
    });

    describe('extractOutlineText', () => {
        it('should extract outline text from API response', () => {
            const mockResponse = {
                text: "# Summary\n\nThis is the summary text."
            };

            const text = extractOutlineText(mockResponse);
            expect(text).toBe("# Summary\n\nThis is the summary text.");
        });

        it('should return empty string for invalid response', () => {
            const text = extractOutlineText({});
            expect(text).toBe('');
        });
    });

    describe('extractBubbleCitations', () => {
        it('should extract bubble citations from text', () => {
            const text = "This is a test {{BUBBLE:1:![/page/0/Text/2]}} with multiple {{BUBBLE:2:![/page/1/Text/1]}} bubbles.";

            const bubbles = extractBubbleCitations(text);
            expect(bubbles).toHaveLength(2);
            expect(bubbles[0]).toEqual({
                id: '1',
                citation: '![/page/0/Text/2]'
            });
            expect(bubbles[1]).toEqual({
                id: '2',
                citation: '![/page/1/Text/1]'
            });
        });

        it('should return empty array when no bubbles found', () => {
            const text = "This is a test without bubbles.";
            const bubbles = extractBubbleCitations(text);
            expect(bubbles).toEqual([]);
        });

        it('should handle complex citation formats', () => {
            const text = "Test {{BUBBLE:3:![250117366v2-/page/0/SectionHeader/1]}} citation.";
            const bubbles = extractBubbleCitations(text);
            expect(bubbles).toHaveLength(1);
            expect(bubbles[0]).toEqual({
                id: '3',
                citation: '![250117366v2-/page/0/SectionHeader/1]'
            });
        });
    });

    describe('removeBubbleCitations', () => {
        it('should remove bubble citations from text', () => {
            const text = "This is a test {{BUBBLE:1:![/page/0/Text/2]}} with bubbles {{BUBBLE:2:![/page/1/Text/1]}} removed.";
            const cleanText = removeBubbleCitations(text);
            expect(cleanText).toBe("This is a test  with bubbles  removed.");
        });

        it('should return original text when no bubbles present', () => {
            const text = "This is a test without bubbles.";
            const cleanText = removeBubbleCitations(text);
            expect(cleanText).toBe("This is a test without bubbles.");
        });

        it('should handle empty string', () => {
            const cleanText = removeBubbleCitations('');
            expect(cleanText).toBe('');
        });
    });
});
