import { Router } from 'express';
import authRouter from './auth.routes.js';
import conversationRouter from './conversation.routes.js';
import messageRouter from './message.routes.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.use('/auth', authRouter);

router.use('/conversations', authMiddleware, conversationRouter);

router.use('/messaging', authMiddleware, messageRouter);

export default router;
