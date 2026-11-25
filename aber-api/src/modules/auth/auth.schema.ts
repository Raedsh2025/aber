import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 100;

export const loginBody = z.object({
  identifier: z.string().min(1), // email or phone number
  password: z.string().min(1),
});
export type LoginBody = z.infer<typeof loginBody>;

export const registerBody = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.email(),
  phone: z.string().min(6).max(25),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
});
export type RegisterBody = z.infer<typeof registerBody>;
