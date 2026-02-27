import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  format,
  isSameDay,
} from 'date-fns';
import type { Checkin } from '@/types';

export function useCalendar(checkinsMap: Record<string, Checkin[]>) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // "yyyy-MM-dd" → habitId[]
  const checkinsDateMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [habitId, checkins] of Object.entries(checkinsMap)) {
      for (const c of checkins) {
        const key = c.date.substring(0, 10);
        if (!map[key]) map[key] = [];
        map[key].push(habitId);
      }
    }
    return map;
  }, [checkinsMap]);

  function goToPrevMonth() {
    setCurrentMonth((prev) => subMonths(prev, 1));
    setSelectedDay(null);
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => addMonths(prev, 1));
    setSelectedDay(null);
  }

  function selectDay(day: Date) {
    setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));
  }

  function closeDay() {
    setSelectedDay(null);
  }

  return {
    currentMonth,
    selectedDay,
    goToPrevMonth,
    goToNextMonth,
    selectDay,
    closeDay,
    calendarDays,
    checkinsDateMap,
  };
}
