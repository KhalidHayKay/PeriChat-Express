import z, { string } from 'zod';

const registerSchema = z
  .object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  });

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const newMessageSchema = z
  .object({
    content: z.string().max(5000).optional(),
    conversation_id: z.string(),
    receiver_id: z.string().optional(),
    group_id: z.string().optional(),
    message_attachments: z
      .array(
        z.object({
          originalname: z.string(),
          mimetype: z.string(),
          size: z.number().max(10 * 102400),
          buffer: z.instanceof(Buffer),
        }),
      )
      .max(10)
      .optional(),
  })
  .refine((data) => data.group_id || data.receiver_id, {
    message: 'Either group_id or receiver_id must be provided',
    path: ['group_id'],
  })
  .refine(
    (data) => data.content || (data.message_attachments?.length ?? 0) > 0,
    {
      message: 'Either content or at least one attachment must be provided',
      path: ['content'],
    },
  );

const firstMessageSchema = z
  .object({
    content: z.string().max(5000).optional(),
    receiver_id: z.string(),
    message_attachments: z
      .array(
        z.object({
          originalname: z.string(),
          mimetype: z.string(),
          size: z.number().max(10 * 102400),
          buffer: z.instanceof(Buffer),
        }),
      )
      .max(10)
      .optional(),
  })
  .refine(
    (data) => data.content || (data.message_attachments?.length ?? 0) > 0,
    {
      message: 'Either content or at least one attachment must be provided',
      path: ['content'],
    },
  );

const newGroupSchema = z.object({
  name: z.string().min(1),
  description: string().nullable().optional().default(null),
  avatar: string().nullable().optional().default(null),
  is_private: z.boolean().optional().default(false),
  member_ids: z.array(z.number()),
});

export const validator = {
  auth: {
    register: registerSchema,
    login: loginSchema,
  },

  messaging: {
    new: newMessageSchema,
    first: firstMessageSchema,
  },

  group: {
    new: newGroupSchema,
  },
};
