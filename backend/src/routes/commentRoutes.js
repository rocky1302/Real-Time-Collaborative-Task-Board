import { Router } from 'express';
import { CommentController } from '../controllers/commentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validationMiddleware.js';
import { createCommentSchema, updateCommentSchema } from '../validators/commentValidator.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createCommentSchema), CommentController.addComment);
router.get('/card/:cardId', CommentController.getCommentsByCard);
router.put('/:id', validateRequest(updateCommentSchema), CommentController.updateComment);
router.delete('/:id', CommentController.deleteComment);

export default router;
