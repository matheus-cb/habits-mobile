import * as Notifications from 'expo-notifications';

export async function scheduleDailyReminder(hour: number, minute: number): Promise<string> {
  await cancelAllReminders();

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

  return id;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
