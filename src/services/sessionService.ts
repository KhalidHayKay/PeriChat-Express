import crypto from 'crypto';
import { redis } from '../../lib/redis.js';

export const sessionService = {
  async create(userId: string): Promise<string> {
    const token = `auth_${generateAuthToken()}`;

    await redis.set(`session:${token}`, userId, 3600);

    return token;
  },

  async verify(token: string): Promise<string | null> {
    return await redis.get(`session:${token}`);
  },

  async destroy(token: string) {
    return await redis.delete(`session:${token}`);
  },
};

const generateAuthToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
