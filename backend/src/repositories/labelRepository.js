import { query } from '../config/db.js';

export class LabelRepository {
    static async getAll() {
        const sql = 'SELECT * FROM labels ORDER BY name ASC';
        const res = await query(sql);
        return res.rows;
    }

    static async getCardLabels(cardId) {
        const sql = `
            SELECT l.id, l.name, l.color
            FROM labels l
            JOIN card_labels cl ON l.id = cl.label_id
            WHERE cl.card_id = $1
        `;
        const res = await query(sql, [cardId]);
        return res.rows;
    }

    static async attachLabelToCard(cardId, labelId) {
        const sql = `
            INSERT INTO card_labels (card_id, label_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
        `;
        await query(sql, [cardId, labelId]);
    }

    static async removeLabelFromCard(cardId, labelId) {
        const sql = 'DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2';
        await query(sql, [cardId, labelId]);
    }

    static async setCardLabels(cardId, labelIds = []) {
        await query('DELETE FROM card_labels WHERE card_id = $1', [cardId]);
        if (labelIds.length > 0) {
            for (const labelId of labelIds) {
                await query('INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
                    cardId,
                    labelId,
                ]);
            }
        }
    }
}
