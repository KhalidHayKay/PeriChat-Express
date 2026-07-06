import { Router } from 'express';
import { groupController } from '../controllers/group.controller.js';

const router = Router();

router.post('/', groupController.create);
router.get('/candidates', groupController.getCandidates);
router.post('/:id/join', groupController.join);
router.post('/:id/leave', groupController.leave);

export default router;
