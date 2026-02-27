import React, { useCallback } from 'react';
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
import { useCalendar } from '@/hooks/useCalendar';
import { MonthNavigator } from '@/components/calendar/MonthNavigator';
import { MonthCalendar } from '@/components/calendar/MonthCalendar';
import { DayBottomSheet } from '@/components/calendar/DayBottomSheet';
import { habitColor } from '@/components/calendar/HabitDot';

export default function CalendarScreen() {
  const { habits, checkinsMap, loading, error, refresh } = useAnalytics();

  const {
    currentMonth,
    selectedDay,
    goToPrevMonth,
    goToNextMonth,
    selectDay,
    closeDay,
    calendarDays,
    checkinsDateMap,
  } = useCalendar(checkinsMap);

  // Refresh analytics whenever this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Title */}
        <View className="px-4 pt-4 pb-1">
          <Text className="text-2xl font-bold text-gray-900">Calendário</Text>
          <Text className="text-sm text-gray-400 mt-0.5">Visualize seus hábitos mês a mês</Text>
        </View>

        {/* Month navigator */}
        <MonthNavigator
          currentMonth={currentMonth}
          onPrev={goToPrevMonth}
          onNext={goToNextMonth}
        />

        {/* Loading */}
        {loading && habits.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator color="#9333ea" size="large" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20 px-8">
            <Text className="text-red-500 text-center mb-4">{error}</Text>
            <TouchableOpacity
              onPress={refresh}
              className="bg-purple-600 px-6 py-2 rounded-full"
            >
              <Text className="text-white font-medium">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : habits.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-3">📅</Text>
            <Text className="text-lg font-semibold text-gray-700">Nenhum hábito ainda</Text>
            <Text className="text-sm text-gray-500 mt-1 text-center px-8">
              Vá para a aba Hábitos para criar seu primeiro hábito!
            </Text>
          </View>
        ) : (
          <>
            {/* Calendar grid */}
            <MonthCalendar
              currentMonth={currentMonth}
              calendarDays={calendarDays}
              checkinsDateMap={checkinsDateMap}
              habits={habits}
              selectedDay={selectedDay}
              onDayPress={selectDay}
            />

            {/* Habit legend */}
            <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <Text className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                Legenda
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {habits.map((habit, index) => (
                  <View key={habit.id} className="flex-row items-center gap-1.5">
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: habitColor(index),
                      }}
                    />
                    <Text className="text-xs text-gray-600" numberOfLines={1}>
                      {habit.title}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Day detail bottom sheet */}
      {selectedDay && (
        <DayBottomSheet
          visible
          selectedDay={selectedDay}
          habits={habits}
          checkinsMap={checkinsMap}
          onClose={closeDay}
          onRefresh={refresh}
        />
      )}
    </SafeAreaView>
  );
}
