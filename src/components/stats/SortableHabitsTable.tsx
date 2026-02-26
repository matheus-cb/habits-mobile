import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Habit, HabitStats } from '@/types';

type SortKey = 'title' | 'totalCheckins' | 'currentStreak' | 'completionRate';
type SortDir = 'asc' | 'desc';

interface SortableHabitsTableProps {
  habits: Habit[];
  statsMap: Record<string, HabitStats>;
}

function HeaderCell({
  label,
  sortKey,
  current,
  direction,
  onPress,
  align,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  direction: SortDir;
  onPress: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = current === sortKey;
  return (
    <TouchableOpacity
      onPress={() => onPress(sortKey)}
      className={`flex-row items-center gap-0.5 ${align === 'right' ? 'justify-end' : ''}`}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-purple-600' : 'text-gray-500'}`}>
        {label}
      </Text>
      {active && (
        <Ionicons
          name={direction === 'asc' ? 'chevron-up' : 'chevron-down'}
          size={10}
          color="#9333ea"
        />
      )}
    </TouchableOpacity>
  );
}

export function SortableHabitsTable({ habits, statsMap }: SortableHabitsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('completionRate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...habits].sort((a, b) => {
    const sa = statsMap[a.id];
    const sb = statsMap[b.id];
    if (!sa || !sb) return 0;

    let valA: number | string;
    let valB: number | string;

    if (sortKey === 'title') {
      valA = a.title.toLowerCase();
      valB = b.title.toLowerCase();
    } else {
      valA = sa[sortKey];
      valB = sb[sortKey];
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <View className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <View className="flex-row px-3 py-2.5 bg-gray-50 border-b border-gray-100">
        <View className="flex-1">
          <HeaderCell
            label="Hábito"
            sortKey="title"
            current={sortKey}
            direction={sortDir}
            onPress={handleSort}
          />
        </View>
        <View className="w-14 items-end">
          <HeaderCell
            label="Check"
            sortKey="totalCheckins"
            current={sortKey}
            direction={sortDir}
            onPress={handleSort}
            align="right"
          />
        </View>
        <View className="w-14 items-end">
          <HeaderCell
            label="Streak"
            sortKey="currentStreak"
            current={sortKey}
            direction={sortDir}
            onPress={handleSort}
            align="right"
          />
        </View>
        <View className="w-14 items-end">
          <HeaderCell
            label="Taxa"
            sortKey="completionRate"
            current={sortKey}
            direction={sortDir}
            onPress={handleSort}
            align="right"
          />
        </View>
      </View>

      {/* Data rows */}
      {sorted.map((habit, i) => {
        const stats = statsMap[habit.id];
        if (!stats) return null;
        const isLast = i === sorted.length - 1;
        const rate = Math.round(stats.completionRate);
        const rateColor =
          rate >= 70 ? 'text-green-600' : rate >= 40 ? 'text-yellow-600' : 'text-red-500';

        return (
          <View
            key={habit.id}
            className={`flex-row px-3 py-3 items-center ${!isLast ? 'border-b border-gray-50' : ''}`}
          >
            <View className="flex-1 mr-2">
              <Text className="text-sm text-gray-800" numberOfLines={1}>
                {habit.title}
              </Text>
            </View>
            <View className="w-14 items-end">
              <Text className="text-sm font-medium text-gray-700">{stats.totalCheckins}</Text>
            </View>
            <View className="w-14 items-end">
              <Text className="text-sm font-medium text-gray-700">
                {stats.currentStreak}🔥
              </Text>
            </View>
            <View className="w-14 items-end">
              <Text className={`text-sm font-semibold ${rateColor}`}>{rate}%</Text>
            </View>
          </View>
        );
      })}

      {sorted.length === 0 && (
        <View className="py-6 items-center">
          <Text className="text-sm text-gray-400">Sem dados</Text>
        </View>
      )}
    </View>
  );
}
