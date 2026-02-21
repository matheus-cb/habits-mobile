import * as SecureStore from 'expo-secure-store';
import { apiClient } from './client';
import type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types';

export const authApi = {
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient<{ data: AuthResponse }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient<{ data: AuthResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response = await apiClient<{ data: { user: User } }>('/auth/me');
    return response.data.user;
  },

  async saveToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('token', token);
  },

  async removeToken(): Promise<void> {
    await SecureStore.deleteItemAsync('token');
  },

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync('token');
  },
};
