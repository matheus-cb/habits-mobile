import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/auth.store';
import { useHabitsStore } from '@/store/habits.store';
import { requestNotificationPermissions } from '@/lib/notifications';
import { scheduleDailyReminder, cancelAllReminders } from '@/lib/notifications/scheduler';
import { Button } from '@/components/ui/Button';

const REMINDER_KEY = 'reminder_enabled';
const REMINDER_HOUR_KEY = 'reminder_hour';
const REMINDER_MIN_KEY = 'reminder_minute';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const reset = useHabitsStore((s) => s.reset);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [tempHour, setTempHour] = useState(8);
  const [tempMinute, setTempMinute] = useState(0);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const enabled = await SecureStore.getItemAsync(REMINDER_KEY);
    const h = await SecureStore.getItemAsync(REMINDER_HOUR_KEY);
    const m = await SecureStore.getItemAsync(REMINDER_MIN_KEY);
    setNotificationsEnabled(enabled === 'true');
    if (h) setReminderHour(parseInt(h, 10));
    if (m) setReminderMinute(parseInt(m, 10));
  }

  async function toggleNotifications(value: boolean) {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permissão Necessária',
          'Ative as notificações nas configurações do dispositivo.'
        );
        return;
      }
      await scheduleDailyReminder(reminderHour, reminderMinute);
      await SecureStore.setItemAsync(REMINDER_KEY, 'true');
    } else {
      await cancelAllReminders();
      await SecureStore.setItemAsync(REMINDER_KEY, 'false');
    }
    setNotificationsEnabled(value);
  }

  async function saveReminderTime() {
    setReminderHour(tempHour);
    setReminderMinute(tempMinute);
    if (notificationsEnabled) {
      await scheduleDailyReminder(tempHour, tempMinute);
    }
    await SecureStore.setItemAsync(REMINDER_HOUR_KEY, String(tempHour));
    await SecureStore.setItemAsync(REMINDER_MIN_KEY, String(tempMinute));
    setTimePickerVisible(false);
  }

  function openTimePicker() {
    setTempHour(reminderHour);
    setTempMinute(reminderMinute);
    setTimePickerVisible(true);
  }

  function openEditModal() {
    setEditName(user?.name ?? '');
    setEditEmail(user?.email ?? '');
    setEditModalVisible(true);
  }

  async function handleSaveProfile() {
    const data: { name?: string; email?: string } = {};
    if (editName.trim() && editName.trim() !== user?.name) data.name = editName.trim();
    if (editEmail.trim() && editEmail.trim() !== user?.email) data.email = editEmail.trim();

    if (Object.keys(data).length === 0) {
      setEditModalVisible(false);
      return;
    }

    setEditLoading(true);
    const success = await updateProfile(data);
    setEditLoading(false);

    if (success) {
      setEditModalVisible(false);
    } else {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    }
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          reset();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const timeLabel = `${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}`;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 pt-4 pb-2">
          <Text className="text-2xl font-bold text-gray-900">Perfil</Text>
        </View>

        {/* User info */}
        <View className="mx-4 mt-2 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 bg-purple-100 rounded-full items-center justify-center">
              <Text className="text-2xl font-bold text-purple-600">
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">{user?.name}</Text>
              <Text className="text-sm text-gray-500">{user?.email}</Text>
            </View>
            <TouchableOpacity
              onPress={openEditModal}
              className="w-9 h-9 bg-purple-50 rounded-full items-center justify-center"
            >
              <Ionicons name="pencil" size={16} color="#9333ea" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-base font-semibold text-gray-900">Notificações</Text>
          </View>

          <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Ionicons name="notifications-outline" size={20} color="#9333ea" />
              <Text className="text-base text-gray-700">Lembrete diário</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#e5e7eb', true: '#c084fc' }}
              thumbColor={notificationsEnabled ? '#9333ea' : '#f4f3f4'}
            />
          </View>

          {notificationsEnabled && (
            <TouchableOpacity
              onPress={openTimePicker}
              className="px-4 py-4 flex-row items-center justify-between border-t border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="time-outline" size={20} color="#9333ea" />
                <Text className="text-base text-gray-700">Horário do lembrete</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-semibold text-purple-600">{timeLabel}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <View className="mx-4 mt-4">
          <Button title="Sair" variant="danger" onPress={handleLogout} />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900">Editar Perfil</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-500 mb-1">Nome</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Seu nome"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 mb-3"
              autoCapitalize="words"
            />

            <Text className="text-sm text-gray-500 mb-1">Email</Text>
            <TextInput
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Seu email"
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 mb-5"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View className="gap-3">
              <Button title={editLoading ? 'Salvando…' : 'Salvar'} onPress={handleSaveProfile} />
              <Button title="Cancelar" variant="secondary" onPress={() => setEditModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={timePickerVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full">
            <Text className="text-lg font-bold text-gray-900 mb-4 text-center">
              Horário do Lembrete
            </Text>

            <View className="flex-row items-center justify-center gap-4 mb-6">
              {/* Hour picker */}
              <View className="items-center">
                <Text className="text-sm text-gray-500 mb-2">Hora</Text>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => setTempHour((h) => Math.max(0, h - 1))}
                    className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Text className="text-lg text-gray-700">−</Text>
                  </TouchableOpacity>
                  <Text className="text-3xl font-bold text-gray-900 w-10 text-center">
                    {String(tempHour).padStart(2, '0')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTempHour((h) => Math.min(23, h + 1))}
                    className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Text className="text-lg text-gray-700">+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-3xl font-bold text-gray-500 mt-5">:</Text>

              {/* Minute picker */}
              <View className="items-center">
                <Text className="text-sm text-gray-500 mb-2">Minuto</Text>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => setTempMinute((m) => Math.max(0, m - 5))}
                    className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Text className="text-lg text-gray-700">−</Text>
                  </TouchableOpacity>
                  <Text className="text-3xl font-bold text-gray-900 w-10 text-center">
                    {String(tempMinute).padStart(2, '0')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTempMinute((m) => Math.min(55, m + 5))}
                    className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Text className="text-lg text-gray-700">+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="gap-3">
              <Button title="Confirmar" onPress={saveReminderTime} />
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={() => setTimePickerVisible(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
