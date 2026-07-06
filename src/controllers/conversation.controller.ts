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

  async getMessages(req: Request, res: Response, next: NextFunction) {
    const id = req.params['id']?.toString();

    if (!id) {
      return res.status(400).json({ message: "route param 'id' is required" });
    }

    try {
      const result = await conversationService.getMessages(
        Number(id),
        req.user!,
      );

      return res.json({
        message: 'Messages retrieved successfully',
        data: {
          messages: result.messages,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      next(error);
      return;
    }
  },

  async getOlderMessages(req: Request, res: Response, next: NextFunction) {
    const id = req.params['id']?.toString();
    const lastMessageId = req.query['last_message_id']?.toString();
    const limit = Number(req.query['limit'] ?? 10);

    if (!id) {
      return res.status(400).json({ message: "route param 'id' is required" });
    }

    if (!lastMessageId) {
      return res
        .status(400)
        .json({ message: "query param 'last_message_id' is required" });
    }

    try {
      const result = await conversationService.getOlderMessages(
        Number(id),
        Number(lastMessageId),
        req.user!,
        limit,
      );

      return res.json({
        message: 'Older messages retrieved successfully',
        data: {
          messages: result.messages,
          hasMore: result.hasMore,
        },
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
