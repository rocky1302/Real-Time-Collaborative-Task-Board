import { Router } from 'express';
import { CardController } from '../controllers/cardController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireBoardRole } from '../middleware/rbacMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createCardSchema, updateCardSchema, moveCardSchema } from '../validators/cardValidator.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createCardSchema), requireBoardRole('editor'), CardController.createCard);
router.get('/search', CardController.searchCards);
router.get('/:id', requireBoardRole('viewer'), CardController.getCardDetails);
router.put('/:id', validateRequest(updateCardSchema), requireBoardRole('editor'), CardController.updateCard);
router.put('/:id/move', validateRequest(moveCardSchema), requireBoardRole('editor'), CardController.moveCard);

router.put('/:id/archive', requireBoardRole('editor'), CardController.archiveCard);
router.put('/:id/restore', requireBoardRole('editor'), CardController.restoreCard);

router.delete('/:id', requireBoardRole('editor'), CardController.deletePermanently);

export default router;
