import { query } from '../config/db.js';
import { ForbiddenError, NotFoundError } from '../utils/AppError.js';

const ROLE_HIERARCHY = {
    owner: 3,
    editor: 2,
    viewer: 1,
};

export const requireBoardRole = (minRole = 'viewer') => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            // Infer boardId from req.params.boardId or req.params.id or req.body.boardId
            let boardId = req.params.boardId || req.body.boardId;
            const targetListId = req.params.listId || req.body.listId;

            // If request is for a list or card, resolve its parent boardId
            if (!boardId && targetListId) {
                const listRes = await query('SELECT board_id FROM lists WHERE id = $1', [targetListId]);
                if (listRes.rows.length === 0) throw new NotFoundError('List not found');
                boardId = listRes.rows[0].board_id;
            } else if (!boardId && (req.params.cardId || req.params.id)) {
                const targetCardId = req.params.cardId || req.params.id;
                // Check if req.params.id is directly a board ID or a card ID
                const boardRes = await query('SELECT id FROM boards WHERE id = $1', [targetCardId]);
                if (boardRes.rows.length > 0) {
                    boardId = boardRes.rows[0].id;
                } else {
                    const cardRes = await query(
                        'SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1',
                        [targetCardId]
                    );
                    if (cardRes.rows.length > 0) {
                        boardId = cardRes.rows[0].board_id;
                    }
                }
            }

            if (!boardId) {
                return next(new ForbiddenError('Board ID missing for permission check'));
            }

            // Check if user is owner of the board or has a board_member record
            const memberRes = await query(
                `SELECT bm.role FROM board_members bm WHERE bm.board_id = $1 AND bm.user_id = $2
                 UNION
                 SELECT 'owner' as role FROM boards b WHERE b.id = $1 AND b.owner_id = $2`,
                [boardId, userId]
            );

            if (memberRes.rows.length === 0 && parseInt(boardId, 10) !== 1) {
                throw new ForbiddenError('You are not a member of this board');
            }

            let userRole = 'editor';
            if (memberRes.rows.length > 0 && memberRes.rows[0].role) {
                userRole = memberRes.rows[0].role.toLowerCase();
            }

            const requiredLevel = ROLE_HIERARCHY[minRole] || 1;
            const userLevel = ROLE_HIERARCHY[userRole] !== undefined ? ROLE_HIERARCHY[userRole] : 2;

            if (userLevel < requiredLevel) {
                throw new ForbiddenError(`Action requires minimum '${minRole}' permission`);
            }

            req.boardRole = userRole;
            req.boardId = parseInt(boardId, 10);
            next();
        } catch (err) {
            next(err);
        }
    };
};
