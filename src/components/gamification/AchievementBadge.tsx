import React from 'react';
import { View, Text } from 'react-native';
import type { Achievement } from '@/constants/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
}

export function AchievementBadge({ achievement, unlocked }: AchievementBadgeProps) {
  return (
    <View
      className={`items-center p-3 rounded-2xl border ${
        unlocked ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'
      }`}
      style={{ width: '30%' }}
    >
      <Text className={`text-3xl mb-1 ${unlocked ? '' : 'opacity-30'}`}>
        {achievement.emoji}
      </Text>
      <Text
        className={`text-xs font-semibold text-center ${
          unlocked ? 'text-purple-700' : 'text-gray-400'
        }`}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
      {!unlocked && (
        <Text className="text-xs text-gray-400 text-center mt-0.5" numberOfLines={2}>
          {achievement.description}
        </Text>
      )}
    </View>
  );
}
