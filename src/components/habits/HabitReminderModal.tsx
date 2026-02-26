import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';

interface HabitReminderModalProps {
  visible: boolean;
  habitTitle: string;
  currentTime: string | null; // "HH:MM" or null
  onSave: (time: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

function parseTime(time: string | null): { hour: number; minute: number } {
  if (!time) return { hour: 8, minute: 0 };
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

export function HabitReminderModal({
  visible,
  habitTitle,
  currentTime,
  onSave,
  onRemove,
  onClose,
}: HabitReminderModalProps) {
  const initial = parseTime(currentTime);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  // Reset pickers when modal opens with a new time
  React.useEffect(() => {
    if (visible) {
      const t = parseTime(currentTime);
      setHour(t.hour);
      setMinute(t.minute);
    }
  }, [visible, currentTime]);

  function handleSave() {
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onSave(time);
  }

  const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-bold text-gray-900">Lembrete</Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-gray-500 mb-5" numberOfLines={1}>
            {habitTitle}
          </Text>

          {/* Time picker */}
          <View className="flex-row items-center justify-center gap-4 mb-6">
            {/* Hour */}
            <View className="items-center">
              <Text className="text-xs text-gray-500 mb-2">Hora</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => setHour((h) => Math.max(0, h - 1))}
                  className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-lg text-gray-700">−</Text>
                </TouchableOpacity>
                <Text className="text-3xl font-bold text-gray-900 w-10 text-center">
                  {String(hour).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  onPress={() => setHour((h) => Math.min(23, h + 1))}
                  className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-lg text-gray-700">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text className="text-3xl font-bold text-gray-400 mt-5">:</Text>

            {/* Minute */}
            <View className="items-center">
              <Text className="text-xs text-gray-500 mb-2">Minuto</Text>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => setMinute((m) => Math.max(0, m - 5))}
                  className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-lg text-gray-700">−</Text>
                </TouchableOpacity>
                <Text className="text-3xl font-bold text-gray-900 w-10 text-center">
                  {String(minute).padStart(2, '0')}
                </Text>
                <TouchableOpacity
                  onPress={() => setMinute((m) => Math.min(55, m + 5))}
                  className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Text className="text-lg text-gray-700">+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-3">
            <Button title={`Lembrar às ${timeLabel}`} onPress={handleSave} />
            {currentTime && (
              <Button title="Remover lembrete" variant="danger" onPress={onRemove} />
            )}
            <Button title="Cancelar" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
