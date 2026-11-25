import { zodResolver } from '@hookform/resolvers/zod';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { registerSchema, type RegisterForm } from '@/application/useCases/register';
import { landingPathFor } from '@/domain/services/landingPath';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Input } from '@/presentation/components/ui/Input';
import { useAuthStore } from '@/presentation/stores/authStore';
import { useRegister } from './hooks/useRegister';

export function RegisterPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { run, loading, error } = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  if (user) return <Navigate to={landingPathFor(user.role)} replace />;

  // The error is already stored by useAsyncAction and shown below.
  const onSubmit = (form: RegisterForm): Promise<void> => run(form).catch(() => undefined);

  return (
    <Card variant="highlight" className="w-full max-w-md">
      <h2 className="text-[20px] font-bold text-navy-900">إنشاء حساب جديد</h2>
      <p className="mt-1 mb-5 text-muted">حساب زبون لمتابعة شحناتك وطلباتك.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="الاسم الكامل"
          type="text"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="البريد الإلكتروني"
          type="email"
          dir="ltr"
          autoComplete="email"
          className="text-start"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="رقم الهاتف"
          type="tel"
          dir="ltr"
          autoComplete="tel"
          className="text-start"
          hint="ستظهر لك الشحنات المسجلة على هذا الرقم"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="كلمة المرور"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          className="text-start"
          hint="8 أحرف على الأقل"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="تأكيد كلمة المرور"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          className="text-start"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-danger">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading}>
          إنشاء الحساب
        </Button>
      </form>
      <p className="mt-4 text-center text-small text-muted">
        لديك حساب بالفعل؟{' '}
        <Link to="/login" className="font-semibold text-navy-900 underline">
          تسجيل الدخول
        </Link>
      </p>
    </Card>
  );
}
