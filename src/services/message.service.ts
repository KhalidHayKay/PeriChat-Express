import { prisma } from '../../lib/prisma.js';
import type { NewMessageAttachmentData, NewMessageData } from '../dtos/dto.js';
import { getIO } from '../socket.js';
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
      if (
        !userIds.includes(user.id) ||
        !userIds.includes(BigInt(data.receiver_id))
      ) {
        throw new Error('Both users must be part of this conversation');
      }

      return this.createMessage(data, user, conversation, {
        receiverId: Number(data.receiver_id),
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
    conversation: { id: bigint; groupId: bigint | null },
    ids: { receiverId: number | null; groupId: bigint | null },
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

    const res = {
      id: m.id.toString(),
      content: m.content,
      conversation_id: m.conversationId.toString(),
      sender_id: m.senderId.toString(),
      receiver_id: ids.receiverId?.toString() ?? null,
      group_id: ids.groupId?.toString() ?? null,
      sender: user,
      attachments,
      created_at: m.createdAt.toDateString(),
    };

    getIO().emit(`CONVO:${conversation.id}`, res);

    return res;
  },

  async resolveAttachments(
    messageId: bigint,
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
        id: newAttachment.id.toString(),
        message_id: messageId.toString(),
        name: newAttachment.name,
        mime: newAttachment.mime,
        size: newAttachment.size,
        url: newAttachment.path,
      });
    }

    return attachments;
  },
};
