import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterForm } from '@/application/useCases/register';
import { landingPathFor } from '@/domain/services/landingPath';
import { useAsyncAction } from '@/presentation/hooks/useAsyncAction';
import { useAuthStore } from '@/presentation/stores/authStore';

export function useRegister() {
  const registerAccount = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const action = useCallback(
    async (form: RegisterForm): Promise<void> => {
      const parsed = registerSchema.parse(form);
      await registerAccount({
        fullName: parsed.fullName,
        email: parsed.email,
        phone: parsed.phone,
        password: parsed.password,
      });
      const user = useAuthStore.getState().user;
      navigate(user ? landingPathFor(user.role) : '/login', { replace: true });
    },
    [registerAccount, navigate],
  );

  return useAsyncAction(action);
}
