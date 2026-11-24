import { zodResolver } from '@hookform/resolvers/zod';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { loginSchema, type LoginForm } from '@/application/useCases/login';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Input } from '@/presentation/components/ui/Input';
import { useAuthStore } from '@/presentation/stores/authStore';
import { DEFAULT_LANDING_PATH, useLogin } from './hooks/useLogin';

export function LoginPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { run, loading, error } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (user) return <Navigate to={DEFAULT_LANDING_PATH} replace />;

  // The error is already stored by useAsyncAction and shown below.
  const onSubmit = (form: LoginForm): Promise<void> => run(form).catch(() => undefined);

  return (
    <Card variant="highlight" className="w-full max-w-md">
      <h2 className="text-navy-900 text-[20px] font-bold mb-4">تسجيل الدخول</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Input
          label="البريد الإلكتروني"
          type="email"
          dir="ltr"
          autoComplete="username"
          className="text-start"
          error={errors.email?.message}
          {...register('email')}
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
    </Card>
  );
}
