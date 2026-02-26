import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'habit_reminders';

interface HabitReminderEntry {
  time: string;        // "HH:MM"
  notificationId: string;
}

async function getAll(): Promise<Record<string, HabitReminderEntry>> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, HabitReminderEntry>) : {};
}

async function saveAll(data: Record<string, HabitReminderEntry>): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
}

export async function scheduleHabitReminder(
  habitId: string,
  habitTitle: string,
  time: string
): Promise<void> {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Cancel existing notification for this habit if any
  await cancelHabitReminder(habitId);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Hora de: ${habitTitle} 🔔`,
      body: 'Não esqueça de marcar seu hábito hoje!',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  const all = await getAll();
  all[habitId] = { time, notificationId: id };
  await saveAll(all);
}

export async function cancelHabitReminder(habitId: string): Promise<void> {
  const all = await getAll();
  const entry = all[habitId];
  if (entry) {
    await Notifications.cancelScheduledNotificationAsync(entry.notificationId).catch(() => {});
    delete all[habitId];
    await saveAll(all);
  }
}

// Returns habitId → "HH:MM" for UI display
export async function getHabitReminderTimes(): Promise<Record<string, string>> {
  const all = await getAll();
  return Object.fromEntries(Object.entries(all).map(([id, e]) => [id, e.time]));
}
