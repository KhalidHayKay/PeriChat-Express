import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { sessionService } from '../services/sessionService.js';

export const authTokenValidator: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Request unauthorized' });
      return;
    }

    const token = authHeader.slice(7);
    const userId = await sessionService.verify(token);

    if (!userId) {
      res.status(401).json({ message: 'Request unauthorized' });
      return;
    }

    req.authToken = token;

    next();
  } catch (error) {
    next(error);
  }
};
