import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'أدخل البريد الإلكتروني أو رقم الهاتف'),
  password: z.string().min(1, 'أدخل كلمة المرور'),
});

export type LoginForm = z.input<typeof loginSchema>;
