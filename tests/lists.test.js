import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createListSchema, updateListSchema } from '../backend/src/validators/listValidator.js';

describe('List Validation Tests', () => {
    it('should validate valid list creation payload', () => {
        const payload = { boardId: 1, title: 'In Progress', position: 0 };
        const { error, value } = createListSchema.validate(payload);
        assert.equal(error, undefined);
        assert.equal(value.title, 'In Progress');
    });

    it('should reject missing boardId when creating a list', () => {
        const payload = { title: 'Backlog' };
        const { error } = createListSchema.validate(payload);
        assert.notEqual(error, undefined);
    });
});
