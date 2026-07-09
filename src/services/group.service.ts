import { prisma } from '../lib/prisma.js';
import type { NewGroupData } from '../dtos/dto.js';
import { publicUserSelect, type User } from '../types/user.js';
import type { Group } from '../types/group.js';

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

  async make(data: NewGroupData, user: User): Promise<Group> {
    const group = await prisma.group.create({
      data: {
        ownerId: user.id,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        isPrivate: data.is_private,
      },
    });

    const memberIds = [...new Set([...data.member_ids, user.id])];

    if (memberIds.length > 0) {
      await prisma.groupUser.createMany({
        data: memberIds.map((memberId) => ({
          groupId: group.id,
          userId: memberId,
        })),
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        groupId: group.id,
      },
    });

    return {
      id: group.id,
      name: group.name,
      avatar: group.avatar,
      description: group.description,
      is_private: group.isPrivate,
      member_ids: memberIds,
      owner: user,
      created_at: group.createdAt.toISOString(),
      conversation_id: conversation.id,
    };
  },

  async join(groupId: string, user: User): Promise<Group> {
    const group = await this.getById(groupId);

    await prisma.groupUser.create({
      data: {
        userId: user.id,
        groupId: group.id,
      },
    });

    const conversation = await prisma.conversation.findFirstOrThrow({
      where: { groupId: group.id },
      select: { id: true },
    });

    return {
      id: group.id,
      name: group.name,
      avatar: group.avatar,
      description: group.description,
      is_private: group.isPrivate,
      member_ids: group.groupUsers.map((gu) => gu.userId),
      created_at: group.createdAt.toISOString(),
      conversation_id: conversation.id,
      owner: group.owner,
    };
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
      include: {
        owner: {
          select: publicUserSelect,
        },
        groupUsers: {
          select: {
            userId: true,
          },
        },
      },
    });

    return group;
  },

  async getMembersIds(groupId: number) {
    const groupUsers = await prisma.groupUser.findMany({
      select: { userId: true },
      where: { groupId },
    });

    return groupUsers.map((gu) => gu.userId);
  },
};
