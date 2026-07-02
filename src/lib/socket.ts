import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '../config/env.js';
import { sessionService } from '../services/session.service.js';
import { userService } from '../services/user.service.js';
import type { User } from '../types/user.js';
// import { redis } from './redis.js';

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
        socket.data.user = user;
        next();
      } catch (error) {
        return next(new Error('Unauthorized'));
      }
    });

    io.on('connection', async (socket) => {
      const user = socket.data.user as User;

      // Add user to online set and get all online users
      // await redis.addOnlineUser(user.id);
      // const onlineUsers = await redis.getOnlineUsers();

      io.emit('user:online', {
        userId: user.id,
        // onlineUserIds: onlineUsers,
      });

      console.log(`Client connected: ${socket.id}`);
      socket.on('disconnect', async () => {
        // await redis.removeOnlineUser(user.id);
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  },

  get: () => {
    if (!io) throw new Error('Socket.IO has not been initialized.');
    return io;
  },
};
