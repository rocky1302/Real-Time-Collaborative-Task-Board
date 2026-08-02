import { Router } from 'express';
import { ListController } from '../controllers/listController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireBoardRole } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createListSchema, updateListSchema } from '../validators/listValidator.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createListSchema), requireBoardRole('editor'), ListController.createList);
router.put('/:id', validateRequest(updateListSchema), requireBoardRole('editor'), ListController.updateList);
router.delete('/:id', requireBoardRole('editor'), ListController.deleteList);

export default router;
