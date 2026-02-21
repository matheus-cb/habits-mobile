import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconsName;
  activeIcon: IoniconsName;
}

const tabs: TabConfig[] = [
  { name: 'index', title: 'Hoje', icon: 'home-outline', activeIcon: 'home' },
  { name: 'habits', title: 'Hábitos', icon: 'list-outline', activeIcon: 'list' },
  { name: 'stats', title: 'Estatísticas', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
  { name: 'profile', title: 'Perfil', icon: 'person-outline', activeIcon: 'person' },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#9333ea',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopColor: '#f3f4f6',
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0.1,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      {tabs.map(({ name, title, icon, activeIcon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? activeIcon : icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
