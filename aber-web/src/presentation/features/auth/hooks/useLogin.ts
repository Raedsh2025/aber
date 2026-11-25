import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginForm } from '@/application/useCases/login';
import { landingPathFor } from '@/domain/services/landingPath';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';
import { useAuthStore } from '@/presentation/stores/authStore';

export function useLogin() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const action = useCallback(
    async (form: LoginForm): Promise<void> => {
      const { identifier, password } = loginSchema.parse(form);
      await login(identifier, password);
      const user = useAuthStore.getState().user;
      navigate(user ? landingPathFor(user.role) : '/login', { replace: true });
    },
    [login, navigate],
  );

  return useAsyncAction(action);
}
