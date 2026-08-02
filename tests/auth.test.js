import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateAccessToken, generateRefreshToken, verifyAccessToken } from '../backend/src/utils/jwtUtils.js';
import { registerSchema, loginSchema } from '../backend/src/validators/authValidator.js';

describe('Authentication Unit & Validation Tests', () => {
    it('should correctly generate and verify valid JWT access tokens', () => {
        const payload = { id: 1, username: 'testuser', email: 'test@example.com' };
        const token = generateAccessToken(payload);
        assert.ok(token);
        
        const decoded = verifyAccessToken(token);
        assert.equal(decoded.id, 1);
        assert.equal(decoded.username, 'testuser');
        assert.equal(decoded.email, 'test@example.com');
    });

    it('should validate valid user registration payload', () => {
        const payload = {
            username: 'john_doe',
            email: 'john@example.com',
            password: 'securepassword123',
        };
        const { error, value } = registerSchema.validate(payload);
        assert.equal(error, undefined);
        assert.equal(value.username, 'john_doe');
    });

    it('should reject registration with invalid email format', () => {
        const payload = {
            username: 'john_doe',
            email: 'invalid-email',
            password: '123',
        };
        const { error } = registerSchema.validate(payload);
        assert.notEqual(error, undefined);
    });
});
