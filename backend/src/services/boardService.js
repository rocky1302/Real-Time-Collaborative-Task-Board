import { BoardRepository } from '../repositories/boardRepository.js';
import { ListRepository } from '../repositories/listRepository.js';
import { CardRepository } from '../repositories/cardRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { ActivityLogRepository } from '../repositories/activityLogRepository.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/AppError.js';

export class BoardService {
    static async createBoard({ title, description, ownerId }) {
        const board = await BoardRepository.create({ title, description, ownerId });
        
        // Seed 4 default lists for new board: To Do, In Progress, In Review, Done
        await ListRepository.create({ boardId: board.id, title: 'To Do', position: 0 });
        await ListRepository.create({ boardId: board.id, title: 'In Progress', position: 1 });
        await ListRepository.create({ boardId: board.id, title: 'In Review', position: 2 });
        await ListRepository.create({ boardId: board.id, title: 'Done', position: 3 });

        await ActivityLogRepository.log({
            boardId: board.id,
            userId: ownerId,
            action: 'created board',
            details: { title: board.title },
        });

        return board;
    }

    static async getUserBoards(userId) {
        return await BoardRepository.getUserBoards(userId);
    }

    static async getBoardFullDetails(boardId, userId) {
        const board = await BoardRepository.getBoardDetails(boardId);
        if (!board) {
            throw new NotFoundError('Board not found');
        }

        const members = await BoardRepository.getMembers(boardId);
        let lists = await ListRepository.getListsByBoard(boardId);

        // Auto-ensure default 4 lists exist even for existing boards
        const requiredLists = ['To Do', 'In Progress', 'In Review', 'Done'];
        const existingTitles = lists.map((l) => l.title.trim().toLowerCase());

        for (let i = 0; i < requiredLists.length; i++) {
            const reqTitle = requiredLists[i];
            if (!existingTitles.includes(reqTitle.toLowerCase())) {
                await ListRepository.create({ boardId, title: reqTitle, position: lists.length + i });
            }
        }

        lists = await ListRepository.getListsByBoard(boardId);

        // Populate cards for each list
        const listsWithCards = await Promise.all(
            lists.map(async (list) => {
                const cards = await CardRepository.getCardsByList(list.id);
                return { ...list, cards };
            })
        );

        return {
            ...board,
            members,
            lists: listsWithCards,
        };
    }

    static async updateBoard(boardId, { title, description }, userId) {
        const board = await BoardRepository.getBoardDetails(boardId);
        if (!board) {
            throw new NotFoundError('Board not found');
        }

        const updated = await BoardRepository.update(boardId, { title, description });

        if (title && title !== board.title) {
            await ActivityLogRepository.log({
                boardId,
                userId,
                action: 'renamed board',
                details: { oldTitle: board.title, newTitle: title },
            });
        }

        return updated;
    }

    static async deleteBoard(boardId, userId) {
        const board = await BoardRepository.getBoardDetails(boardId);
        if (!board) {
            throw new NotFoundError('Board not found');
        }

        if (board.owner_id !== userId) {
            throw new ForbiddenError('Only the board owner can delete this board');
        }

        return await BoardRepository.delete(boardId);
    }

    static async addMember(boardId, email, role = 'editor', currentUserId) {
        const targetUser = await UserRepository.findByEmail(email);
        if (!targetUser) {
            throw new NotFoundError('User with specified email not found');
        }

        const member = await BoardRepository.addMember(boardId, targetUser.id, role);

        await ActivityLogRepository.log({
            boardId,
            userId: currentUserId,
            action: 'added board member',
            details: { addedUsername: targetUser.username, role },
        });

        return member;
    }

    static async removeMember(boardId, memberUserId, currentUserId) {
        const board = await BoardRepository.getBoardDetails(boardId);
        if (board.owner_id === memberUserId) {
            throw new BadRequestError('Cannot remove board owner from board members');
        }

        const removed = await BoardRepository.removeMember(boardId, memberUserId);

        await ActivityLogRepository.log({
            boardId,
            userId: currentUserId,
            action: 'removed board member',
            details: { memberUserId },
        });

        return removed;
    }
}
