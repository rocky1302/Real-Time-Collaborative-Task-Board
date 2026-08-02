import { CardService } from '../services/cardService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

export class CardController {
    static async createCard(req, res, next) {
        try {
            const card = await CardService.createCard(req.body, req.user.id);
            return sendSuccess(res, card, 'Card created successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    static async getCardDetails(req, res, next) {
        try {
            const cardId = req.params.id;
            const card = await CardService.getCardDetails(cardId);
            return sendSuccess(res, card, 'Card details retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async updateCard(req, res, next) {
        try {
            const cardId = req.params.id;
            const updated = await CardService.updateCard(cardId, req.body, req.user.id);
            return sendSuccess(res, updated, 'Card updated successfully');
        } catch (err) {
            next(err);
        }
    }

    static async moveCard(req, res, next) {
        try {
            const cardId = req.params.id;
            const { targetListId, newPosition } = req.body;
            const moved = await CardService.moveCard(cardId, targetListId, newPosition, req.user.id);
            return sendSuccess(res, moved, 'Card moved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async archiveCard(req, res, next) {
        try {
            const cardId = req.params.id;
            const archived = await CardService.archiveCard(cardId, req.user.id);
            return sendSuccess(res, archived, 'Card archived successfully');
        } catch (err) {
            next(err);
        }
    }

    static async restoreCard(req, res, next) {
        try {
            const cardId = req.params.id;
            const restored = await CardService.restoreCard(cardId, req.user.id);
            return sendSuccess(res, restored, 'Card restored successfully');
        } catch (err) {
            next(err);
        }
    }

    static async searchCards(req, res, next) {
        try {
            const { boardId, query } = req.query;
            const cards = await CardService.searchCards(boardId, query);
            return sendSuccess(res, cards, 'Search results retrieved');
        } catch (err) {
            next(err);
        }
    }

    static async deletePermanently(req, res, next) {
        try {
            const cardId = req.params.id;
            await CardService.deletePermanently(cardId, req.user.id);
            return sendSuccess(res, null, 'Card permanently deleted');
        } catch (err) {
            next(err);
        }
    }
}
