import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const GLOBAL_NOTIF_ID_KEY = 'global_reminder_notif_id';

export async function scheduleDailyReminder(hour: number, minute: number): Promise<string> {
  // Cancel only the previous global reminder (preserves per-habit notifications)
  const prevId = await SecureStore.getItemAsync(GLOBAL_NOTIF_ID_KEY);
  if (prevId) {
    await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora dos seus hábitos! 🔥',
      body: 'Não esqueça de registrar seu progresso hoje.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await SecureStore.setItemAsync(GLOBAL_NOTIF_ID_KEY, id);
  return id;
}

export async function cancelAllReminders(): Promise<void> {
  const id = await SecureStore.getItemAsync(GLOBAL_NOTIF_ID_KEY);
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    await SecureStore.deleteItemAsync(GLOBAL_NOTIF_ID_KEY);
  }
}
