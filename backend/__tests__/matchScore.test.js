// FILE: backend/__tests__/matchScore.test.js
// PURPOSE: Unit tests for skill match score calculation
// TYPE: Unit Testing with Jest

import calcMatchScore from '../utils/calcMatchScore.js';

describe('calcMatchScore', () => {
    // Full overlap → 100%
    it('should return 100 when all job skills match user skills', () => {
        expect(calcMatchScore(['a', 'b'], ['a', 'b'])).toBe(100);
    });

    // Partial overlap → proportional score
    it('should return 50 when half of the job skills match', () => {
        expect(calcMatchScore(['a', 'b'], ['a'])).toBe(50);
    });

    // Disjoint sets
    it('should return 0 when no skills match', () => {
        expect(calcMatchScore(['x'], ['y'])).toBe(0);
    });

    // No user skills → cannot match job requirements
    it('should return 0 when userSkills is empty', () => {
        expect(calcMatchScore(['a', 'b'], [])).toBe(0);
    });

    // Always a finite number (never NaN)
    it('should always return a valid number', () => {
        expect(Number.isFinite(calcMatchScore(['a'], ['a']))).toBe(true);
        expect(Number.isFinite(calcMatchScore([], ['a']))).toBe(true);
    });

    // Case should not create false negatives
    it('should handle uppercase/lowercase skill differences safely', () => {
        expect(calcMatchScore(['JavaScript'], ['javascript'])).toBe(100);
    });
});
