import type { NextFunction, Request, Response } from 'express';
import { validator } from '../validator/schema.js';
import { messageService } from '../services/message.service.js';
import z from 'zod';
import { BadRequestError } from '../errors/error-types.js';

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

    try {
      const message = await messageService.make(result.data, req.user!);
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
};
