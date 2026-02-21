import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Habit } from '@/types';

interface HabitListItemProps {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

export function HabitListItem({ habit, onEdit, onDelete }: HabitListItemProps) {
  function confirmDelete() {
    Alert.alert(
      'Excluir Hábito',
      `Deseja excluir "${habit.title}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => onDelete(habit.id) },
      ]
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm flex-row items-center">
      <View className="flex-1 mr-2">
        <Text className="text-base font-semibold text-gray-900">{habit.title}</Text>
        {habit.description ? (
          <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={2}>
            {habit.description}
          </Text>
        ) : null}
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => onEdit(habit)}
          className="w-9 h-9 rounded-full bg-purple-50 items-center justify-center"
        >
          <Ionicons name="pencil" size={16} color="#9333ea" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirmDelete}
          className="w-9 h-9 rounded-full bg-red-50 items-center justify-center"
        >
          <Ionicons name="trash" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
