import { query } from '../config/db.js';

export class CommentRepository {
    static async create({ cardId, userId, content }) {
        const sql = `
            INSERT INTO comments (card_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING id, card_id, user_id, content, created_at, updated_at
        `;
        const res = await query(sql, [cardId, userId, content]);
        const comment = res.rows[0];

        // Fetch user info for response
        const userRes = await query('SELECT username, email FROM users WHERE id = $1', [userId]);
        comment.username = userRes.rows[0]?.username;
        comment.email = userRes.rows[0]?.email;
        return comment;
    }

    static async getCommentsByCard(cardId, page = 1, limit = 10) {
        const offset = (page - 1) * limit;

        const countSql = 'SELECT COUNT(*) FROM comments WHERE card_id = $1';
        const countRes = await query(countSql, [cardId]);
        const total = parseInt(countRes.rows[0].count, 10);

        const sql = `
            SELECT c.id, c.card_id, c.user_id, c.content, c.created_at, c.updated_at,
                   u.username, u.email
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.card_id = $1
            ORDER BY c.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const res = await query(sql, [cardId, limit, offset]);

        return {
            comments: res.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    static async findById(commentId) {
        const sql = 'SELECT * FROM comments WHERE id = $1';
        const res = await query(sql, [commentId]);
        return res.rows[0] || null;
    }

    static async update(commentId, content) {
        const sql = `
            UPDATE comments
            SET content = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        const res = await query(sql, [content, commentId]);
        return res.rows[0];
    }

    static async delete(commentId) {
        const sql = 'DELETE FROM comments WHERE id = $1 RETURNING id';
        const res = await query(sql, [commentId]);
        return res.rows[0];
    }
}
