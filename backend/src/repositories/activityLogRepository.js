import { query } from '../config/db.js';

export class ActivityLogRepository {
    static async log({ boardId, cardId = null, userId, action, details = {} }) {
        const sql = `
            INSERT INTO activity_logs (board_id, card_id, user_id, action, details)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, board_id, card_id, user_id, action, details, created_at
        `;
        const res = await query(sql, [boardId, cardId, userId, action, JSON.stringify(details)]);
        return res.rows[0];
    }

    static async getBoardLogs(boardId, page = 1, limit = 15) {
        const offset = (page - 1) * limit;

        const countRes = await query('SELECT COUNT(*) FROM activity_logs WHERE board_id = $1', [boardId]);
        const total = parseInt(countRes.rows[0].count, 10);

        const sql = `
            SELECT al.id, al.board_id, al.card_id, al.user_id, al.action, al.details, al.created_at,
                   u.username, u.email,
                   c.title as card_title
            FROM activity_logs al
            JOIN users u ON al.user_id = u.id
            LEFT JOIN cards c ON al.card_id = c.id
            WHERE al.board_id = $1
            ORDER BY al.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const res = await query(sql, [boardId, limit, offset]);

        return {
            logs: res.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
