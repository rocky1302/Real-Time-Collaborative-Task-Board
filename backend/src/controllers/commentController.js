import { CommentService } from '../services/commentService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

export class CommentController {
    static async addComment(req, res, next) {
        try {
            const comment = await CommentService.addComment({
                cardId: req.body.cardId,
                content: req.body.content,
                userId: req.user.id,
            });
            return sendSuccess(res, comment, 'Comment added successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    static async getCommentsByCard(req, res, next) {
        try {
            const cardId = req.params.cardId;
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const result = await CommentService.getCommentsByCard(cardId, page, limit);
            return sendSuccess(res, result.comments, 'Comments retrieved successfully', 200, result.pagination);
        } catch (err) {
            next(err);
        }
    }

    static async updateComment(req, res, next) {
        try {
            const commentId = req.params.id;
            const { content } = req.body;
            const updated = await CommentService.updateComment(commentId, content, req.user.id);
            return sendSuccess(res, updated, 'Comment updated successfully');
        } catch (err) {
            next(err);
        }
    }

    static async deleteComment(req, res, next) {
        try {
            const commentId = req.params.id;
            await CommentService.deleteComment(commentId, req.user.id);
            return sendSuccess(res, null, 'Comment deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}
