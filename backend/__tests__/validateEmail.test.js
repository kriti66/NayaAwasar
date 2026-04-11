// FILE: backend/__tests__/validateEmail.test.js
// PURPOSE: Unit tests for email validation logic
// TYPE: Unit Testing with Jest

import validateEmail from '../utils/validateEmail.js';

describe('validateEmail', () => {
    // Typical well-formed address
    it('should return true for valid email', () => {
        expect(validateEmail('user@example.com')).toBe(true);
    });

    // @ is mandatory for a simple local check
    it('should return false for invalid email without @', () => {
        expect(validateEmail('userexample.com')).toBe(false);
    });

    // Domain part must exist after @
    it('should return false for invalid email without domain', () => {
        expect(validateEmail('user@')).toBe(false);
    });

    // Whitespace-only is treated as empty
    it('should return false for empty email', () => {
        expect(validateEmail('')).toBe(false);
        expect(validateEmail('   ')).toBe(false);
    });

    // Nullish values are invalid
    it('should return false for null or undefined', () => {
        expect(validateEmail(null)).toBe(false);
        expect(validateEmail(undefined)).toBe(false);
    });
});
