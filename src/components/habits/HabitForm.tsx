import React from 'react';
import { View, Text, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { habitSchema, type HabitFormData } from '@/schemas/habit.schema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Habit } from '@/types';

interface HabitFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: HabitFormData) => Promise<void>;
  initialData?: Habit;
}

export function HabitForm({ visible, onClose, onSubmit, initialData }: HabitFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
    },
  });

  async function handleSave(data: HabitFormData) {
    await onSubmit(data);
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-gray-50"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-row items-center justify-between px-4 pt-6 pb-4 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={handleClose}>
            <Text className="text-base text-gray-500">Cancelar</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">
            {initialData ? 'Editar Hábito' : 'Novo Hábito'}
          </Text>
          <View className="w-16" />
        </View>

        <ScrollView className="flex-1 px-4 pt-6" keyboardShouldPersistTaps="handled">
          <View className="gap-4">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Título"
                  placeholder="Ex: Meditar 10 minutos"
                  value={value}
                  onChangeText={onChange}
                  error={errors.title?.message}
                  autoFocus
                />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Descrição (opcional)"
                  placeholder="Detalhes do hábito..."
                  value={value}
                  onChangeText={onChange}
                  error={errors.description?.message}
                  multiline
                  numberOfLines={3}
                  className="min-h-[80px]"
                />
              )}
            />
            <Button
              title={initialData ? 'Salvar Alterações' : 'Criar Hábito'}
              onPress={handleSubmit(handleSave)}
              loading={isSubmitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
