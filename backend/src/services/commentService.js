import { CommentRepository } from '../repositories/commentRepository.js';
import { CardRepository } from '../repositories/cardRepository.js';
import { ActivityLogRepository } from '../repositories/activityLogRepository.js';
import { NotFoundError, ForbiddenError } from '../utils/AppError.js';

export class CommentService {
    static async addComment({ cardId, userId, content }) {
        const card = await CardRepository.findById(cardId);
        if (!card) {
            throw new NotFoundError('Card not found');
        }

        const comment = await CommentRepository.create({ cardId, userId, content });

        await ActivityLogRepository.log({
            boardId: card.board_id,
            cardId,
            userId,
            action: 'added comment',
            details: { cardTitle: card.title, commentSnippet: content.slice(0, 50) },
        });

        return { ...comment, board_id: card.board_id };
    }

    static async getCommentsByCard(cardId, page = 1, limit = 10) {
        const card = await CardRepository.findById(cardId);
        if (!card) {
            throw new NotFoundError('Card not found');
        }
        return await CommentRepository.getCommentsByCard(cardId, page, limit);
    }

    static async updateComment(commentId, content, userId) {
        const comment = await CommentRepository.findById(commentId);
        if (!comment) {
            throw new NotFoundError('Comment not found');
        }
        if (comment.user_id !== userId) {
            throw new ForbiddenError('You can only edit your own comments');
        }

        return await CommentRepository.update(commentId, content);
    }

    static async deleteComment(commentId, userId) {
        const comment = await CommentRepository.findById(commentId);
        if (!comment) {
            throw new NotFoundError('Comment not found');
        }
        if (comment.user_id !== userId) {
            throw new ForbiddenError('You can only delete your own comments');
        }

        return await CommentRepository.delete(commentId);
    }
}
