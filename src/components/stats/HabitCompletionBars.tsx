import React from 'react';
import { View, Text } from 'react-native';
import type { Habit, HabitStats } from '@/types';

interface HabitCompletionBarsProps {
  habits: Habit[];
  statsMap: Record<string, HabitStats>;
}

function barColor(rate: number): string {
  if (rate >= 70) return '#16a34a';
  if (rate >= 40) return '#ca8a04';
  return '#dc2626';
}

export function HabitCompletionBars({ habits, statsMap }: HabitCompletionBarsProps) {
  const sorted = [...habits].sort(
    (a, b) => (statsMap[b.id]?.completionRate ?? 0) - (statsMap[a.id]?.completionRate ?? 0)
  );

  return (
    <View className="mx-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-1">Taxa de Conclusão por Hábito</Text>
      <Text className="text-xs text-gray-400 mb-3">
        Baseado nos últimos 30 dias — verde ≥70%, amarelo 40–70%, vermelho &lt;40%
      </Text>

      {sorted.map((habit) => {
        const rate = Math.round(statsMap[habit.id]?.completionRate ?? 0);
        const streak = statsMap[habit.id]?.currentStreak ?? 0;
        const color = barColor(rate);

        return (
          <View key={habit.id} className="mb-4">
            <View className="flex-row justify-between items-baseline mb-1">
              <Text className="text-xs font-medium text-gray-800 flex-1 mr-2" numberOfLines={1}>
                {habit.title}
              </Text>
              <View className="flex-row items-center gap-2">
                {streak > 0 && (
                  <Text className="text-xs text-orange-500">🔥 {streak}</Text>
                )}
                <Text className="text-xs font-bold" style={{ color }}>
                  {rate}%
                </Text>
              </View>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-2 rounded-full"
                style={{ width: `${rate}%`, backgroundColor: color }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
