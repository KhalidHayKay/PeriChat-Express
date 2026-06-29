import { prisma } from '../../lib/prisma.js';
import type { NewGroupData } from '../dtos/dto.js';
import type { User } from '../types/user.js';

export const groupService = {
  async getJoinable(user: User) {
    return prisma.group.findMany({
      where: {
        isPrivate: false,
        ownerId: { not: user.id },
        groupUsers: {
          none: {
            userId: user.id,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async make(data: NewGroupData, user: User) {
    const group = await prisma.group.create({
      data: {
        ownerId: user.id,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        isPrivate: data.isPrivate,
      },
    });

    const memberUserIds = data.userIds.filter(
      (id) => id !== user.id.toString(),
    );

    if (memberUserIds.length > 0) {
      await prisma.groupUser.createMany({
        data: memberUserIds.map((memberId) => ({
          groupId: group.id,
          userId: Number(memberId),
        })),
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        groupId: group.id,
      },
    });

    return { ...group, conversationId: conversation.id };
  },

  async join(groupId: string, user: User) {
    const group = await this.getById(groupId);

    await prisma.groupUser.create({
      data: {
        userId: user.id,
        groupId: group.id,
      },
    });

    return group;
  },

  async leave(groupId: string, user: User) {
    const group = await this.getById(groupId);

    const deleted = await prisma.groupUser.deleteMany({
      where: {
        userId: user.id,
        groupId: group.id,
      },
    });

    if (deleted.count === 0) {
      console.log("No record was deleted from 'groups'");
    }

    return;
  },

  async getById(id: string) {
    const group = await prisma.group.findUniqueOrThrow({
      where: { id: Number(id) },
    });

    return group;
  },
};
