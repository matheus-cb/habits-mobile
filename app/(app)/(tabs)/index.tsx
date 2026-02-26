import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';
import { useHabitsStore } from '@/store/habits.store';
import { HabitCard } from '@/components/habits/HabitCard';
import type { Habit } from '@/types';

function todayHeader(): string {
  return format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
}

export default function TodayScreen() {
  const user = useAuthStore((s) => s.user);
  const { habits, loading, checkinsByHabit, fetchHabits, checkin, undoCheckin, isCheckedInToday } =
    useHabitsStore();

  useFocusEffect(useCallback(() => {
    fetchHabits();
  }, []));

  const onRefresh = useCallback(async () => {
    await fetchHabits();
  }, []);

  const checkedCount = habits.filter((h) => isCheckedInToday(h.id)).length;

  function renderHabit({ item }: { item: Habit }) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayCheckin = (checkinsByHabit[item.id] || []).find(
      (c) => c.date.startsWith(today) && !c.id.startsWith('local-')
    );

    return (
      <HabitCard
        habit={item}
        isCheckedIn={isCheckedInToday(item.id)}
        onCheckin={checkin}
        onUndoCheckin={
          todayCheckin ? () => undoCheckin(item.id, todayCheckin.id) : undefined
        }
      />
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-sm text-gray-500 capitalize">{todayHeader()}</Text>
        <Text className="text-2xl font-bold text-gray-900 mt-1">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </Text>

        <View className="flex-row gap-3 mt-4">
          <View className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm items-center">
            <Text className="text-2xl font-bold text-gray-900">{habits.length}</Text>
            <Text className="text-xs text-gray-500">Total</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm items-center">
            <Text className="text-2xl font-bold text-purple-600">{checkedCount}</Text>
            <Text className="text-xs text-gray-500">Completos hoje</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm items-center">
            <Text className="text-2xl font-bold text-orange-500">
              {habits.length > 0
                ? Math.round((checkedCount / habits.length) * 100)
                : 0}%
            </Text>
            <Text className="text-xs text-gray-500">Progresso</Text>
          </View>
        </View>
      </View>

      {loading && habits.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9333ea" size="large" />
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={renderHabit}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#9333ea" />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-4xl mb-3">🌱</Text>
              <Text className="text-lg font-semibold text-gray-700">Nenhum hábito ainda</Text>
              <Text className="text-sm text-gray-500 mt-1 text-center px-8">
                Vá para a aba Hábitos para criar seu primeiro hábito!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
