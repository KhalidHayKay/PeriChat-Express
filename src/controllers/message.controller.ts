import type { NextFunction, Request, Response } from 'express';
import { validator } from '../validator/schema.js';
import { messageService } from '../services/message.service.js';
import z from 'zod';
import { BadRequestError } from '../errors/error-types.js';
import type {
  NewMessageData,
  NewMessageWithConversationData,
} from '../dtos/dto.js';

export const messageController = {
  async create(req: Request, res: Response, next: NextFunction) {
    const result = validator.messaging.new.safeParse({
      ...req.body,
      message_attachments: req.files ?? [],
    });

    if (!result.success) {
      return res.status(422).json({
        message: 'Invalid request body',
        errors: z.treeifyError(result.error).properties,
      });
    }

    const data: NewMessageData = {
      conversation_id: Number(result.data.conversation_id),
      content: result.data.content,
      receiver_id: Number(result.data.receiver_id),
      group_id: Number(result.data.group_id),
      message_attachments: result.data.message_attachments,
    };

    try {
      const message = await messageService.make(data, req.user!);
      return res.status(201).json({
        message: 'Message created successfully',
        data: message,
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({
          message: `Invalid request. ${error.message}`,
        });
      }

      next(error);
      return;
    }
  },

  async createFirst(req: Request, res: Response, next: NextFunction) {
    const result = validator.messaging.first.safeParse({
      ...req.body,
      message_attachments: req.files ?? [],
    });

    if (!result.success) {
      return res.status(422).json({
        message: 'Invalid request body',
        errors: z.treeifyError(result.error).properties,
      });
    }

    const data: NewMessageWithConversationData = {
      receiver_id: Number(result.data.receiver_id),
      content: result.data.content,
      message_attachments: result.data.message_attachments,
    };

    try {
      const { message, subject } = await messageService.makeWithNewConversation(
        data,
        req.user!,
      );
      console.log(subject);
      return res.status(201).json({
        message: 'Message created successfully',
        data: { message, conversation: subject },
      });
    } catch (error) {
      if (error instanceof BadRequestError) {
        return res.status(400).json({
          message: `Invalid request. ${error.message}`,
        });
      }

      next(error);
      return;
    }
  },
};
