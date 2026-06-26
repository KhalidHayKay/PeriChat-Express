import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller.js';

const router = Router();

router.get('/', conversationController.get);

export default router;
