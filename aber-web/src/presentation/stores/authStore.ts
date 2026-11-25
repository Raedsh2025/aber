import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authRepository } from '@/app/container';
import type { User } from '@/domain/entities/User';
import type { RegisterInput } from '@/domain/repositories/AuthRepository';
import { tokenStorage } from '@/infrastructure/http/tokenStorage';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,
      login: async (identifier, password) => {
        set({ loading: true, error: null });
        try {
          const { token, user } = await authRepository.login(identifier, password);
          tokenStorage.set(token);
          set({ user, loading: false });
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : 'فشل تسجيل الدخول' });
          throw e;
        }
      },
      register: async (input) => {
        set({ loading: true, error: null });
        try {
          const { token, user } = await authRepository.register(input);
          tokenStorage.set(token);
          set({ user, loading: false });
        } catch (e) {
          set({ loading: false, error: e instanceof Error ? e.message : 'فشل إنشاء الحساب' });
          throw e;
        }
      },
      logout: () => {
        tokenStorage.clear();
        set({ user: null, error: null });
      },
    }),
    { name: 'aber-auth', partialize: (state) => ({ user: state.user }) },
  ),
);

// Any 401 from Axios signs the user out automatically.
window.addEventListener('auth:logout', () => useAuthStore.getState().logout());
