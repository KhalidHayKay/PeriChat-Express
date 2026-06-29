import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { groupService } from '../services/group.service.js';
import { validator } from '../validator/schema.js';

export const groupController = {
  async index(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await groupService.getJoinable(req.user!);

      return res.json({ message: 'Groups fetched successfully', data: groups });
    } catch (error) {
      next(error);
      return;
    }
  },

  async create(req: Request, res: Response) {
    const result = validator.group.mew.safeParse(req.body);

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
  },

  async join(_req: Request, _res: Response) {
    //
  },

  async leave(_req: Request, _res: Response) {
    //
  },
};
