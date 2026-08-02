import { BoardRepository } from '../repositories/boardRepository.js';
import { ListRepository } from '../repositories/listRepository.js';
import { CardRepository } from '../repositories/cardRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { ActivityLogRepository } from '../repositories/activityLogRepository.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/AppError.js';

export class BoardService {
    static async createBoard({ title, description, ownerId }) {
        const board = await BoardRepository.create({ title, description, ownerId });
        
        // Seed 4 default lists for new board: To Do, In Progress, Review, Done
        await ListRepository.create({ boardId: board.id, title: 'To Do', position: 0 });
        await ListRepository.create({ boardId: board.id, title: 'In Progress', position: 1 });
        await ListRepository.create({ boardId: board.id, title: 'Review', position: 2 });
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

        // Standard 4 columns matching Photo 2 reference: To Do (0), In Progress (1), Review (2), Done (3)
        const standardTitles = ['To Do', 'In Progress', 'Review', 'Done'];

        for (let i = 0; i < standardTitles.length; i++) {
            const targetTitle = standardTitles[i];
            const found = lists.find(
                (l) => l.title.trim().toLowerCase() === targetTitle.toLowerCase() ||
                       (targetTitle === 'Review' && l.title.trim().toLowerCase().includes('review')) ||
                       (targetTitle === 'To Do' && (l.title.trim().toLowerCase().includes('todo') || l.title.trim().toLowerCase().includes('backlog')))
            );

            if (found) {
                await ListRepository.update(found.id, { title: targetTitle, position: i });
            } else {
                await ListRepository.create({ boardId, title: targetTitle, position: i });
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
