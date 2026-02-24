import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthNavigatorProps {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ currentMonth, onPrev, onNext }: MonthNavigatorProps) {
  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <TouchableOpacity
        onPress={onPrev}
        className="w-9 h-9 items-center justify-center rounded-full bg-gray-100"
      >
        <Ionicons name="chevron-back" size={18} color="#6b7280" />
      </TouchableOpacity>

      <Text className="text-base font-bold text-gray-900 capitalize">
        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      </Text>

      <TouchableOpacity
        onPress={onNext}
        disabled={isCurrentMonth}
        className={`w-9 h-9 items-center justify-center rounded-full ${
          isCurrentMonth ? 'bg-gray-50' : 'bg-gray-100'
        }`}
      >
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isCurrentMonth ? '#d1d5db' : '#6b7280'}
        />
      </TouchableOpacity>
    </View>
  );
}
