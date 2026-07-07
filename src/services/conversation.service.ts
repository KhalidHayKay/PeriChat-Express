import { prisma } from '../lib/prisma.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { ConversationSubject } from '../types/conversation.js';
import type { Message, Message as MessageDto } from '../types/message.js';
import type { User } from '../types/user.js';

type PrismaMessageWithSenderAndAttachments = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        name: true;
        email: true;
        avatar: true;
        emailVerifiedAt: true;
      };
    };
    attachments: true;
  };
}>;

export const conversationService = {
  async getSubjects(userId: number): Promise<ConversationSubject[]> {
    const [privateConversations, groupConversations] = await Promise.all([
      this.getPrivateSubjects(userId),
      this.getGroupSubjects(userId),
    ]);

    const all = [...privateConversations, ...groupConversations];

    // Sort by last_message_date descending, then by name
    return all.sort((a, b) => {
      const dateA = a.last_message_date ? Date.parse(a.last_message_date) : 0;
      const dateB = b.last_message_date ? Date.parse(b.last_message_date) : 0;

      if (dateB !== dateA) {
        return dateB - dateA; // descending
      }

      return a.name.localeCompare(b.name); // ascending by name
    });
  },

  async getMessages(id: number, user: User, limit = 20) {
    const conversation = await this.findConversationWithAccess(id, user);

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { id: 'desc' },
      take: limit + 1,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            emailVerifiedAt: true,
          },
        },
        attachments: true,
      },
    });

    const hasMore = messages.length > limit;
    const pageMessages = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: this.mapMessages(pageMessages.reverse(), conversation.groupId),
      hasMore,
    };
  },

  async getOlderMessages(
    id: number,
    lastMessageId: number,
    user: User,
    limit = 10,
  ) {
    const conversation = await this.findConversationWithAccess(id, user);

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { id: 'desc' },
      cursor: { id: lastMessageId },
      skip: 1,
      take: limit + 1,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            emailVerifiedAt: true,
          },
        },
        attachments: true,
      },
    });

    const hasMore = messages.length > limit;
    const pageMessages = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: this.mapMessages(pageMessages.reverse(), conversation.groupId),
      hasMore,
    };
  },

  async findConversationWithAccess(id: number, user: User) {
    return prisma.conversation.findFirstOrThrow({
      where: {
        id,
        OR: [
          {
            groupId: null,
            userConversations: {
              some: {
                userId: user.id,
              },
            },
          },
          {
            groupId: {
              not: null,
            },
            group: {
              groupUsers: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        groupId: true,
      },
    });
  },

  mapMessages(
    messages: PrismaMessageWithSenderAndAttachments[],
    groupId: number | null,
  ): MessageDto[] {
    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      conversation_id: message.conversationId,
      sender_id: message.senderId,
      receiver_id: message.receiverId,
      group_id: groupId,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        email: message.sender.email,
        avatar: message.sender.avatar,
        emailVerifiedAt: message.sender.emailVerifiedAt,
      },
      attachments: message.attachments.map((attachment) => ({
        id: attachment.id,
        message_id: attachment.messageId,
        name: attachment.name,
        mime: attachment.mime,
        size: attachment.size,
        url: attachment.path,
      })),
      created_at: message.createdAt.toISOString(),
    }));
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

  async getConversingUsers(user: User) {
    const users = await prisma.user.findMany({
      where: {
        id: { not: user.id },
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

      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    });

    return users;
  },

  async incrementUnread(userId: number, message: Message) {
    if (message.receiver_id) {
      await prisma.userConversation.update({
        data: {
          unreadMessagesCount: {
            increment: 1,
          },
        },
        where: {
          conversationId_userId: {
            conversationId: message.conversation_id,
            userId,
          },
        },
      });
      return;
    }

    await prisma.groupUser.update({
      data: { unreadMessagesCount: { increment: 1 } },
      where: {
        groupId_userId: {
          groupId: message.group_id!,
          userId,
        },
      },
    });
  },

  async resetUnread(
    conversationType: 'private' | 'group',
    typeId: number,
    userId: number,
  ) {
    if (conversationType === 'private') {
      await prisma.userConversation.update({
        data: {
          unreadMessagesCount: 0,
        },
        where: {
          conversationId_userId: {
            conversationId: typeId,
            userId,
          },
        },
      });
      return;
    }

    await prisma.groupUser.update({
      data: { unreadMessagesCount: 0 },
      where: {
        groupId_userId: {
          groupId: typeId,
          userId,
        },
      },
    });
  },

  async getPrivateSubjects(userId: number): Promise<ConversationSubject[]> {
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
        last_message_date: lastMsg?.createdAt.toISOString() ?? null,
        unread_messages_count: uc.unreadMessagesCount,
        last_message_attachment_count: lastMsg?.attachments.length ?? 0,
      });
    }

    return results;
  },

  async getGroupSubjects(userId: number): Promise<ConversationSubject[]> {
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
        last_message_date: lastMsg?.createdAt.toISOString() ?? null,
        unread_messages_count: gu.unreadMessagesCount,
        last_message_attachment_count: lastMsg?.attachments.length ?? 0,
      });
    }

    return results;
  },
};
