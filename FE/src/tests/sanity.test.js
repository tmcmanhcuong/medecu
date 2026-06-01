import { describe, it, expect } from 'vitest';

/**
 * Basic Sanity Test - Đảm bảo test environment hoạt động
 */
describe('Sanity Check', () => {
    it('basic math should work', () => {
        expect(1 + 1).toBe(2);
    });

    it('arrays should work', () => {
        const arr = [1, 2, 3];
        expect(arr).toHaveLength(3);
    });

    it('objects should work', () => {
        const obj = { key: 'value' };
        expect(obj).toHaveProperty('key');
        expect(obj.key).toBe('value');
    });
});
