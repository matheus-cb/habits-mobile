import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { subDays, format, parseISO } from 'date-fns';
import type { Checkin } from '@/types';

interface CompletionChartProps {
  checkins: Checkin[];
}

export function CompletionChart({ checkins }: CompletionChartProps) {
  const barData = useMemo(() => {
    const today = new Date();
    const checkinDates = new Set(
      checkins.map((c) => c.date.split('T')[0])
    );

    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(today, 29 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const done = checkinDates.has(dateStr);
      return {
        value: done ? 1 : 0,
        frontColor: done ? '#9333ea' : '#e5e7eb',
        label: i % 7 === 0 ? format(date, 'dd/MM') : '',
        labelTextStyle: { color: '#6b7280', fontSize: 9 },
      };
    });
  }, [checkins]);

  return (
    <View>
      <Text className="text-sm font-medium text-gray-500 mb-3">Últimos 30 dias</Text>
      <BarChart
        data={barData}
        barWidth={8}
        spacing={3}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisLabelWidth={0}
        noOfSections={1}
        maxValue={1}
        height={80}
        isAnimated
      />
    </View>
  );
}
