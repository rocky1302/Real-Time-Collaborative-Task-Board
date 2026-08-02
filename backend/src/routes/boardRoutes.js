import { Router } from 'express';
import { BoardController } from '../controllers/boardController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireBoardRole } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import {
    createBoardSchema,
    updateBoardSchema,
    addMemberSchema,
} from '../validators/boardValidator.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createBoardSchema), BoardController.createBoard);
router.get('/', BoardController.getUserBoards);
router.get('/labels', BoardController.getLabels);

router.get('/:id', requireBoardRole('viewer'), BoardController.getBoardDetails);
router.put('/:id', requireBoardRole('editor'), validateRequest(updateBoardSchema), BoardController.updateBoard);
router.delete('/:id', requireBoardRole('owner'), BoardController.deleteBoard);

router.post('/:id/members', requireBoardRole('owner'), validateRequest(addMemberSchema), BoardController.addMember);
router.delete('/:id/members/:userId', requireBoardRole('owner'), BoardController.removeMember);

router.get('/:id/activity', requireBoardRole('viewer'), BoardController.getActivityLogs);

export default router;
