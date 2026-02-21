import { useState, useEffect } from 'react';
import { habitsApi } from '@/lib/api/habits';
import type { HabitStats, Checkin } from '@/types';

export function useHabitStats(habitId: string | null) {
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habitId) {
      loadData();
    }
  }, [habitId]);

  async function loadData() {
    if (!habitId) return;
    try {
      setLoading(true);
      const [statsData, checkinsData] = await Promise.all([
        habitsApi.getStats(habitId),
        habitsApi.getCheckins(habitId),
      ]);
      setStats(statsData);
      setCheckins(checkinsData);
    } catch (err) {
      console.error('Erro ao carregar estatísticas', err);
    } finally {
      setLoading(false);
    }
  }

  return { stats, checkins, loading, reload: loadData };
}
