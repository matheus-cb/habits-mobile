import { useHabitsStore } from '@/store/habits.store';

export function useHabits() {
  return useHabitsStore((state) => ({
    habits: state.habits,
    loading: state.loading,
    error: state.error,
    fetchHabits: state.fetchHabits,
    createHabit: state.createHabit,
    updateHabit: state.updateHabit,
    deleteHabit: state.deleteHabit,
    checkin: state.checkin,
    fetchCheckins: state.fetchCheckins,
    isCheckedInToday: state.isCheckedInToday,
    clearError: state.clearError,
  }));
}
