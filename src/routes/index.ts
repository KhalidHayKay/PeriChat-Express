import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import authRouter from './auth.routes.js';
import conversationRouter from './conversation.routes.js';
import messageRouter from './message.routes.js';
import groupRouter from './group.routes.js';

const router = Router();

router.use('/auth', authRouter);

router.use('/conversations', authMiddleware, conversationRouter);

router.use('/messaging', authMiddleware, messageRouter);

router.use('/group', authMiddleware, groupRouter);

export default router;
