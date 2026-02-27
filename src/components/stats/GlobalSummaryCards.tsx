import React from 'react';
import { View, Text } from 'react-native';
import type { Habit, HabitStats } from '@/types';

interface GlobalSummaryCardsProps {
  habits: Habit[];
  statsMap: Record<string, HabitStats>;
}

export function GlobalSummaryCards({ habits, statsMap }: GlobalSummaryCardsProps) {
  const vals = Object.values(statsMap);

  const totalCheckins = vals.reduce((s, v) => s + v.totalCheckins, 0);
  const bestStreak = vals.length > 0 ? Math.max(...vals.map((v) => v.bestStreak)) : 0;
  const avgRate =
    vals.length > 0
      ? Math.round(vals.reduce((s, v) => s + v.completionRate, 0) / vals.length)
      : 0;

  let mostConsistent = '—';
  let maxRate = -1;
  for (const h of habits) {
    const rate = statsMap[h.id]?.completionRate ?? 0;
    if (rate > maxRate) {
      maxRate = rate;
      mostConsistent = h.title;
    }
  }

  return (
    <View className="px-4 mb-4">
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
          <Text className="text-2xl font-bold text-purple-600">{totalCheckins}</Text>
          <Text className="text-xs text-gray-500 text-center mt-1">Total Check-ins</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
          <Text className="text-2xl font-bold text-orange-500">🔥 {bestStreak}</Text>
          <Text className="text-xs text-gray-500 text-center mt-1">Melhor Streak</Text>
        </View>
      </View>
      <View className="flex-row gap-3">
        <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center">
          <Text className="text-2xl font-bold text-green-600">{avgRate}%</Text>
          <Text className="text-xs text-gray-500 text-center mt-1">Taxa Média (30d)</Text>
        </View>
        <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm items-center justify-center">
          <Text className="text-sm font-bold text-blue-600 text-center" numberOfLines={2}>
            {mostConsistent}
          </Text>
          <Text className="text-xs text-gray-500 text-center mt-1">Mais Consistente</Text>
        </View>
      </View>
    </View>
  );
}
