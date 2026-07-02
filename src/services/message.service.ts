import { prisma } from '../lib/prisma.js';
import type { NewMessageAttachmentData, NewMessageData } from '../dtos/dto.js';
import type { Attachment, Message } from '../types/message.js';
import type { User } from '../types/user.js';

export const messageService = {
  async make(data: NewMessageData, user: User): Promise<Message> {
    if (data.receiver_id) {
      const conversation = await prisma.conversation.findFirstOrThrow({
        where: { id: Number(data.conversation_id), groupId: null },
        include: {
          userConversations: true,
        },
      });

      const userIds = conversation.userConversations.map((uc) => uc.userId);
      if (!userIds.includes(user.id) || !userIds.includes(data.receiver_id)) {
        throw new Error('Both users must be part of this conversation');
      }

      return this.createMessage(data, user, conversation, {
        receiverId: data.receiver_id,
        groupId: null,
      });
    }

    const conversation = await prisma.conversation.findFirstOrThrow({
      where: { groupId: Number(data.group_id) },
      select: { id: true, groupId: true },
    });

    return this.createMessage(data, user, conversation, {
      receiverId: null,
      groupId: conversation.groupId,
    });
  },

  async createMessage(
    data: NewMessageData,
    user: User,
    conversation: { id: number; groupId: number | null },
    ids: { receiverId: number | null; groupId: number | null },
  ): Promise<Message> {
    const m = await prisma.message.create({
      data: {
        content: data.content ?? null,
        senderId: Number(user.id),
        receiverId: ids.receiverId,
        conversationId: conversation.id,
      },
    });

    const attachments = await this.resolveAttachments(
      m.id,
      data.message_attachments,
    );

    await prisma.conversation.update({
      data: { lastMessageId: m.id },
      where: { id: conversation.id },
    });

    const message = {
      id: m.id,
      content: m.content,
      conversation_id: m.conversationId,
      sender_id: m.senderId,
      receiver_id: ids.receiverId ?? null,
      group_id: ids.groupId ?? null,
      sender: user,
      attachments,
      created_at: m.createdAt.toDateString(),
    };

    return message;
  },

  async resolveAttachments(
    messageId: number,
    files?: NewMessageAttachmentData[],
  ): Promise<Attachment[] | null> {
    if (!files || files.length === 0) {
      return null;
    }

    let attachments: Attachment[] = [];

    for (const file of files) {
      const newAttachment = await prisma.messageAttachment.create({
        data: {
          name: file.originalname,
          path: '',
          mime: file.mimetype,
          size: file.size,
          messageId: messageId,
        },
        select: {
          id: true,
          name: true,
          path: true,
          mime: true,
          size: true,
        },
      });

      attachments?.push({
        id: newAttachment.id,
        message_id: messageId,
        name: newAttachment.name,
        mime: newAttachment.mime,
        size: newAttachment.size,
        url: newAttachment.path,
      });
    }

    return attachments;
  },
};
