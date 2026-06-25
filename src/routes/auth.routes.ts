import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authTokenValidator } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authTokenValidator, authController.logout);

export default router;
