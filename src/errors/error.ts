import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import type { Request, Response, NextFunction } from 'express';
import { BadRequestError } from './error-types.js';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error(err);

  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json({
      message: 'One or more requested resources not found',
    });
    return;
  }

  if (err instanceof BadRequestError) {
    return res.status(400).json({
      message: `Invalid request. ${err.message}`,
    });
  }

  res.status(500).json({ message: 'Internal server error' });
  return;
};
