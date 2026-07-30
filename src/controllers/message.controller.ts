import type { NextFunction, Request, Response } from 'express';
import { validator } from '../validator/schema.js';
import { messageService } from '../services/message.service.js';
import z from 'zod';
import type {
  NewMessageData,
  NewMessageWithConversationData,
} from '../dtos/dto.js';
import { socket } from '../lib/socket.js';
import type { Message } from '../types/message.js';
import { groupService } from '../services/group.service.js';
import { conversationService } from '../services/conversation.service.js';
import type { ConversationSubject } from '../types/conversation.js';
import type { User } from '../types/user.js';

export const messageController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    const result = validator.messaging.new.safeParse({
      ...req.body,
      message_attachments: req.files ?? [],
    });

    if (!result.success) {
      return res.status(422).json({
        message: 'Invalid request body',
        errors: z.treeifyError(result.error).properties,
      });
    }

    const data: NewMessageData = {
      conversation_id: Number(result.data.conversation_id),
      content: result.data.content,
      message_attachments: result.data.message_attachments,
      sender_id: req.user.id,
      receiver_id: Number(result.data.receiver_id),
      group_id: Number(result.data.group_id),
    };

    try {
      const message = await messageService.make(data, req.user);

      await runSideEffects(message);

      return res.status(201).json({
        message: 'Message created successfully',
        data: message,
      });
    } catch (error) {
      next(error);
      return;
    }
  },

  createFirst: async (req: Request, res: Response, next: NextFunction) => {
    const result = validator.messaging.first.safeParse({
      ...req.body,
      message_attachments: req.files ?? [],
    });

    if (!result.success) {
      return res.status(422).json({
        message: 'Invalid request body',
        errors: z.treeifyError(result.error).properties,
      });
    }

    const data: NewMessageWithConversationData = {
      message_attachments: result.data.message_attachments,
      content: result.data.content,
      sender_id: req.user.id,
      receiver_id: Number(result.data.receiver_id),
    };

    try {
      const { message, receiver } =
        await messageService.makeWithNewConversation(data, req.user);

      const { senderSubject, receiverSubject } = constructParticipantSubject(
        message,
        req.user,
        receiver,
      );

      await runFirstMessageSideEffect(
        req.user,
        message,
        senderSubject,
        receiverSubject,
      );

      return res.status(201).json({
        message: 'Message created successfully',
        data: { message, conversation: senderSubject },
      });
    } catch (error) {
      next(error);
      return;
    }
  },
};

const runSideEffects = async (message: Message) => {
  const io = socket.get();

  io.to(`conversation:${message.conversation_id}`).emit(
    'message:sent',
    message,
  );

  const viewingRoom = `viewing:${message.conversation_id}`;
  const socketsViewing = await io.in(viewingRoom).fetchSockets();
  const viewingUserIds = socketsViewing.map((s) => s.data.user.id);

  if (message.receiver_id) {
    if (!viewingUserIds.includes(message.receiver_id)) {
      await conversationService.incrementUnread(message.receiver_id, message);
    }
    return;
  }

  const groupMemberIds = await groupService.getMembersIds(message.group_id!);

  for (const memberId of groupMemberIds) {
    if (!viewingUserIds.includes(memberId)) {
      await conversationService.incrementUnread(memberId, message);
    }
  }
};

const runFirstMessageSideEffect = async (
  user: User,
  message: Message,
  senderSubject: ConversationSubject,
  receiverSubject: ConversationSubject,
) => {
  const io = socket.get();
  io.to(`user:${user.id}`).emit('created:conversation', {
    message,
    subject: senderSubject,
  });
  io.to(`user:${message.receiver_id}`).emit('created:conversation', {
    message,
    subject: receiverSubject,
  });

  await conversationService.incrementUnread(message.receiver_id!, message);
};

const constructParticipantSubject = (
  message: Message,
  user: User,
  receiver: User,
): {
  senderSubject: ConversationSubject;
  receiverSubject: ConversationSubject;
} => {
  const senderSubject: ConversationSubject = {
    type: 'private',
    id: message.conversation_id,
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

  const receiverSubject: ConversationSubject = {
    type: 'private',
    id: message.conversation_id,
    type_id: user.id,
    name: user.name,
    avatar: user.avatar,
    last_message: message.content,
    last_message_sender_id: user.id,
    last_message_date: message.created_at,
    unread_messages_count: 0,
    last_message_attachment_count: message.attachments?.length ?? 0,
    group_member_ids: null,
    group_owner: null,
  };

  return { senderSubject, receiverSubject };
};
