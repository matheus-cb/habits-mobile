import type { HabitStats } from '@/types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  check: (stats: HabitStats) => boolean;
}

export const achievements: Achievement[] = [
  {
    id: 'first_checkin',
    title: 'Primeiro Passo',
    description: 'Fez seu primeiro check-in',
    emoji: '🌱',
    check: (s) => s.totalCheckins >= 1,
  },
  {
    id: 'streak_3',
    title: 'Em Ritmo',
    description: '3 dias seguidos',
    emoji: '🔥',
    check: (s) => s.currentStreak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Uma Semana',
    description: '7 dias seguidos',
    emoji: '⚡',
    check: (s) => s.currentStreak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Mês Completo',
    description: '30 dias seguidos',
    emoji: '🏆',
    check: (s) => s.currentStreak >= 30,
  },
  {
    id: 'checkins_50',
    title: 'Consistente',
    description: '50 check-ins no total',
    emoji: '💎',
    check: (s) => s.totalCheckins >= 50,
  },
  {
    id: 'rate_80',
    title: 'Disciplinado',
    description: 'Taxa de conclusão acima de 80%',
    emoji: '🎯',
    check: (s) => s.completionRate >= 80,
  },
];

export function getUnlockedAchievements(stats: HabitStats): Achievement[] {
  return achievements.filter((a) => a.check(stats));
}
