import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test case
afterEach(() => {
    cleanup();
    // Clear all mocks
    vi.clearAllMocks();
    // Clear localStorage
    try {
        if (typeof localStorage !== 'undefined' && localStorage.clear) {
            localStorage.clear();
        }
    } catch (e) {
        // Ignore localStorage errors in test environment
    }
    // Clear sessionStorage
    try {
        if (typeof sessionStorage !== 'undefined' && sessionStorage.clear) {
            sessionStorage.clear();
        }
    } catch (e) {
        // Ignore sessionStorage errors in test environment
    }
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Create a proper mock selection that persists
const mockSelection = {
    rangeCount: 0,
    isCollapsed: true,
    getRangeAt: vi.fn(),
    removeAllRanges: vi.fn(() => {
        mockSelection.rangeCount = 0;
        mockSelection.isCollapsed = true;
    }),
    addRange: vi.fn((range) => {
        mockSelection.rangeCount = 1;
        mockSelection.isCollapsed = false;
    }),
    toString: vi.fn(() => ''),
    anchorNode: null,
    focusNode: null,
};

// Mock window.getSelection to return the same object
Object.defineProperty(window, 'getSelection', {
    writable: true,
    value: vi.fn(() => mockSelection),
});
