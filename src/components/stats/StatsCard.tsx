import React from 'react';
import { View, Text } from 'react-native';

interface StatsCardProps {
  label: string;
  value: string | number;
  emoji: string;
  color?: string;
}

export function StatsCard({ label, value, emoji, color = 'text-gray-900' }: StatsCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-1 items-center">
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
      <Text className="text-xs text-gray-500 text-center mt-1">{label}</Text>
    </View>
  );
}
