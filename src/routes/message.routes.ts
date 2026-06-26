import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import multer from 'multer';

const router = Router();
const upload = multer();

router.post('/', upload.array('attachments', 10), messageController.create);

export default router;
