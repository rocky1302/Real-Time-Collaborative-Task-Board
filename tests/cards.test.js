import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCardSchema, moveCardSchema } from '../backend/src/validators/cardValidator.js';

describe('Card Validation Tests', () => {
    it('should validate valid card creation payload', () => {
        const payload = {
            listId: 5,
            title: 'Implement JWT refresh tokens',
            description: 'Add refresh token rotation endpoint',
            labels: [1, 2],
        };
        const { error, value } = createCardSchema.validate(payload);
        assert.equal(error, undefined);
        assert.equal(value.title, 'Implement JWT refresh tokens');
    });

    it('should validate card movement payload', () => {
        const payload = { targetListId: 6, newPosition: 2 };
        const { error, value } = moveCardSchema.validate(payload);
        assert.equal(error, undefined);
        assert.equal(value.targetListId, 6);
        assert.equal(value.newPosition, 2);
    });
});
