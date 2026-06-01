/**
 * Test regex for citation bubble detection
 * Run in browser console to verify
 */

// Regex to match both old and new citation formats
const citationRegex = /!\[([^-\]]*-)?\/page\/\d+\/[^\]]+\]/g;

console.log('=== Testing Citation Regex ===\n');

// Test Case 1: New format with book title
const test1 = "This is text ![250117366v2-/page/0/Text/1] more text";
const matches1 = test1.match(citationRegex);
console.log('Test 1 - New format with book title:');
console.log('Input:', test1);
console.log('Matches:', matches1);
console.log('✅ PASS:', matches1 && matches1[0] === '![250117366v2-/page/0/Text/1]');
console.log('');

// Test Case 2: Old format without book title
const test2 = "This is text ![/page/0/Text/1] more text";
const matches2 = test2.match(citationRegex);
console.log('Test 2 - Old format without book title:');
console.log('Input:', test2);
console.log('Matches:', matches2);
console.log('✅ PASS:', matches2 && matches2[0] === '![/page/0/Text/1]');
console.log('');

// Test Case 3: Book title with dashes
const test3 = "Text ![medical-book-v2-/page/0/SectionHeader/1] more";
const matches3 = test3.match(citationRegex);
console.log('Test 3 - Book title with dashes:');
console.log('Input:', test3);
console.log('Matches:', matches3);
console.log('✅ PASS:', matches3 && matches3[0] === '![medical-book-v2-/page/0/SectionHeader/1]');
console.log('');

// Test Case 4: Multiple citations
const test4 = "Text ![book1-/page/0/Text/1] and ![book2-/page/1/Text/2] and ![/page/2/Text/3]";
const matches4 = test4.match(citationRegex);
console.log('Test 4 - Multiple citations (mixed formats):');
console.log('Input:', test4);
console.log('Matches:', matches4);
console.log('Expected: 3 matches');
console.log('✅ PASS:', matches4 && matches4.length === 3);
console.log('');

// Test Case 5: Complex position
const test5 = "Text ![250117366v23456-/page/0/SectionHeader/1] end";
const matches5 = test5.match(citationRegex);
console.log('Test 5 - Complex book title:');
console.log('Input:', test5);
console.log('Matches:', matches5);
console.log('✅ PASS:', matches5 && matches5[0] === '![250117366v23456-/page/0/SectionHeader/1]');
console.log('');

// Test Case 6: Should NOT match (invalid format)
const test6 = "Text ![invalid] more text";
const matches6 = test6.match(citationRegex);
console.log('Test 6 - Invalid format (should not match):');
console.log('Input:', test6);
console.log('Matches:', matches6);
console.log('✅ PASS:', matches6 === null);
console.log('');

// Test Case 7: Real world example
const test7 = `
This document outlines the key objectives. ![250117366v2-/page/0/Text/2]

Key points:
- Redesign the sign-up flow ![250117366v2-/page/0/SectionHeader/1]
- Track key activation milestones ![250117366v2-/page/0/Text/4]
- Engineering requirements ![/page/1/Text/1]
`;
const matches7 = test7.match(citationRegex);
console.log('Test 7 - Real world example:');
console.log('Input:', test7);
console.log('Matches:', matches7);
console.log('Expected: 4 matches');
console.log('✅ PASS:', matches7 && matches7.length === 4);
console.log('');

console.log('=== All Tests Complete ===');

// Export for use
export const CITATION_REGEX = citationRegex;
