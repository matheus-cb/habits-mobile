import { create } from 'zustand';
import {
  scheduleHabitReminder,
  cancelHabitReminder,
  getHabitReminderTimes,
} from '@/lib/notifications/habitReminders';
import { requestNotificationPermissions } from '@/lib/notifications';

interface RemindersState {
  // habitId → "HH:MM"
  reminders: Record<string, string>;
  load: () => Promise<void>;
  setReminder: (habitId: string, habitTitle: string, time: string) => Promise<void>;
  removeReminder: (habitId: string) => Promise<void>;
}

export const useRemindersStore = create<RemindersState>((set) => ({
  reminders: {},

  load: async () => {
    const times = await getHabitReminderTimes();
    set({ reminders: times });
  },

  setReminder: async (habitId, habitTitle, time) => {
    await requestNotificationPermissions();
    await scheduleHabitReminder(habitId, habitTitle, time);
    set((state) => ({ reminders: { ...state.reminders, [habitId]: time } }));
  },

  removeReminder: async (habitId) => {
    await cancelHabitReminder(habitId);
    set((state) => {
      const next = { ...state.reminders };
      delete next[habitId];
      return { reminders: next };
    });
  },
}));
