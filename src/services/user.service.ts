import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import type { User } from '../types/user.js';

const ONLINE_USERS_KEY = 'online_users';

export const userService = {
  async get(id: number): Promise<User> {
    const user = await prisma.user.findFirstOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        emailVerifiedAt: true,
      },
    });

    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt
        ? user.emailVerifiedAt.toISOString()
        : null,
    };
  },

  async addOnlineUser(userId: number): Promise<void> {
    await redis.sAdd(ONLINE_USERS_KEY, userId);
  },

  async getOnlineUserIds(): Promise<number[]> {
    return await redis.sMembers(ONLINE_USERS_KEY);
  },

  async removeOnlineUser(userId: number): Promise<void> {
    await redis.sRem(ONLINE_USERS_KEY, userId);
  },
};
