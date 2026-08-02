import { ActivityLogRepository } from '../repositories/activityLogRepository.js';

export class ActivityLogService {
    static async getBoardLogs(boardId, page = 1, limit = 15) {
        return await ActivityLogRepository.getBoardLogs(boardId, page, limit);
    }
}
