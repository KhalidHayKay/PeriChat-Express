import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { groupService } from '../services/group.service.js';
import { validator } from '../validator/schema.js';
import { conversationService } from '../services/conversation.service.js';

export const groupController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = validator.group.new.safeParse(req.body);

      if (!result.success) {
        return res.status(422).json({
          message: 'Invalid request body',
          errors: z.treeifyError(result.error).properties,
        });
      }

      const group = await groupService.make(result.data, req.user!);

      return res
        .status(201)
        .json({ message: 'Group created successfully', data: group });
    } catch (error) {
      next(error);
      return;
    }
  },

  async getCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const candidates = await conversationService.getConversingUsers(
        req.user!,
      );

      return res.json({
        message: 'Operation successful',
        data: candidates,
      });
    } catch (error) {
      next(error);
      return;
    }
  },

  async join(req: Request, res: Response, next: NextFunction) {
    const groupId = req.params['id']?.toString();

    if (!groupId) {
      return res.status(400).json({
        message: 'Could not parse group id from URI parameter',
      });
    }

    try {
      const group = await groupService.join(groupId, req.user!);

      return res.json({
        message: 'Group joined successful',
        data: group,
      });
    } catch (error) {
      next(error);
      return;
    }
  },

  async leave(req: Request, res: Response, next: NextFunction) {
    const groupId = req.params['id']?.toString();

    if (!groupId) {
      return res.status(400).json({
        message: 'Could not parse group id from URI parameter',
      });
    }

    try {
      await groupService.leave(groupId, req.user!);

      return res.json({
        message: 'Operation successful',
      });
    } catch (error) {
      next(error);
      return;
    }
  },
};
