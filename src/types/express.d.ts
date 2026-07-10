import type { User } from './user.ts';

declare module 'express-serve-static-core' {
  interface Request {
    authToken: string;
    user: User;
  }
}
