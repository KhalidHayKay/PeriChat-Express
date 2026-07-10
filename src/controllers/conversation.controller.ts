import { conversationService } from '../services/conversation.service.js';
import type { NextFunction, Request, Response } from 'express';
import { groupService } from '../services/group.service.js';
export const conversationController = {
  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subjects = await conversationService.getSubjects(req.user.id);

      return res.json({
        message: 'Successful',
        data: subjects,
      });
    } catch (error) {
      next(error);
      return;
    }
  },

  getMessages: async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params['id']?.toString();

    if (!id) {
      return res.status(400).json({ message: "route param 'id' is required" });
    }

    try {
      const result = await conversationService.getMessages(
        Number(id),
        req.user,
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

  getOlderMessages: async (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params['id']);
    const lastMessageId = Number(req.query['last_message_id']);
    const limit = Number(req.query['limit'] ?? 10);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid route param 'id'" });
    }

    if (!Number.isInteger(lastMessageId) || lastMessageId <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid query param 'last_message_id'" });
    }

    try {
      const result = await conversationService.getOlderMessages(
        Number(id),
        Number(lastMessageId),
        req.user,
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

  getSuggestions: async (req: Request, res: Response, next: NextFunction) => {
    const type =
      typeof req.query['type'] === 'string' ? req.query['type'] : undefined;

    if (type && type !== 'group' && type !== 'user') {
      return res
        .status(422)
        .json({ message: "invalid value for query param 'type'" });
    }

    try {
      const groups = await groupService.getJoinable(req.user);
      const users = await conversationService.getNonConversingUsers(req.user);

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
