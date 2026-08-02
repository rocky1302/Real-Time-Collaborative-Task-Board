import { ListRepository } from '../repositories/listRepository.js';
import { ActivityLogRepository } from '../repositories/activityLogRepository.js';
import { NotFoundError } from '../utils/AppError.js';

export class ListService {
    static async createList({ boardId, title, position }, userId) {
        const list = await ListRepository.create({ boardId, title, position });

        await ActivityLogRepository.log({
            boardId,
            userId,
            action: 'created list',
            details: { title: list.title },
        });

        return list;
    }

    static async getListsByBoard(boardId) {
        return await ListRepository.getListsByBoard(boardId);
    }

    static async updateList(listId, { title, position }, userId) {
        const existing = await ListRepository.findById(listId);
        if (!existing) {
            throw new NotFoundError('List not found');
        }

        const updated = await ListRepository.update(listId, { title, position });

        if (title && title !== existing.title) {
            await ActivityLogRepository.log({
                boardId: existing.board_id,
                userId,
                action: 'renamed list',
                details: { oldTitle: existing.title, newTitle: title },
            });
        }

        return updated;
    }

    static async deleteList(listId, userId) {
        const existing = await ListRepository.findById(listId);
        if (!existing) {
            throw new NotFoundError('List not found');
        }

        const deleted = await ListRepository.delete(listId);

        await ActivityLogRepository.log({
            boardId: existing.board_id,
            userId,
            action: 'deleted list',
            details: { title: existing.title },
        });

        return deleted;
    }
}
