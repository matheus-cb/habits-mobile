import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { subDays, startOfWeek, subWeeks, eachDayOfInterval, format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Checkin } from '@/types';

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function heatColor(count: number): string {
  if (count === 0) return '#f3f4f6';
  if (count === 1) return '#e9d5ff';
  if (count === 2) return '#a855f7';
  return '#7c3aed';
}

interface ActivityHeatmapProps {
  checkinsMap: Record<string, Checkin[]>;
}

export function ActivityHeatmap({ checkinsMap }: ActivityHeatmapProps) {
  // Build 12 full weeks (84 days) starting from the Sunday 11 weeks ago
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const startSunday = startOfWeek(subWeeks(today, 11), { weekStartsOn: 0 });
    const allDays = eachDayOfInterval({ start: startSunday, end: today });

    // Count check-ins per day across all habits
    const countByDate: Record<string, number> = {};
    for (const checkins of Object.values(checkinsMap)) {
      for (const c of checkins) {
        const key = c.date.substring(0, 10);
        countByDate[key] = (countByDate[key] ?? 0) + 1;
      }
    }

    // Group into weeks (7 days each)
    const weeks: Array<Array<{ date: string; count: number }>> = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(
        allDays.slice(i, i + 7).map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          return { date: key, count: countByDate[key] ?? 0 };
        })
      );
    }

    // Month labels: first week that starts a new month
    const monthLabels: Record<number, string> = {};
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = new Date(week[0].date);
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        monthLabels[wi] = format(firstDay, 'MMM', { locale: ptBR });
        lastMonth = m;
      }
    });

    return { weeks, monthLabels };
  }, [checkinsMap]);

  function onCellPress(date: string, count: number) {
    const label = format(new Date(date), "d 'de' MMMM", { locale: ptBR });
    Alert.alert(label, count === 0 ? 'Nenhum check-in' : `${count} check-in${count > 1 ? 's' : ''}`);
  }

  return (
    <View className="mx-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-1">Mapa de Atividade</Text>
      <Text className="text-xs text-gray-400 mb-3">Últimas 12 semanas — soma de todos os hábitos</Text>

      {/* Month labels row */}
      <View className="flex-row mb-1" style={{ marginLeft: 20 }}>
        {weeks.map((_, wi) => (
          <View key={wi} style={{ flex: 1 }}>
            {monthLabels[wi] ? (
              <Text style={{ fontSize: 9, color: '#9ca3af' }}>{monthLabels[wi]}</Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Grid: 7 rows × 12 columns */}
      <View className="flex-row">
        {/* Day labels */}
        <View style={{ width: 20, gap: 3 }}>
          {DAY_LABELS.map((label, i) => (
            <View key={i} style={{ flex: 1, aspectRatio: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 9, color: '#9ca3af', textAlign: 'right', paddingRight: 3 }}>
                {i % 2 === 0 ? label : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Heatmap cells */}
        <View className="flex-1" style={{ gap: 3 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
            <View key={dayIndex} className="flex-row" style={{ gap: 3 }}>
              {weeks.map((week, wi) => {
                const cell = week[dayIndex];
                if (!cell) {
                  return <View key={wi} style={{ flex: 1, aspectRatio: 1 }} />;
                }
                return (
                  <TouchableOpacity
                    key={wi}
                    onPress={() => onCellPress(cell.date, cell.count)}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      backgroundColor: heatColor(cell.count),
                      borderRadius: 2,
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View className="flex-row items-center gap-1.5 mt-3 self-end">
        <Text style={{ fontSize: 9, color: '#9ca3af' }}>Menos</Text>
        {[0, 1, 2, 3].map((v) => (
          <View
            key={v}
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: heatColor(v) }}
          />
        ))}
        <Text style={{ fontSize: 9, color: '#9ca3af' }}>Mais</Text>
      </View>
    </View>
  );
}
