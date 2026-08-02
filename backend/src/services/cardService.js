import { CardRepository } from '../repositories/cardRepository.js';
import { ListRepository } from '../repositories/listRepository.js';
import { LabelRepository } from '../repositories/labelRepository.js';
import { ActivityLogRepository } from '../repositories/activityLogRepository.js';
import { NotFoundError } from '../utils/AppError.js';

export class CardService {
    static async createCard({ listId, title, description, dueDate, labelIds }, userId) {
        const list = await ListRepository.findById(listId);
        if (!list) {
            throw new NotFoundError('Target list not found');
        }

        const card = await CardRepository.create({ listId, title, description, dueDate });

        if (labelIds && labelIds.length > 0) {
            await LabelRepository.setCardLabels(card.id, labelIds);
        }

        const fullCard = await CardRepository.findById(card.id);
        const cardLabels = await LabelRepository.getCardLabels(card.id);
        fullCard.labels = cardLabels;

        await ActivityLogRepository.log({
            boardId: list.board_id,
            cardId: card.id,
            userId,
            action: 'created card',
            details: { title: card.title, listTitle: list.title },
        });

        return fullCard;
    }

    static async getCardDetails(cardId) {
        const card = await CardRepository.findById(cardId);
        if (!card) {
            throw new NotFoundError('Card not found');
        }
        const labels = await LabelRepository.getCardLabels(cardId);
        return { ...card, labels };
    }

    static async updateCard(cardId, updates, userId) {
        const existing = await CardRepository.findById(cardId);
        if (!existing) {
            throw new NotFoundError('Card not found');
        }

        if (updates.labelIds !== undefined) {
            await LabelRepository.setCardLabels(cardId, updates.labelIds);
            delete updates.labelIds;
        }

        const updated = await CardRepository.update(cardId, updates);
        const labels = await LabelRepository.getCardLabels(cardId);
        const result = { ...updated, labels, board_id: existing.board_id };

        // Log actions based on updates
        if (updates.isArchived !== undefined && updates.isArchived !== existing.is_archived) {
            const action = updates.isArchived ? 'archived card' : 'restored card';
            await ActivityLogRepository.log({
                boardId: existing.board_id,
                cardId,
                userId,
                action,
                details: { title: existing.title },
            });
        }

        return result;
    }

    static async moveCard(cardId, targetListId, newPosition, userId) {
        const existing = await CardRepository.findById(cardId);
        if (!existing) {
            throw new NotFoundError('Card not found');
        }

        const targetList = await ListRepository.findById(targetListId);
        if (!targetList) {
            throw new NotFoundError('Target list not found');
        }

        const moved = await CardRepository.moveCard(cardId, targetListId, newPosition);

        await ActivityLogRepository.log({
            boardId: targetList.board_id,
            cardId,
            userId,
            action: 'moved card',
            details: {
                cardTitle: existing.title,
                fromList: existing.list_title,
                toList: targetList.title,
                newPosition,
            },
        });

        return { ...moved, board_id: targetList.board_id };
    }

    static async searchCards(boardId, searchTerm) {
        if (!searchTerm || searchTerm.trim().length === 0) return [];
        return await CardRepository.searchCards(boardId, searchTerm.trim());
    }

    static async archiveCard(cardId, userId) {
        return await this.updateCard(cardId, { isArchived: true }, userId);
    }

    static async restoreCard(cardId, userId) {
        return await this.updateCard(cardId, { isArchived: false }, userId);
    }

    static async deletePermanently(cardId, userId) {
        const existing = await CardRepository.findById(cardId);
        if (!existing) {
            throw new NotFoundError('Card not found');
        }

        await CardRepository.deletePermanently(cardId);

        await ActivityLogRepository.log({
            boardId: existing.board_id,
            userId,
            action: 'deleted card permanently',
            details: { title: existing.title },
        });

        return { id: cardId, board_id: existing.board_id };
    }
}
