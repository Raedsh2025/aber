import { zodResolver } from '@hookform/resolvers/zod';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { loginSchema, type LoginForm } from '@/application/useCases/login';
import { landingPathFor } from '@/domain/services/landingPath';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Input } from '@/presentation/components/ui/Input';
import { useAuthStore } from '@/presentation/stores/authStore';
import { useLogin } from './hooks/useLogin';

export function LoginPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { run, loading, error } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (user) return <Navigate to={landingPathFor(user.role)} replace />;

  // The error is already stored by useAsyncAction and shown below.
  const onSubmit = (form: LoginForm): Promise<void> => run(form).catch(() => undefined);

  return (
    <Card variant="highlight" className="w-full max-w-md">
      <h2 className="text-[20px] font-bold text-navy-900">تسجيل الدخول</h2>
      <p className="mt-1 mb-5 text-muted">أهلًا بعودتك، أدخل بياناتك للمتابعة.</p>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="البريد الإلكتروني أو رقم الهاتف"
          type="text"
          dir="ltr"
          autoComplete="username"
          className="text-start"
          error={errors.identifier?.message}
          {...register('identifier')}
        />
        <Input
          label="كلمة المرور"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          className="text-start"
          error={errors.password?.message}
          {...register('password')}
        />
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-danger">
            {error}
          </p>
        )}
        <Button type="submit" loading={loading}>
          دخول
        </Button>
      </form>
      <p className="mt-4 text-center text-small text-muted">
        ليس لديك حساب؟{' '}
        <Link to="/register" className="font-semibold text-navy-900 underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </Card>
  );
}
