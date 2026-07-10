import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { sessionService } from '../services/session.service.js';
import { userService } from '../services/user.service.js';

export const authMiddleware: RequestHandler = async (
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

    let user;

    try {
      user = await userService.get(Number(userId));
    } catch (error) {
      console.log(error);
      res.status(401).json({ message: 'Request unauthorized' });
      return;
    }

    req.authToken = token;
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
