import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  return useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login: state.login,
    register: state.register,
    logout: state.logout,
    clearError: state.clearError,
  }));
}
