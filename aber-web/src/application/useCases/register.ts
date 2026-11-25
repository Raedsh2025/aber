import { z } from 'zod';

const PASSWORD_MIN_LENGTH = 8;

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'أدخل الاسم الكامل'),
    email: z
      .string()
      .trim()
      .min(1, 'أدخل البريد الإلكتروني')
      .pipe(z.email('بريد إلكتروني غير صالح')),
    phone: z
      .string()
      .trim()
      .min(1, 'أدخل رقم الهاتف')
      .pipe(z.string().regex(/^\+?[0-9][0-9\s-]{4,23}$/, 'رقم هاتف غير صالح')),
    password: z.string().min(PASSWORD_MIN_LENGTH, 'كلمة المرور 8 أحرف على الأقل'),
    confirmPassword: z.string(),
  })
  .refine((form) => form.password === form.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  });

export type RegisterForm = z.input<typeof registerSchema>;
