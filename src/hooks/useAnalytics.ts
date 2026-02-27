import { useState, useEffect } from 'react';
import { habitsApi } from '@/lib/api/habits';
import type { Habit, HabitStats, Checkin } from '@/types';

export interface AnalyticsData {
  habits: Habit[];
  statsMap: Record<string, HabitStats>;
  checkinsMap: Record<string, Checkin[]>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAnalytics(): AnalyticsData {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, HabitStats>>({});
  const [checkinsMap, setCheckinsMap] = useState<Record<string, Checkin[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);

      const habitsData = await habitsApi.list();
      setHabits(habitsData);

      if (habitsData.length === 0) {
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled(
        habitsData.map(async (habit) => {
          const [stats, checkins] = await Promise.all([
            habitsApi.getStats(habit.id),
            habitsApi.getCheckins(habit.id),
          ]);
          return { id: habit.id, stats, checkins };
        })
      );

      // Fulfilled entries populate the maps; rejected ones are silently skipped
      // so a single failing habit doesn't break the entire analytics view.
      const newStatsMap: Record<string, HabitStats> = {};
      const newCheckinsMap: Record<string, Checkin[]> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') {
          newStatsMap[r.value.id] = r.value.stats;
          newCheckinsMap[r.value.id] = r.value.checkins;
        }
      }

      setStatsMap(newStatsMap);
      setCheckinsMap(newCheckinsMap);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar analytics';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return { habits, statsMap, checkinsMap, loading, error, refresh: loadAnalytics };
}
