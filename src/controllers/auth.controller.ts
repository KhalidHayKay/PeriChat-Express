import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { validator } from '../validator/schema.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import bcrypt from 'bcrypt';
import z from 'zod';
import { sessionService } from '../services/session.service.js';
import type { User } from '../types/user.js';

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    const result = validator.auth.login.safeParse(req.body);

    if (!result.success) {
      return res.status(422).json({
        message: 'Invalid request body',
        errors: z.treeifyError(result.error).properties,
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: result.data.email },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          emailVerifiedAt: true,

          // Important to remove password from the data returned to the client
          password: true,
        },
      });

      const match = await bcrypt.compare(
        result.data.password,
        user?.password ?? '',
      );

      if (!user || !match) {
        return res.status(401).json({
          message: 'Invalid credentials. Please check your email or password.',
        });
      }

      const token = await sessionService.create(String(user.id));

      const authUser: User = {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt
          ? user.emailVerifiedAt.toISOString()
          : null,
      };

      return res.json({
        message: 'Login successful',
        user: authUser,
        token,
      });
    } catch (err: unknown) {
      next(err);
      return;
    }
  },

  register: async (req: Request, res: Response, next: NextFunction) => {
    const result = validator.auth.register.safeParse(req.body);

    if (!result.success) {
      return res.status(422).json({
        message: 'Invalid request body',
        errors: z.treeifyError(result.error).properties,
      });
    }

    const passwordHash = await bcrypt.hash(result.data.password, 12);

    try {
      const user = await prisma.user.create({
        data: {
          name: result.data.name,
          email: result.data.email,
          password: passwordHash,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          emailVerifiedAt: true,
        },
      });

      const token = await sessionService.create(String(user.id));

      return res.status(201).json({
        message: 'Registration successful',
        user: user,
        token,
      });
    } catch (err: unknown) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return res
          .status(409)
          .json({ message: 'User with submitted email already exists' });
      }

      next(err);
      return;
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sessionService.destroy(req?.authToken);
      if (result === 1) {
        return res.json({ message: 'Logout successful' });
      } else {
        return res.status(500).json({ message: 'Internal server error' });
      }
    } catch (err) {
      next(err);
      return;
    }
  },
};
