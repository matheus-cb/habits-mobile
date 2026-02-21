import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHabitsStore } from '@/store/habits.store';
import { HabitListItem } from '@/components/habits/HabitListItem';
import { HabitForm } from '@/components/habits/HabitForm';
import type { Habit } from '@/types';
import type { HabitFormData } from '@/schemas/habit.schema';

export default function HabitsScreen() {
  const { habits, loading, error, fetchHabits, createHabit, updateHabit, deleteHabit, clearError } =
    useHabitsStore();

  const [formVisible, setFormVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    fetchHabits();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Erro', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  async function handleCreate(data: HabitFormData) {
    await createHabit(data);
  }

  async function handleUpdate(data: HabitFormData) {
    if (!editingHabit) return;
    await updateHabit(editingHabit.id, data);
    setEditingHabit(null);
  }

  function openEdit(habit: Habit) {
    setEditingHabit(habit);
    setFormVisible(true);
  }

  function closeForm() {
    setFormVisible(false);
    setEditingHabit(null);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Meus Hábitos</Text>
        <TouchableOpacity
          onPress={() => setFormVisible(true)}
          className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && habits.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9333ea" size="large" />
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitListItem
              habit={item}
              onEdit={openEdit}
              onDelete={deleteHabit}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-4xl mb-3">📋</Text>
              <Text className="text-lg font-semibold text-gray-700">Sem hábitos ainda</Text>
              <Text className="text-sm text-gray-500 mt-1 text-center px-8">
                Toque no botão + para criar seu primeiro hábito
              </Text>
            </View>
          }
        />
      )}

      <HabitForm
        visible={formVisible}
        onClose={closeForm}
        onSubmit={editingHabit ? handleUpdate : handleCreate}
        initialData={editingHabit ?? undefined}
      />
    </SafeAreaView>
  );
}
