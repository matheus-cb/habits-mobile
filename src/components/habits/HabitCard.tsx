import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CheckinButton } from './CheckinButton';
import type { Habit } from '@/types';

interface HabitCardProps {
  habit: Habit;
  isCheckedIn: boolean;
  onCheckin: (habitId: string) => Promise<void>;
  onUndoCheckin?: () => Promise<void>;
}

export function HabitCard({ habit, isCheckedIn, onCheckin, onUndoCheckin }: HabitCardProps) {
  const [loading, setLoading] = useState(false);
  const [loadingUndo, setLoadingUndo] = useState(false);

  async function handleCheckin() {
    setLoading(true);
    try {
      await onCheckin(habit.id);
    } finally {
      setLoading(false);
    }
  }

  async function handleUndo() {
    if (!onUndoCheckin) return;
    setLoadingUndo(true);
    try {
      await onUndoCheckin();
    } finally {
      setLoadingUndo(false);
    }
  }

  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className={`text-base font-semibold ${isCheckedIn ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {habit.title}
          </Text>
          {habit.description ? (
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
              {habit.description}
            </Text>
          ) : null}
        </View>
        <CheckinButton
          done={isCheckedIn}
          onPress={handleCheckin}
          onUndo={onUndoCheckin ? handleUndo : undefined}
          loading={loading}
          loadingUndo={loadingUndo}
        />
      </View>
    </Card>
  );
}
