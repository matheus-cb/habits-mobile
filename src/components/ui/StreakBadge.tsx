import React from 'react';
import { View, Text } from 'react-native';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const emojiSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl';
  const numSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <View className="flex-row items-center gap-1">
      <Text className={emojiSize}>🔥</Text>
      <Text className={`${numSize} font-bold text-orange-500`}>{streak}</Text>
    </View>
  );
}
