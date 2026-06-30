import { prisma } from '../lib/prisma.js';
import type { ConversationSubject } from '../types/conversation.js';
import type { User } from '../types/user.js';

export const conversationService = {
  /**
   * Get all conversation subjects (private + groups) for a user,
   * sorted by last message date (descending) then by name
   */
  async getSubjects(userId: bigint): Promise<ConversationSubject[]> {
    const [privateConversations, groupConversations] = await Promise.all([
      this.getPrivateSubjects(userId),
      this.getGroupSubjects(userId),
    ]);

    const all = [...privateConversations, ...groupConversations];

    // Sort by last_message_date descending, then by name
    return all.sort((a, b) => {
      const dateA = a.last_message_date?.getTime() ?? 0;
      const dateB = b.last_message_date?.getTime() ?? 0;

      if (dateB !== dateA) {
        return dateB - dateA; // descending
      }

      return a.name.localeCompare(b.name); // ascending by name
    });
  },

  /**
   * Get private conversations for a user
   */
  async getPrivateSubjects(userId: bigint): Promise<ConversationSubject[]> {
    const userConversations = await prisma.userConversation.findMany({
      where: {
        userId,
        conversation: { groupId: null },
      },
      include: {
        conversation: {
          include: {
            lastMessage: {
              include: {
                attachments: true,
              },
            },
          },
        },
      },
    });

    const results: ConversationSubject[] = [];

    for (const uc of userConversations) {
      if (!uc.conversation) continue;

      const otherUsers = await prisma.userConversation.findMany({
        where: {
          conversationId: uc.conversation.id,
          userId: { not: userId },
        },
        include: {
          user: true,
        },
      });

      if (otherUsers.length === 0) continue;

      const otherUser = otherUsers[0]!.user;
      const lastMsg = uc.conversation.lastMessage;

      // Verify the message involves the current user (sender or receiver)
      if (
        lastMsg &&
        lastMsg.senderId !== userId &&
        lastMsg.receiverId !== userId
      ) {
        continue;
      }

      results.push({
        type: 'private',
        id: uc.conversation.id,
        type_id: otherUser.id,
        name: otherUser.name,
        avatar: otherUser.avatar,
        last_message: lastMsg?.content ?? null,
        last_message_sender_id: lastMsg?.senderId ?? null,
        last_message_date: lastMsg?.createdAt ?? null,
        unread_messages_count: uc.unreadMessagesCount,
        last_message_attachment_count: lastMsg?.attachments.length ?? 0,
      });
    }

    return results;
  },

  /**
   * Get group conversations for a user
   */
  async getGroupSubjects(userId: bigint): Promise<ConversationSubject[]> {
    const groupUsers = await prisma.groupUser.findMany({
      where: { userId },
      include: {
        group: true,
      },
    });

    const results: ConversationSubject[] = [];

    for (const gu of groupUsers) {
      const conversation = await prisma.conversation.findFirst({
        where: { groupId: gu.groupId },
        include: {
          lastMessage: {
            include: {
              attachments: true,
            },
          },
        },
      });

      // Group may not have a conversation yet
      if (!conversation) continue;

      const lastMsg = conversation.lastMessage;

      results.push({
        type: 'group',
        id: conversation.id,
        type_id: gu.groupId,
        name: gu.group.name,
        avatar: gu.group.avatar,
        last_message: lastMsg?.content ?? null,
        last_message_sender_id: lastMsg?.senderId ?? null,
        last_message_date: lastMsg?.createdAt ?? null,
        unread_messages_count: gu.unreadMessagesCount,
        last_message_attachment_count: lastMsg?.attachments.length ?? 0,
      });
    }

    return results;
  },

  async getNonConversingUsers(user: User) {
    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
        NOT: {
          conversations: {
            some: {
              conversation: {
                userConversations: {
                  some: {
                    userId: user.id,
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    return users;
  },
};
