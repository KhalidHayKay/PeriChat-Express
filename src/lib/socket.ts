import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '../config/env.js';

let io: Server;

export const socket = {
  init: (httpServer: HttpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: env.cors.origins,
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  },

  get: () => {
    if (!io) throw new Error('Socket.IO has not been initialized.');
    return io;
  },
};
