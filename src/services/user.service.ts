import { prisma } from '../../lib/prisma.js';
import type { User } from '../types/user.js';

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

    return user;
  },
};
