import { conversationService } from '../services/conversation.service.js';
import type { NextFunction, Request, Response } from 'express';

export const conversationController = {
  async get(req: Request, res: Response, next: NextFunction) {
    console.log(req.path);
    try {
      const subjects = await conversationService.getSubjects(req.user?.id!);

      return res.json({
        message: 'Successful',
        data: subjects,
      });
    } catch (error) {
      next(error);
      return;
    }
  },
};
