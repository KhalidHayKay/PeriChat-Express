import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '../config/env.js';
import { sessionService } from '../services/session.service.js';
import { userService } from '../services/user.service.js';
import type { User } from '../types/user.js';

let io: Server;

export const socket = {
  init: (httpServer: HttpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: env.cors.origins,
        credentials: true,
      },
    });

    io.use(async (socket, next) => {
      const authToken = socket.handshake.auth['token'];

      if (!authToken) return next(new Error('Unauthorized'));

      const userId = await sessionService.verify(authToken);

      if (!userId) return next(new Error('Unauthorized'));

      try {
        const user = await userService.get(Number(userId));
        await userService.addOnlineUser(user.id);
        socket.data.user = user;
        next();
      } catch (error) {
        return next(new Error('Unauthorized'));
      }
    });

    io.on('connection', async (socket) => {
      const user = socket.data.user as User;

      const onlineUserIds = await userService.getOnlineUserIds();

      socket.emit('users:online', onlineUserIds);

      socket.broadcast.emit('user:online', { userId: user.id });

      socket.on('disconnect', async () => {
        await userService.removeOnlineUser(user.id);
        io.emit('user:offline', { userId: user.id });

        console.log(`Client disconnected: ${socket.id}`);
      });

      console.log(`Client connected: ${socket.id}`);
    });
  },

  get: () => {
    if (!io) throw new Error('Socket.IO has not been initialized.');
    return io;
  },
};
