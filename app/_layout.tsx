import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/auth.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    loadUser().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
