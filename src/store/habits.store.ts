import { create } from 'zustand';
import { habitsApi } from '@/lib/api/habits';
import { ApiError } from '@/lib/api/client';
import type { Habit, Checkin } from '@/types';
import { format } from 'date-fns';

interface HabitsState {
  habits: Habit[];
  checkinsByHabit: Record<string, Checkin[]>;
  loading: boolean;
  error: string | null;
  fetchHabits: () => Promise<void>;
  createHabit: (data: { title: string; description?: string }) => Promise<Habit>;
  updateHabit: (id: string, data: { title?: string; description?: string }) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  checkin: (habitId: string) => Promise<void>;
  undoCheckin: (habitId: string, checkinId: string) => Promise<void>;
  fetchCheckins: (habitId: string) => Promise<void>;
  isCheckedInToday: (habitId: string) => boolean;
  clearError: () => void;
  reset: () => void;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  checkinsByHabit: {},
  loading: false,
  error: null,

  fetchHabits: async () => {
    set({ loading: true, error: null });
    try {
      const habits = await habitsApi.list();
      set({ habits, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar hábitos', loading: false });
    }
  },

  createHabit: async (data) => {
    try {
      const newHabit = await habitsApi.create(data);
      set((state) => ({ habits: [...state.habits, newHabit] }));
      return newHabit;
    } catch (err: any) {
      set({ error: err.message || 'Erro ao criar hábito' });
      throw err;
    }
  },

  updateHabit: async (id, data) => {
    try {
      const updated = await habitsApi.update(id, data);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? updated : h)),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Erro ao atualizar hábito' });
      throw err;
    }
  },

  deleteHabit: async (id) => {
    try {
      await habitsApi.delete(id);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== id),
        checkinsByHabit: Object.fromEntries(
          Object.entries(state.checkinsByHabit).filter(([k]) => k !== id)
        ),
      }));
    } catch (err: any) {
      set({ error: err.message || 'Erro ao deletar hábito' });
      throw err;
    }
  },

  checkin: async (habitId) => {
    try {
      const newCheckin = await habitsApi.checkin(habitId);
      set((state) => ({
        checkinsByHabit: {
          ...state.checkinsByHabit,
          [habitId]: [...(state.checkinsByHabit[habitId] || []), newCheckin],
        },
      }));
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        // Already checked in today — mark as done silently
        const today = format(new Date(), 'yyyy-MM-dd');
        const existing = get().checkinsByHabit[habitId] || [];
        const alreadyHas = existing.some((c) => c.date.startsWith(today));
        if (!alreadyHas) {
          const fakeCheckin: Checkin = {
            id: `local-${Date.now()}`,
            habitId,
            date: today,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            checkinsByHabit: {
              ...state.checkinsByHabit,
              [habitId]: [...existing, fakeCheckin],
            },
          }));
        }
        return;
      }
      set({ error: err.message || 'Erro ao fazer check-in' });
      throw err;
    }
  },

  undoCheckin: async (habitId, checkinId) => {
    try {
      await habitsApi.deleteCheckin(habitId, checkinId);
      set((state) => ({
        checkinsByHabit: {
          ...state.checkinsByHabit,
          [habitId]: (state.checkinsByHabit[habitId] || []).filter((c) => c.id !== checkinId),
        },
      }));
    } catch (err: any) {
      set({ error: err.message || 'Erro ao desfazer check-in' });
      throw err;
    }
  },

  fetchCheckins: async (habitId) => {
    try {
      const checkins = await habitsApi.getCheckins(habitId);
      set((state) => ({
        checkinsByHabit: { ...state.checkinsByHabit, [habitId]: checkins },
      }));
    } catch (err: any) {
      set({ error: err.message || 'Erro ao carregar check-ins' });
    }
  },

  isCheckedInToday: (habitId) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const checkins = get().checkinsByHabit[habitId] || [];
    return checkins.some((c) => c.date.startsWith(today));
  },

  clearError: () => set({ error: null }),

  reset: () => set({ habits: [], checkinsByHabit: {}, loading: false, error: null }),
}));
