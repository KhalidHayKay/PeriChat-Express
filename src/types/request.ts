import type { User } from './user.js';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  authToken: string;
  user: User;
}
