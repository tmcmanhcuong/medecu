// VITE PROXY URLs ⭐ ĐANG SỬ DỤNG (Được load động từ biến môi trường .env)
const QUIZ_FLASH_API_URL = import.meta.env.VITE_QUIZ_FLASH_API_URL || '/n8n/webhook/970e5eb7-c672-475e-9e8c-5e49967d2718/learning';
const CHAT_RAG_API_URL = import.meta.env.VITE_CHAT_RAG_API_URL || '/n8n/webhook/f75be7aa-52f0-496d-b8d6-31a1ec1afaaa/chat-with-rag/';
const OUTLINE_API_URL = import.meta.env.VITE_OUTLINE_API_URL || '/n8n/webhook/970e5eb7-c672-475e-9e8c-5e49967d2718/outline';


/*
 * Generate quiz questions based on selected notes
 * 
 * @param {Array<string>} notes - Array of note contents to generate quiz from
 * @returns {Promise<Array>} - Promise resolving to array of quiz questions
 * @throws {Error} - If the API request fails
 * 
 * @example
 * const quizQuestions = await generateQuiz(['Note content 1', 'Note content 2']);
 * console.log(quizQuestions); // Array of quiz questions with options and correct answers
 */
export async function generateQuiz(notes) {
    try {
        console.log('🎯 Generating quiz with notes:', notes.length, 'notes');

        const response = await fetch(QUIZ_FLASH_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: true, // true for quiz
                notes: notes
            }),
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            let errorData;
            let responseText;
            try {
                responseText = await response.text();
                console.error('❌ Error response text:', responseText);
                errorData = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${responseText || 'empty'}`);
            }

            if (errorData.detail) {
                const errorMessages = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : errorData.detail;
                throw new Error(`API error: ${errorMessages}`);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Quiz generated successfully');
        console.log('   Quiz questions:', data[0]?.output?.length || 0);

        return data[0]?.output || [];
    } catch (error) {
        console.error('❌ Error generating quiz:', error);
        console.error('   Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Generate flashcard questions based on selected notes
 * 
 * @param {Array<string>} notes - Array of note contents to generate flashcards from
 * @returns {Promise<Array>} - Promise resolving to array of flashcard questions
 * @throws {Error} - If the API request fails
 * 
 * @example
 * const flashcards = await generateFlashcard(['Note content 1', 'Note content 2']);
 * console.log(flashcards); // Array of flashcard questions with explanations
 */
export async function generateFlashcard(notes) {
    try {
        console.log('🎯 Generating flashcards with notes:', notes.length, 'notes');

        const response = await fetch(QUIZ_FLASH_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: false, // false for flashcard
                notes: notes
            }),
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            let errorData;
            let responseText;
            try {
                responseText = await response.text();
                console.error('❌ Error response text:', responseText);
                errorData = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${responseText || 'empty'}`);
            }

            if (errorData.detail) {
                const errorMessages = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : errorData.detail;
                throw new Error(`API error: ${errorMessages}`);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Flashcards generated successfully');
        console.log('   Flashcard questions:', data[0]?.output?.length || 0);

        return data[0]?.output || [];
    } catch (error) {
        console.error('❌ Error generating flashcards:', error);
        console.error('   Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

const normalizeGeneratedArtifactResponse = (responseData) => {
    const items = Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(responseData?.output)
            ? responseData.output
            : Array.isArray(responseData)
                ? responseData
                : [];

    return {
        items,
        cacheFile: responseData?.cache_file || responseData?.cacheFile || null,
        raw: responseData,
    };
};

async function postNotebookArtifact(endpoint, payload) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let errorData;
        let responseText;
        try {
            responseText = await response.text();
            errorData = JSON.parse(responseText);
        } catch {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const detail = errorData?.detail;
        const errorMessage = typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
                ? detail.map((err) => err.msg).join(', ')
                : `HTTP error! status: ${response.status}`;

        const apiError = new Error(errorMessage);
        apiError.status = response.status;
        apiError.detail = detail;
        throw apiError;
    }

    const data = await response.json();
    return normalizeGeneratedArtifactResponse(data);
}

export async function generateNotebookQuiz(
    chapterTitle,
    { limit = 5, userId = null, notebookId = null, sourceBookIds = [], sourceFileNames = [] } = {}
) {
    const uid = userId || getStoredUserId();
    return postNotebookArtifact('/ai/generating-quizz', {
        chapter_title: chapterTitle,
        notebook_id: notebookId,
        source_book_ids: sourceBookIds,
        source_file_names: sourceFileNames,
        limit,
        user_id: uid,
    });
}

export async function generateNotebookFlashcards(
    chapterTitle,
    { limit = 8, userId = null, notebookId = null, sourceBookIds = [], sourceFileNames = [] } = {}
) {
    const uid = userId || getStoredUserId();
    return postNotebookArtifact('/ai/generating-flashcard', {
        chapter_title: chapterTitle,
        notebook_id: notebookId,
        source_book_ids: sourceBookIds,
        source_file_names: sourceFileNames,
        limit,
        user_id: uid,
    });
}

/**
 * @deprecated Use generateQuiz() or generateFlashcard() instead
 * Generate quiz and flashcard questions based on chapter title/content
 * 
 * @param {string} chapterTitle - The chapter title or content to generate quiz/flashcard from
 * @returns {Promise<object>} - Promise resolving to the generated quiz/flashcard data
 * @throws {Error} - If the API request fails
 */
export async function generateQuizAndFlashcard(chapterTitle) {
    try {
        console.log('🎯 Generating quiz/flashcard with chapter title:', chapterTitle);

        const response = await fetch(QUIZ_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'chapter-title': chapterTitle
            }),
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);

        if (!response.ok) {
            let errorData;
            let responseText;
            try {
                responseText = await response.text();
                console.error('❌ Error response text:', responseText);
                errorData = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${responseText || 'empty'}`);
            }

            if (errorData.detail) {
                const errorMessages = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : errorData.detail;
                throw new Error(`API error: ${errorMessages}`);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get response text first to debug
        const responseText = await response.text();
        console.log('📄 Response text length:', responseText.length);
        console.log('📄 Response text preview:', responseText.substring(0, 200));

        // Parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Failed to parse JSON:', e);
            console.error('   Response text:', responseText);
            throw new Error(`Invalid JSON response: ${e.message}`);
        }

        console.log('✅ Quiz/Flashcard generated successfully');
        console.log('   Response structure:', Object.keys(data));
        console.log('   Quiz questions:', data[0]?.output?.items?.find(item => item.type === 'quiz')?.questions?.length || 0);
        console.log('   Flashcard questions:', data[0]?.output?.items?.find(item => item.type === 'flashcard')?.questions?.length || 0);

        return data;
    } catch (error) {
        console.error('❌ Error generating quiz/flashcard:', error);
        console.error('   Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Extract quiz questions from the API response
 * 
 * @param {object} apiResponse - The response from generateQuizAndFlashcard
 * @returns {Array} - Array of quiz questions
 * 
 * @example
 * const response = await generateQuizAndFlashcard('prompt');
 * const quizQuestions = extractQuizQuestions(response);
 */
export function extractQuizQuestions(apiResponse) {
    try {
        const items = apiResponse[0]?.output?.items || [];
        const quizItem = items.find(item => item.type === 'quiz');
        return quizItem?.questions || [];
    } catch (error) {
        console.error('❌ Error extracting quiz questions:', error);
        return [];
    }
}

/**
 * Extract flashcard questions from the API response
 * 
 * @param {object} apiResponse - The response from generateQuizAndFlashcard
 * @returns {Array} - Array of flashcard questions
 * 
 * @example
 * const response = await generateQuizAndFlashcard('prompt');
 * const flashcards = extractFlashcardQuestions(response);
 */
export function extractFlashcardQuestions(apiResponse) {
    try {
        const items = apiResponse[0]?.output?.items || [];
        const flashcardItem = items.find(item => item.type === 'flashcard');
        return flashcardItem?.questions || [];
    } catch (error) {
        console.error('❌ Error extracting flashcard questions:', error);
        return [];
    }
}

/**
 * Update a quiz question's answer
 * 
 * @param {Array} questions - Array of quiz questions
 * @param {string} questionId - The ID of the question to update
 * @param {string} answer - The user's answer (e.g., 'a', 'b', 'c', 'd')
 * @returns {Array} - Updated array of questions
 * 
 * @example
 * const updatedQuestions = updateQuizAnswer(questions, 'q1', 'b');
 */
export function updateQuizAnswer(questions, questionId, answer) {
    return questions.map(q => {
        if (q.id === questionId) {
            return {
                ...q,
                latest_answer: answer,
                done: true
            };
        }
        return q;
    });
}

/**
 * Check if a quiz answer is correct
 * 
 * @param {object} question - The quiz question object
 * @param {string} userAnswer - The user's answer
 * @returns {boolean} - True if correct, false otherwise
 * 
 * @example
 * const isCorrect = checkQuizAnswer(question, 'b');
 */
export function checkQuizAnswer(question, userAnswer) {
    return question.answer === userAnswer;
}

/**
 * Calculate quiz score
 * 
 * @param {Array} questions - Array of quiz questions with latest_answer filled
 * @returns {object} - Score object with correct, total, and percentage
 * 
 * @example
 * const score = calculateQuizScore(questions);
 * console.log(`Score: ${score.correct}/${score.total} (${score.percentage}%)`);
 */
export function calculateQuizScore(questions) {
    const total = questions.length;
    const correct = questions.filter(q => q.latest_answer === q.answer).length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
        correct,
        total,
        percentage
    };
}

/**
 * Chat with RAG (Retrieval-Augmented Generation) chatbot
 * 
 * @param {string} userPrompt - The user's question or prompt
 * @returns {Promise<object>} - Promise resolving to the chatbot response with RAG data
 * @throws {Error} - If the API request fails
 * 
 * @example
 * const result = await chatWithRAG('hãy cho biết thông tin về chủ đề Random Forest for Stock Price Prediction');
 * console.log(result[0].output); // AI response text
 * console.log(result[0].intermediateSteps); // RAG retrieval steps
 */
export async function chatWithRAG(userPrompt) {
    try {
        console.log('💬 Chatting with RAG, prompt:', userPrompt);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const response = await fetch(CHAT_RAG_API_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'user-prompt': userPrompt
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (errorData.detail) {
                const errorMessages = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : errorData.detail;
                throw new Error(`API error: ${errorMessages}`);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ RAG Chat response received');
        console.log('   Response length:', data[0]?.output?.length || 0, 'characters');
        console.log('   Intermediate steps:', data[0]?.intermediateSteps?.length || 0);

        return data;
    } catch (error) {
        console.error('❌ Error chatting with RAG:', error);
        console.error('   Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });

        // Better error messages
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - API mất quá lâu để phản hồi (>60s). Vui lòng thử lại.');
        } else if (error.message === 'Failed to fetch') {
            throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n• Kết nối mạng\n• CORS configuration\n• API endpoint có đang hoạt động không');
        } else {
            throw error;
        }
    }
}

/**
 * Extract the main output text from RAG chat response
 * 
 * @param {object} apiResponse - The response from chatWithRAG
 * @returns {string} - The AI-generated response text
 * 
 * @example
 * const response = await chatWithRAG('your question');
 * const text = extractChatOutput(response);
 */
export function extractChatOutput(apiResponse) {
    try {
        return apiResponse[0]?.output || '';
    } catch (error) {
        console.error('❌ Error extracting chat output:', error);
        return '';
    }
}

/**
 * Extract intermediate steps (RAG retrieval information) from chat response
 * 
 * @param {object} apiResponse - The response from chatWithRAG
 * @returns {Array} - Array of intermediate steps showing RAG retrieval process
 * 
 * @example
 * const response = await chatWithRAG('your question');
 * const steps = extractIntermediateSteps(response);
 */
export function extractIntermediateSteps(apiResponse) {
    try {
        return apiResponse[0]?.intermediateSteps || [];
    } catch (error) {
        console.error('❌ Error extracting intermediate steps:', error);
        return [];
    }
}

/**
 * Extract source documents from RAG intermediate steps
 * 
 * @param {Array} intermediateSteps - The intermediate steps from RAG response
 * @returns {Array} - Array of source documents with metadata
 * 
 * @example
 * const steps = extractIntermediateSteps(response);
 * const sources = extractSourceDocuments(steps);
 */
export function extractSourceDocuments(intermediateSteps) {
    try {
        const sources = [];

        for (const step of intermediateSteps) {
            if (step.observation) {
                try {
                    // Parse the observation which contains the response array
                    const observationData = JSON.parse(step.observation);

                    if (Array.isArray(observationData)) {
                        for (const item of observationData) {
                            if (item.response && Array.isArray(item.response)) {
                                for (const doc of item.response) {
                                    if (doc.type === 'text' && doc.text) {
                                        try {
                                            const parsedDoc = JSON.parse(doc.text);
                                            sources.push({
                                                content: parsedDoc.pageContent,
                                                metadata: parsedDoc.metadata,
                                                id: parsedDoc.id
                                            });
                                        } catch (e) {
                                            // Skip if can't parse document
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Could not parse observation:', e);
                }
            }
        }

        return sources;
    } catch (error) {
        console.error('❌ Error extracting source documents:', error);
        return [];
    }
}

/**
 * Format chat response for display with sources
 * 
 * @param {object} apiResponse - The response from chatWithRAG
 * @returns {object} - Formatted response with output and sources
 * 
 * @example
 * const response = await chatWithRAG('your question');
 * const formatted = formatChatResponse(response);
 * console.log(formatted.output); // Main AI response
 * console.log(formatted.sources); // Source documents
 */
export function formatChatResponse(apiResponse) {
    const output = extractChatOutput(apiResponse);
    const steps = extractIntermediateSteps(apiResponse);
    const sources = extractSourceDocuments(steps);

    return {
        output,
        sources,
        hasSource: sources.length > 0
    };
}

/**
 * Generate an outline/summary from content with optional style template
 * 
 * @param {string} content - The content to summarize
 * @param {string} style - Optional style template with bubble citations (e.g., {{BUBBLE:1:![/page/0/Text/2]}})
 * @returns {Promise<object>} - Promise resolving to the outline/summary response
 * @throws {Error} - If the API request fails
 * 
 * @example
 * const result = await generateOutline(
 *     'The use of retrieval-augmented generation (RAG)...',
 *     '# Project Phoenix Kickoff\n\nThis document outlines...'
 * );
 * console.log(result.text); // Formatted summary text
 */
export async function generateOutline(content, style = '') {
    try {
        console.log('📝 Generating outline/summary');
        console.log('   Content length:', content.length, 'characters');
        console.log('   Style provided:', style ? 'Yes' : 'No');

        const response = await fetch(OUTLINE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content,
                style
            }),
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (errorData.detail) {
                const errorMessages = Array.isArray(errorData.detail)
                    ? errorData.detail.map(err => err.msg).join(', ')
                    : errorData.detail;
                throw new Error(`API error: ${errorMessages}`);
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Outline/summary generated successfully');
        console.log('   Output length:', data.text?.length || 0, 'characters');

        return data;
    } catch (error) {
        console.error('❌ Error generating outline:', error);
        console.error('   Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}

/**
 * Extract the summary text from outline response
 * 
 * @param {object} apiResponse - The response from generateOutline
 * @returns {string} - The generated summary text
 * 
 * @example
 * const response = await generateOutline(content, style);
 * const text = extractOutlineText(response);
 */
export function extractOutlineText(apiResponse) {
    try {
        return apiResponse.text || '';
    } catch (error) {
        console.error('❌ Error extracting outline text:', error);
        return '';
    }
}

/**
 * Extract bubble citations from outline text
 * Bubble format: {{BUBBLE:id:![citation]}}
 * 
 * @param {string} text - The outline text containing bubble citations
 * @returns {Array} - Array of bubble citations with id and citation
 * 
 * @example
 * const bubbles = extractBubbleCitations(outlineText);
 * // Returns: [{ id: '1', citation: '![/page/0/Text/2]' }, ...]
 */
export function extractBubbleCitations(text) {
    try {
        const bubbleRegex = /\{\{BUBBLE:(\d+):(!\[.*?\])\}\}/g;
        const bubbles = [];
        let match;

        while ((match = bubbleRegex.exec(text)) !== null) {
            bubbles.push({
                id: match[1],
                citation: match[2]
            });
        }

        return bubbles;
    } catch (error) {
        console.error('❌ Error extracting bubble citations:', error);
        return [];
    }
}

/**
 * Remove bubble citations from text, leaving clean content
 * 
 * @param {string} text - The outline text with bubble citations
 * @returns {string} - Clean text without bubble markers
 * 
 * @example
 * const cleanText = removeBubbleCitations(outlineText);
 */
export function removeBubbleCitations(text) {
    try {
        // Remove {{BUBBLE:id:![citation]}} markers
        return text.replace(/\{\{BUBBLE:\d+:!\[.*?\]\}\}/g, '').trim();
    } catch (error) {
        console.error('❌ Error removing bubble citations:', error);
        return text;
    }
}

// Backend API URL for notebook chat
const API_BASE_URL = import.meta.env.VITE_SERVER_BACKEND;

const getStoredUserId = () =>
    localStorage.getItem('currentUserId') || localStorage.getItem('user_id');

/**
 * Chat with a notebook using Amazon Bedrock through the backend
 *
 * @param {string} notebookId - The notebook ID to chat with
 * @param {string} userMessage - The user's chat message
 * @param {Array<object>} conversationHistory - Optional conversation history for multi-turn chat
 * @param {string} userId - Optional user ID (defaults to stored user ID)
 * @returns {Promise<object>} - Promise resolving to chat response with answer_text, sources, and provider_metadata
 * @throws {Error} - If the API request fails
 *
 * @example
 * const response = await notebookChat(notebookId, 'What is Python?');
 * console.log(response.data.answer_text); // AI-generated response
 * console.log(response.data.sources); // Source documents used
 */
export async function notebookChat(notebookId, userMessage, conversationHistory = null, userId = null, actionType = null) {
    try {
        const uid = userId || getStoredUserId();
        console.log('🎯 Sending notebook chat request:', { notebookId, messageLength: userMessage.length });

        const payload = {
            notebook_id: notebookId,
            user_message: userMessage,
        };

        if (conversationHistory && conversationHistory.length > 0) {
            payload.conversation_history = conversationHistory;
        }
        if (actionType) {
            payload.action_type = actionType;
        }

        const response = await fetch(`${API_BASE_URL}/ai/notebook-chat?user_id=${uid}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            let errorData;
            let responseText;
            try {
                responseText = await response.text();
                console.error('❌ Error response text:', responseText);
                errorData = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${responseText || 'empty'}`);
            }

            if (errorData.detail) {
                const errorMessage = typeof errorData.detail === 'string'
                    ? errorData.detail
                    : Array.isArray(errorData.detail)
                        ? errorData.detail.map(err => err.msg).join(', ')
                        : 'Unknown error';
                const apiError = new Error(errorMessage);
                apiError.status = response.status;
                apiError.detail = errorData.detail;
                throw apiError;
            }

            const httpError = new Error(`HTTP error! status: ${response.status}`);
            httpError.status = response.status;
            throw httpError;
        }

        const data = await response.json();
        console.log('✅ Notebook chat successful');
        console.log('   Answer length:', data.data?.answer_text?.length || 0, 'characters');
        console.log('   Sources:', data.data?.sources?.length || 0);

        return data;
    } catch (error) {
        console.error('❌ Error in notebook chat:', error);
        console.error('   Error details:', {
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
}
