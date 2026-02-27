import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { habitsApi } from '@/lib/api/habits';
import { ApiError } from '@/lib/api/client';
import { habitColor } from './HabitDot';
import type { Habit, Checkin } from '@/types';

interface DayBottomSheetProps {
  visible: boolean;
  selectedDay: Date;
  habits: Habit[];
  checkinsMap: Record<string, Checkin[]>;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

function getCheckinForDay(
  habitId: string,
  day: Date,
  checkinsMap: Record<string, Checkin[]>
): Checkin | undefined {
  const dayStr = format(day, 'yyyy-MM-dd');
  return (checkinsMap[habitId] ?? []).find((c) => c.date.startsWith(dayStr));
}

export function DayBottomSheet({
  visible,
  selectedDay,
  habits,
  checkinsMap,
  onClose,
  onRefresh,
}: DayBottomSheetProps) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const dayLabel = format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR });
  const dateStr = format(selectedDay, 'yyyy-MM-dd');
  const isFutureDay = isAfter(startOfDay(selectedDay), startOfDay(new Date()));

  async function handleToggle(habit: Habit) {
    if (isFutureDay) return;
    const existing = getCheckinForDay(habit.id, selectedDay, checkinsMap);

    setLoadingIds((prev) => new Set(prev).add(habit.id));
    try {
      if (existing) {
        await habitsApi.deleteCheckin(habit.id, existing.id);
      } else {
        await habitsApi.checkin(habit.id, new Date(dateStr).toISOString());
      }
      await onRefresh();
    } catch (err: unknown) {
      // 409 = already checked in for this date — harmless, ignore silently.
      // Any other error (network, 500, etc.) should be surfaced to the user.
      if (!(err instanceof ApiError && err.status === 409)) {
        Alert.alert('Erro', 'Não foi possível alterar o check-in. Tente novamente.');
      }
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(habit.id);
        return next;
      });
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        {/* Backdrop tap closes the sheet */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Sheet */}
        <View
          className="bg-white rounded-t-2xl"
          style={{ maxHeight: '70%' }}
          onStartShouldSetResponder={() => true}
        >
          {/* Handle bar */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
            <View>
              <Text className="text-xs text-gray-400 uppercase tracking-wide">Dia selecionado</Text>
              <Text className="text-base font-semibold text-gray-900 capitalize mt-0.5">
                {dayLabel}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Habits list */}
          <ScrollView
            className="px-5 py-3"
            contentContainerStyle={{ paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {isFutureDay && (
              <View className="bg-amber-50 rounded-xl px-4 py-3 mb-3">
                <Text className="text-xs text-amber-700">
                  Dia futuro — check-ins não são permitidos.
                </Text>
              </View>
            )}

            {habits.length === 0 && (
              <Text className="text-sm text-gray-400 text-center py-6">
                Nenhum hábito cadastrado.
              </Text>
            )}

            {habits.map((habit, index) => {
              const checkin = getCheckinForDay(habit.id, selectedDay, checkinsMap);
              const isDone = !!checkin;
              const isLoading = loadingIds.has(habit.id);
              const color = habitColor(index);

              return (
                <View
                  key={habit.id}
                  className="flex-row items-center py-3 border-b border-gray-50"
                >
                  {/* Color indicator */}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: color,
                      marginRight: 12,
                    }}
                  />

                  {/* Habit title */}
                  <Text
                    className="flex-1 text-sm text-gray-800 font-medium"
                    numberOfLines={1}
                  >
                    {habit.title}
                  </Text>

                  {/* Toggle button */}
                  <TouchableOpacity
                    onPress={() => handleToggle(habit)}
                    disabled={isLoading || isFutureDay}
                    className={[
                      'w-9 h-9 rounded-full items-center justify-center',
                      isDone ? 'bg-green-100' : 'bg-gray-100',
                      isFutureDay ? 'opacity-40' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={isDone ? '#16a34a' : '#9ca3af'} />
                    ) : (
                      <Text className={isDone ? 'text-green-600' : 'text-gray-400'}>
                        {isDone ? '✓' : '○'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
