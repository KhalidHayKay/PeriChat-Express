import { prisma } from '../lib/prisma.js';
import type {
  NewMessageAttachmentData,
  NewMessageData,
  NewMessageWithConversationData,
} from '../dtos/dto.js';
import type { Attachment, Message } from '../types/message.js';
import type { User } from '../types/user.js';
import type { ConversationSubject } from '../types/conversation.js';

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

      return this.createMessage(
        user,
        conversation,
        {
          receiverId: data.receiver_id,
          groupId: null,
        },
        data.content,
        data.message_attachments,
      );
    }

    const conversation = await prisma.conversation.findFirstOrThrow({
      where: { groupId: Number(data.group_id) },
      select: { id: true, groupId: true },
    });

    return this.createMessage(
      user,
      conversation,
      {
        receiverId: null,
        groupId: conversation.groupId,
      },
      data.content,
      data.message_attachments,
    );
  },

  async makeWithNewConversation(
    data: NewMessageWithConversationData,
    user: User,
  ): Promise<{ subject: ConversationSubject; message: Message }> {
    const conversation = await prisma.conversation.create({
      data: { groupId: null },
    });

    const receiver = await prisma.user.findUniqueOrThrow({
      where: { id: data.receiver_id },
      select: {
        id: true,
        name: true,
        avatar: true,
        email: true,
      },
    });

    await prisma.userConversation.createMany({
      data: [user.id, data.receiver_id].map((id) => ({
        userId: id,
        conversationId: conversation.id,
      })),
    });

    const message = await this.createMessage(
      user,
      conversation,
      {
        receiverId: data.receiver_id,
        groupId: null,
      },
      data.content,
      data.message_attachments,
    );

    const subject: ConversationSubject = {
      type: 'private',
      id: conversation.id,
      type_id: receiver.id,
      name: receiver.name,
      avatar: receiver.avatar,
      last_message: message.content,
      last_message_sender_id: user.id,
      last_message_date: message.created_at,
      unread_messages_count: 0,
      last_message_attachment_count: message.attachments?.length ?? 0,
      group_member_ids: null,
      group_owner: null,
    };

    return { subject, message };
  },

  async createMessage(
    user: User,
    conversation: { id: number; groupId: number | null },
    ids: { receiverId: number | null; groupId: number | null },
    content?: string,
    attachmentData?: NewMessageAttachmentData[],
  ): Promise<Message> {
    const m = await prisma.message.create({
      data: {
        content: content ?? null,
        senderId: Number(user.id),
        receiverId: ids.receiverId,
        conversationId: conversation.id,
      },
    });

    const attachments = await this.resolveAttachments(m.id, attachmentData);

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
      created_at: m.createdAt.toISOString(),
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

    const attachments: Attachment[] = [];

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
