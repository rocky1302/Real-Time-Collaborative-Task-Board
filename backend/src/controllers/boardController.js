import { BoardService } from '../services/boardService.js';
import { ActivityLogService } from '../services/activityLogService.js';
import { LabelRepository } from '../repositories/labelRepository.js';
import { sendSuccess } from '../utils/responseFormatter.js';

export class BoardController {
    static async createBoard(req, res, next) {
        try {
            const board = await BoardService.createBoard({
                title: req.body.title,
                description: req.body.description,
                ownerId: req.user.id,
            });
            return sendSuccess(res, board, 'Board created successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    static async getUserBoards(req, res, next) {
        try {
            const boards = await BoardService.getUserBoards(req.user.id);
            return sendSuccess(res, boards, 'Boards retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getBoardDetails(req, res, next) {
        try {
            const boardId = req.params.id;
            const board = await BoardService.getBoardFullDetails(boardId, req.user.id);
            return sendSuccess(res, board, 'Board details retrieved successfully');
        } catch (err) {
            next(err);
        }
    }

    static async updateBoard(req, res, next) {
        try {
            const boardId = req.params.id;
            const updated = await BoardService.updateBoard(boardId, req.body, req.user.id);
            return sendSuccess(res, updated, 'Board updated successfully');
        } catch (err) {
            next(err);
        }
    }

    static async deleteBoard(req, res, next) {
        try {
            const boardId = req.params.id;
            await BoardService.deleteBoard(boardId, req.user.id);
            return sendSuccess(res, null, 'Board deleted successfully');
        } catch (err) {
            next(err);
        }
    }

    static async addMember(req, res, next) {
        try {
            const boardId = req.params.id;
            const { email, role } = req.body;
            const member = await BoardService.addMember(boardId, email, role, req.user.id);
            return sendSuccess(res, member, 'Member added successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    static async removeMember(req, res, next) {
        try {
            const { id: boardId, userId } = req.params;
            await BoardService.removeMember(boardId, parseInt(userId, 10), req.user.id);
            return sendSuccess(res, null, 'Member removed successfully');
        } catch (err) {
            next(err);
        }
    }

    static async getActivityLogs(req, res, next) {
        try {
            const boardId = req.params.id;
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 15;
            const result = await ActivityLogService.getBoardLogs(boardId, page, limit);
            return sendSuccess(res, result.logs, 'Activity logs retrieved', 200, result.pagination);
        } catch (err) {
            next(err);
        }
    }

    static async getLabels(req, res, next) {
        try {
            const labels = await LabelRepository.getAll();
            return sendSuccess(res, labels, 'Labels retrieved successfully');
        } catch (err) {
            next(err);
        }
    }
}
