/**
 * Test file for parseReference function
 * Run this in browser console to test
 */

import { parseReference } from './bookService';

console.log('=== Testing parseReference ===\n');

// Test Case 1: New format - simple book name
const test1 = '![250117366v2-/page/0/SectionHeader/1]';
const result1 = parseReference(test1);
console.log('Test 1 - New format (simple):');
console.log('Input:', test1);
console.log('Expected: { bookName: "250117366v2", position: "/page/0/SectionHeader/1" }');
console.log('Result:', result1);
console.log('✅ PASS:', result1.bookName === '250117366v2' && result1.position === '/page/0/SectionHeader/1');
console.log('');

// Test Case 2: New format - book name with dashes
const test2 = '![book-name-123-/page/0/Text/1]';
const result2 = parseReference(test2);
console.log('Test 2 - New format (with dashes):');
console.log('Input:', test2);
console.log('Expected: { bookName: "book-name-123", position: "/page/0/Text/1" }');
console.log('Result:', result2);
console.log('✅ PASS:', result2.bookName === 'book-name-123' && result2.position === '/page/0/Text/1');
console.log('');

// Test Case 3: Old format - no book name
const test3 = '![/page/0/Text/1]';
const result3 = parseReference(test3);
console.log('Test 3 - Old format (no book name):');
console.log('Input:', test3);
console.log('Expected: { bookName: null, position: "/page/0/Text/1" }');
console.log('Result:', result3);
console.log('✅ PASS:', result3.bookName === null && result3.position === '/page/0/Text/1');
console.log('');

// Test Case 4: New format - complex position
const test4 = '![medical-book-v2-/page/5/SectionHeader/3]';
const result4 = parseReference(test4);
console.log('Test 4 - New format (complex):');
console.log('Input:', test4);
console.log('Expected: { bookName: "medical-book-v2", position: "/page/5/SectionHeader/3" }');
console.log('Result:', result4);
console.log('✅ PASS:', result4.bookName === 'medical-book-v2' && result4.position === '/page/5/SectionHeader/3');
console.log('');

// Test Case 5: Invalid format
const test5 = '![invalid]';
const result5 = parseReference(test5);
console.log('Test 5 - Invalid format:');
console.log('Input:', test5);
console.log('Expected: null');
console.log('Result:', result5);
console.log('✅ PASS:', result5 === null);
console.log('');

// Test Case 6: Edge case - multiple dashes
const test6 = '![my-super-long-book-name-v1-2-3-/page/0/Text/1]';
const result6 = parseReference(test6);
console.log('Test 6 - Multiple dashes:');
console.log('Input:', test6);
console.log('Expected: { bookName: "my-super-long-book-name-v1-2-3", position: "/page/0/Text/1" }');
console.log('Result:', result6);
console.log('✅ PASS:', result6.bookName === 'my-super-long-book-name-v1-2-3' && result6.position === '/page/0/Text/1');
console.log('');

console.log('=== All Tests Complete ===');
