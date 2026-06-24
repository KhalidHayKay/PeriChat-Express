import z from 'zod';

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

export const validator = {
  register: registerSchema,
  login: loginSchema,
};
