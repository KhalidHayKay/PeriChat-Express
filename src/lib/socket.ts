import { Server } from 'socket.io';
import type { DefaultEventsMap, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';

import { env } from '../config/env.js';
import { sessionService } from '../services/session.service.js';
import { userService } from '../services/user.service.js';
import { conversationService } from '../services/conversation.service.js';

import type { User } from '../types/user.js';

interface SocketData {
  user: User;
  viewingConversation: number | null;
}

type AppSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

type IOServer = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

let io: IOServer;

export const socket = {
  init(httpServer: HttpServer) {
    io = new Server(httpServer, {
      cors: {
        origin: env.cors.origins,
        credentials: true,
      },
    });

    io.use((socket, next) => {
      void authenticate(socket, next);
    });

    io.on('connection', (socket) => {
      void handleConnection(socket);
    });
  },

  get(): IOServer {
    if (!io) {
      throw new Error('Socket.IO has not been initialized.');
    }

    return io;
  },
};

async function authenticate(socket: AppSocket, next: (err?: Error) => void) {
  const authToken = socket.handshake.auth['token'] as unknown;

  if (typeof authToken !== 'string') {
    return next(new Error('Unauthorized'));
  }

  const userId = await sessionService.verify(authToken);

  if (!userId) {
    return next(new Error('Unauthorized'));
  }

  try {
    socket.data.user = await userService.get(Number(userId));
    socket.data.viewingConversation = null;

    next();
  } catch {
    next(new Error('Unauthorized'));
  }
}

async function handleConnection(socket: AppSocket) {
  const { user } = socket.data;

  void socket.join(`user:${user.id}`);

  await userService.addOnlineUser(user.id);

  const onlineUsers = await userService.getOnlineUserIds();

  socket.emit('users:online', onlineUsers);
  socket.broadcast.emit('user:online', {
    userId: user.id,
  });

  registerConversationHandlers(socket);
  registerViewingHandlers(socket, user);
  registerDisconnectHandler(socket, user);
}

function registerConversationHandlers(
  socket: AppSocket,
  // user: User,
) {
  socket.on('conversations:join', (ids: string[]) => {
    ids.forEach((id) => {
      void socket.join(`conversation:${id}`);
    });
  });

  socket.on('conversations:leave', (ids: string[]) => {
    ids.forEach((id) => {
      void socket.leave(`conversation:${id}`);
    });
  });
}

function registerViewingHandlers(socket: AppSocket, user: User) {
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

      void socket.join(`viewing:${conversationId}`);

      if (unreadMessageCount > 0) {
        void conversationService.resetUnread(conversationType, typeId, user.id);
      }
    },
  );

  socket.on('conversation:left', (conversationId: string) => {
    socket.data.viewingConversation = null;

    void socket.leave(`viewing:${conversationId}`);
  });
}

function registerDisconnectHandler(socket: AppSocket, user: User) {
  socket.on('disconnect', () => {
    void (async () => {
      await userService.removeOnlineUser(user.id);

      io.emit('user:offline', {
        userId: user.id,
      });
    })();
  });
}
