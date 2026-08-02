import { ListService } from '../services/listService.js';
import { sendSuccess } from '../utils/responseFormatter.js';

export class ListController {
    static async createList(req, res, next) {
        try {
            const list = await ListService.createList(req.body, req.user.id);
            return sendSuccess(res, list, 'List created successfully', 201);
        } catch (err) {
            next(err);
        }
    }

    static async updateList(req, res, next) {
        try {
            const listId = req.params.id;
            const updated = await ListService.updateList(listId, req.body, req.user.id);
            return sendSuccess(res, updated, 'List updated successfully');
        } catch (err) {
            next(err);
        }
    }

    static async deleteList(req, res, next) {
        try {
            const listId = req.params.id;
            await ListService.deleteList(listId, req.user.id);
            return sendSuccess(res, null, 'List deleted successfully');
        } catch (err) {
            next(err);
        }
    }
}
