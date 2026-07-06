import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller.js';

const router = Router();

router.get('/', conversationController.get);
router.get('/suggestions', conversationController.getSuggestions);
router.get('/:id', conversationController.getMessages);
router.get('/:id/older', conversationController.getOlderMessages);

export default router;
