import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginForm } from '@/application/useCases/login';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';
import { useAuthStore } from '@/presentation/stores/authStore';

export const DEFAULT_LANDING_PATH = '/dashboard';

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const action = useCallback(
    async (form: LoginForm): Promise<void> => {
      const { email, password } = loginSchema.parse(form);
      await login(email, password);
      navigate(DEFAULT_LANDING_PATH, { replace: true });
    },
    [login, navigate],
  );

  return useAsyncAction(action);
}
