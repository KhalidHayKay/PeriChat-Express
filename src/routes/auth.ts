import { Router } from 'express';
import authController from '../controllers/authController.js';
import { authTokenValidator } from '../middlewares/auth.js';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authTokenValidator, authController.logout);

export default router;
