// Export all quiz service functions
export {
    generateQuizAndFlashcard,
    generateNotebookQuiz,
    generateNotebookFlashcards,
    extractQuizQuestions,
    extractFlashcardQuestions,
    updateQuizAnswer,
    checkQuizAnswer,
    calculateQuizScore,
    // RAG Chatbot functions
    chatWithRAG,
    extractChatOutput,
    extractIntermediateSteps,
    extractSourceDocuments,
    formatChatResponse,
    // Notebook Chat functions
    notebookChat,
    // Outline/Summary functions
    generateOutline,
    extractOutlineText,
    extractBubbleCitations,
    removeBubbleCitations
} from './aiService';
