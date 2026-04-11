// FILE: backend/__tests__/validatePassword.test.js
// PURPOSE: Unit tests for password validation logic
// TYPE: Unit Testing with Jest
//
// Note: This package uses ESM (`"type": "module"`). Jest runs with
// `NODE_OPTIONS=--experimental-vm-modules` (see npm `test` script).

import validatePassword from '../utils/validatePassword.js';

describe('validatePassword', () => {
    // Checks that a typical strong password passes all rules
    it('should return true for strong valid password', () => {
        expect(validatePassword('Abcd1234')).toBe(true);
    });

    // Enforces minimum length (8 characters)
    it('should return false for password shorter than minimum length', () => {
        expect(validatePassword('Ab1')).toBe(false);
    });

    // Requires at least one uppercase letter
    it('should return false if password has no uppercase letter', () => {
        expect(validatePassword('abcd1234')).toBe(false);
    });

    // Requires at least one lowercase letter
    it('should return false if password has no lowercase letter', () => {
        expect(validatePassword('ABCD1234')).toBe(false);
    });

    // Requires at least one digit
    it('should return false if password has no number', () => {
        expect(validatePassword('AbcdEfgh')).toBe(false);
    });

    // Empty string must fail
    it('should return false for empty password', () => {
        expect(validatePassword('')).toBe(false);
    });
});
