import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'أدخل البريد الإلكتروني').pipe(z.email('بريد إلكتروني غير صالح')),
  password: z.string().min(1, 'أدخل كلمة المرور'),
});

export type LoginForm = z.input<typeof loginSchema>;
