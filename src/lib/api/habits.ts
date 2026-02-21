import { apiClient } from './client';
import type { Habit, Checkin, HabitStats } from '@/types';

export const habitsApi = {
  async list(): Promise<Habit[]> {
    const response = await apiClient<{ data: Habit[] }>('/habits');
    return response.data;
  },

  async create(data: { title: string; description?: string }): Promise<Habit> {
    const response = await apiClient<{ data: Habit }>('/habits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async get(id: string): Promise<Habit> {
    const response = await apiClient<{ data: Habit }>(`/habits/${id}`);
    return response.data;
  },

  async update(id: string, data: { title?: string; description?: string }): Promise<Habit> {
    const response = await apiClient<{ data: Habit }>(`/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient(`/habits/${id}`, { method: 'DELETE' });
  },

  async checkin(habitId: string, date?: string): Promise<Checkin> {
    const response = await apiClient<{ data: Checkin }>(`/habits/${habitId}/checkin`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
    return response.data;
  },

  async getCheckins(habitId: string): Promise<Checkin[]> {
    const response = await apiClient<{ data: Checkin[] }>(`/habits/${habitId}/checkins`);
    return response.data;
  },

  async getStats(habitId: string): Promise<HabitStats> {
    const response = await apiClient<{ data: HabitStats }>(`/habits/${habitId}/stats`);
    return response.data;
  },
};
