import { conversationService } from '../services/conversation.service.js';
import type { NextFunction, Request, Response } from 'express';
import { groupService } from '../services/group.service.js';

export const conversationController = {
  async get(req: Request, res: Response, next: NextFunction) {
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

  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query['type']?.toString();

      const groups = await groupService.getJoinable(req.user!);
      const users = await conversationService.getNonConversingUsers(req.user!);

      let data;

      if (!type) {
        data = { groups, users };
      }

      if (type === 'group') {
        data = { groups };
      }

      if (type === 'user') {
        data = { users };
      }

      return res.json({
        message: 'Suggestions gotten successfully',
        data,
      });
    } catch (error) {
      next(error);
      return;
    }
  },
};
