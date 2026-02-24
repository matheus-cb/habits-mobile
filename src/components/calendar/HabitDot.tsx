import React from 'react';
import { View } from 'react-native';

// Fixed palette — indexed by position in habits list
export const HABIT_COLORS = [
  '#7c3aed', // purple
  '#2563eb', // blue
  '#059669', // green
  '#d97706', // amber
  '#dc2626', // red
  '#db2777', // pink
  '#0891b2', // cyan
];

export function habitColor(index: number): string {
  return HABIT_COLORS[index % HABIT_COLORS.length];
}

interface HabitDotProps {
  color: string;
}

export function HabitDot({ color }: HabitDotProps) {
  return (
    <View
      style={{
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: color,
        marginHorizontal: 1,
      }}
    />
  );
}
