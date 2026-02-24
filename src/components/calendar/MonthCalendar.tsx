import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { format, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HabitDot, habitColor } from './HabitDot';
import type { Habit } from '@/types';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MAX_DOTS = 3;

interface MonthCalendarProps {
  currentMonth: Date;
  calendarDays: Date[];
  checkinsDateMap: Record<string, string[]>; // "yyyy-MM-dd" → habitId[]
  habits: Habit[];
  selectedDay: Date | null;
  onDayPress: (day: Date) => void;
}

export function MonthCalendar({
  currentMonth,
  calendarDays,
  checkinsDateMap,
  habits,
  selectedDay,
  onDayPress,
}: MonthCalendarProps) {
  const { width } = useWindowDimensions();
  const H_PADDING = 32;
  const dayWidth = Math.floor((width - H_PADDING) / 7);

  // habitId → color index map (stable across renders)
  const habitColorMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    habits.forEach((h, i) => { map[h.id] = i; });
    return map;
  }, [habits]);

  return (
    <View className="bg-white rounded-2xl shadow-sm border border-gray-100 mx-4 pb-3">
      {/* Day-of-week header */}
      <View className="flex-row border-b border-gray-100 py-2">
        {DAY_LABELS.map((label) => (
          <View key={label} style={{ width: dayWidth }} className="items-center">
            <Text className="text-xs font-medium text-gray-400">{label}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      <View className="flex-row flex-wrap pt-1">
        {calendarDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDay ? isSameDay(day, selectedDay) : false;
          const habitIds = checkinsDateMap[key] ?? [];

          // Dots: up to MAX_DOTS, then show overflow text
          const visibleIds = habitIds.slice(0, MAX_DOTS);
          const overflow = habitIds.length - visibleIds.length;

          return (
            <TouchableOpacity
              key={key}
              onPress={() => inCurrentMonth && onDayPress(day)}
              disabled={!inCurrentMonth}
              style={{ width: dayWidth }}
              className="items-center py-1"
            >
              {/* Day number bubble */}
              <View
                className={[
                  'w-7 h-7 items-center justify-center rounded-full',
                  selected ? 'bg-purple-600' : today ? 'border-2 border-purple-400' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Text
                  className={[
                    'text-xs font-medium',
                    !inCurrentMonth
                      ? 'text-gray-300'
                      : selected
                      ? 'text-white'
                      : today
                      ? 'text-purple-600'
                      : 'text-gray-800',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {format(day, 'd')}
                </Text>
              </View>

              {/* Habit dots */}
              <View className="flex-row items-center mt-0.5" style={{ height: 8 }}>
                {inCurrentMonth && visibleIds.map((id) => (
                  <HabitDot
                    key={id}
                    color={habitColor(habitColorMap[id] ?? 0)}
                  />
                ))}
                {overflow > 0 && (
                  <Text style={{ fontSize: 8, color: '#9ca3af', marginLeft: 1 }}>
                    +{overflow}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
