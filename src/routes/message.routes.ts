import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import multer from 'multer';

const router = Router();
const upload = multer();

router.use(upload.array('attachments', 10));

router.post('/', messageController.create);
router.post('/first', messageController.createFirst);

export default router;
