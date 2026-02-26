import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAnalytics } from '@/hooks/useAnalytics';
import { StatsCard } from '@/components/stats/StatsCard';
import { CompletionChart } from '@/components/stats/CompletionChart';
import { GlobalSummaryCards } from '@/components/stats/GlobalSummaryCards';
import { ActivityHeatmap } from '@/components/stats/ActivityHeatmap';
import { HabitCompletionBars } from '@/components/stats/HabitCompletionBars';
import { SortableHabitsTable } from '@/components/stats/SortableHabitsTable';
import { AchievementBadge } from '@/components/gamification/AchievementBadge';
import { achievements, getUnlockedAchievements } from '@/constants/achievements';

type ViewMode = 'habit' | 'global';

export default function StatsScreen() {
  const { habits, statsMap, checkinsMap, loading, error, refresh } = useAnalytics();
  const [view, setView] = useState<ViewMode>('habit');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, []));

  useEffect(() => {
    if (habits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(habits[0].id);
    }
  }, [habits]);

  const stats = selectedHabitId ? statsMap[selectedHabitId] ?? null : null;
  const checkins = selectedHabitId ? checkinsMap[selectedHabitId] ?? [] : [];
  const unlocked = stats ? getUnlockedAchievements(stats) : [];
  const unlockedIds = new Set(unlocked.map((a) => a.id));

  if (!loading && habits.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-4xl mb-3">📊</Text>
        <Text className="text-lg font-semibold text-gray-700">Sem dados ainda</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Crie hábitos e faça check-ins para ver estatísticas
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Header + toggle */}
        <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Estatísticas</Text>
          <View className="flex-row bg-gray-200 rounded-full p-0.5">
            <TouchableOpacity
              onPress={() => setView('habit')}
              className={`px-3 py-1 rounded-full ${view === 'habit' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-medium ${view === 'habit' ? 'text-gray-900' : 'text-gray-500'}`}>
                Por Hábito
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setView('global')}
              className={`px-3 py-1 rounded-full ${view === 'global' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-xs font-medium ${view === 'global' ? 'text-gray-900' : 'text-gray-500'}`}>
                Visão Geral
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color="#9333ea" size="large" />
          </View>
        ) : error ? (
          <View className="py-12 px-8 items-center">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <TouchableOpacity onPress={refresh} className="bg-purple-600 px-6 py-2 rounded-full">
              <Text className="text-white font-medium">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Visão Geral ── */}
            {view === 'global' && (
              <>
                <GlobalSummaryCards habits={habits} statsMap={statsMap} />
                <ActivityHeatmap checkinsMap={checkinsMap} />
                <HabitCompletionBars habits={habits} statsMap={statsMap} />
                <Text className="px-4 mt-4 mb-2 text-base font-bold text-gray-900">
                  Tabela Comparativa
                </Text>
                <SortableHabitsTable habits={habits} statsMap={statsMap} />
              </>
            )}

            {/* ── Por Hábito ── */}
            {view === 'habit' && (
              <>
                {/* Habit selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="px-4 mb-4"
                  contentContainerStyle={{ gap: 8 }}
                >
                  {habits.map((habit) => (
                    <TouchableOpacity
                      key={habit.id}
                      onPress={() => setSelectedHabitId(habit.id)}
                      className={`px-4 py-2 rounded-full border ${
                        selectedHabitId === habit.id
                          ? 'bg-purple-600 border-purple-600'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selectedHabitId === habit.id ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {habit.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {!stats ? (
                  <View className="py-12 items-center">
                    <ActivityIndicator color="#9333ea" size="small" />
                  </View>
                ) : (
                  <>
                    {/* Stats cards */}
                    <View className="px-4 flex-row gap-3 mb-4">
                      <StatsCard
                        label="Streak Atual"
                        value={stats.currentStreak}
                        emoji="🔥"
                        color="text-orange-500"
                      />
                      <StatsCard
                        label="Melhor Streak"
                        value={stats.bestStreak}
                        emoji="⚡"
                        color="text-yellow-500"
                      />
                    </View>
                    <View className="px-4 flex-row gap-3 mb-4">
                      <StatsCard
                        label="Total Check-ins"
                        value={stats.totalCheckins}
                        emoji="✅"
                        color="text-green-600"
                      />
                      <StatsCard
                        label="Taxa 30 dias"
                        value={`${Math.round(stats.completionRate)}%`}
                        emoji="🎯"
                        color="text-purple-600"
                      />
                    </View>

                    {/* Chart */}
                    <View className="mx-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
                      <CompletionChart checkins={checkins} />
                    </View>

                    {/* Achievements */}
                    <View className="px-4">
                      <Text className="text-lg font-bold text-gray-900 mb-3">Conquistas</Text>
                      <View className="flex-row flex-wrap gap-3">
                        {achievements.map((achievement) => (
                          <AchievementBadge
                            key={achievement.id}
                            achievement={achievement}
                            unlocked={unlockedIds.has(achievement.id)}
                          />
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
