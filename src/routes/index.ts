import { Router } from 'express';
import authRouter from './auth.routes.js';
import conversationRouter from './conversation.routes.js';
import messageRouter from './message.routes.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { groupController } from '../controllers/group.controller.js';

const router = Router();

router.use('/auth', authRouter);

router.use('/conversations', authMiddleware, conversationRouter);

router.use('/messaging', authMiddleware, messageRouter);

router.get('/groups', groupController.index);
// router.get('/users', user)

export default router;
