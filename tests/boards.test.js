import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createBoardSchema, addMemberSchema } from '../backend/src/validators/boardValidator.js';

describe('Board Validation Tests', () => {
    it('should validate valid board creation payload', () => {
        const payload = {
            title: 'Project Roadmap 2026',
            description: 'Core features and milestone board',
        };
        const { error, value } = createBoardSchema.validate(payload);
        assert.equal(error, undefined);
        assert.equal(value.title, 'Project Roadmap 2026');
    });

    it('should reject empty board title', () => {
        const payload = { title: '' };
        const { error } = createBoardSchema.validate(payload);
        assert.notEqual(error, undefined);
    });

    it('should validate adding member with valid role', () => {
        const payload = { email: 'colleague@example.com', role: 'editor' };
        const { error } = addMemberSchema.validate(payload);
        assert.equal(error, undefined);
    });
});
