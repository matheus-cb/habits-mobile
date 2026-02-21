import { create } from 'zustand';
import { authApi } from '@/lib/api/auth';
import type { User, LoginCredentials, RegisterCredentials } from '@/types';

const errorMessages: Record<string, string> = {
  'Invalid credentials': 'Email ou senha incorretos',
  'Email already exists': 'Este email já está cadastrado',
  'User not found': 'Usuário não encontrado',
};

function translateError(message: string): string {
  return errorMessages[message] || message;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  loadUser: async () => {
    const token = await authApi.getToken();
    if (!token) {
      set({ loading: false, isAuthenticated: false, user: null });
      return;
    }
    try {
      const user = await authApi.getProfile();
      set({ user, isAuthenticated: true, loading: false });
    } catch {
      await authApi.removeToken();
      set({ user: null, isAuthenticated: false, loading: false });
    }
  },

  login: async (credentials) => {
    try {
      set({ error: null });
      const { accessToken, user } = await authApi.login(credentials);
      await authApi.saveToken(accessToken);
      set({ user, isAuthenticated: true });
      return true;
    } catch (err: any) {
      set({ error: translateError(err.message) || 'Erro ao fazer login' });
      return false;
    }
  },

  register: async (credentials) => {
    try {
      set({ error: null });
      const { accessToken, user } = await authApi.register(credentials);
      await authApi.saveToken(accessToken);
      set({ user, isAuthenticated: true });
      return true;
    } catch (err: any) {
      set({ error: translateError(err.message) || 'Erro ao registrar' });
      return false;
    }
  },

  logout: async () => {
    await authApi.removeToken();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
