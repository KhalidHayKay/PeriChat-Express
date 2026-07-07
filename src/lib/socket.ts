import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '../config/env.js';
import { sessionService } from '../services/session.service.js';
import { userService } from '../services/user.service.js';
import type { User } from '../types/user.js';
import { conversationService } from '../services/conversation.service.js';

let io: Server;

export const socket = {
  init: (httpServer: HttpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: env.cors.origins,
        credentials: true,
      },
    });

    // Auth middleware — runs before connection is established
    io.use(async (socket, next) => {
      const authToken = socket.handshake.auth['token'];
      if (!authToken) return next(new Error('Unauthorized'));

      const userId = await sessionService.verify(authToken);
      if (!userId) return next(new Error('Unauthorized'));

      try {
        const user = await userService.get(Number(userId));
        socket.data.user = user;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });

    io.on('connection', async (socket) => {
      const user = socket.data.user as User;

      // Personal room for targeting this user directly
      socket.join(`user:${user.id}`);

      await userService.addOnlineUser(user.id);
      const onlineUserIds = await userService.getOnlineUserIds();

      // Send full online list to the connecting user only
      socket.emit('users:online', onlineUserIds);
      // Notify everyone else that this user came online
      socket.broadcast.emit('user:online', { userId: user.id });

      // Conversation room management
      socket.on('conversations:join', (ids: string[]) => {
        ids.forEach((id) => socket.join(`conversation:${id}`));
      });

      socket.on('conversations:leave', (ids: string[]) => {
        ids.forEach((id) => socket.leave(`conversation:${id}`));
      });

      // Viewing state — used to skip unread increment for active conversation
      socket.on(
        'conversation:viewing',
        ({
          conversationId,
          conversationType,
          typeId,
          unreadMessageCount,
        }: {
          conversationId: number;
          conversationType: 'private' | 'group';
          typeId: number;
          unreadMessageCount: number;
        }) => {
          socket.data.viewingConversation = conversationId;
          socket.join(`viewing:${conversationId}`);

          if (unreadMessageCount > 0) {
            conversationService.resetUnread(conversationType, typeId, user.id);
          }
        },
      );

      socket.on('conversation:left', (conversationId: string) => {
        socket.data.viewingConversation = null;
        socket.leave(`viewing:${conversationId}`);
      });

      socket.on('disconnect', async () => {
        await userService.removeOnlineUser(user.id);
        io.emit('user:offline', { userId: user.id });
      });
    });
  },

  get: () => {
    if (!io) throw new Error('Socket.IO has not been initialized.');
    return io;
  },
};
