'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useUser } from './useUser';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getDateStr(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function getDayLabel(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return DAY_NAMES[d.getDay()];
}

export type WeekDay = { label: string; done: boolean };

export function useStreak(todayCount: number) {
  const { user } = useUser();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [todayDone, setTodayDone] = useState(false);
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());

  // 최근 7일: 실제 요일 라벨 + 활동 여부
  // todayCount를 직접 반영해서 문제 풀면 즉시 오늘 칸 업데이트
  const weekDays = useMemo<WeekDay[]>(() => {
    const days: WeekDay[] = [];
    for (let i = 6; i >= 0; i--) {
      days.push({
        label: getDayLabel(i),
        done: i === 0 ? todayCount > 0 : activeDates.has(getDateStr(i)),
      });
    }
    return days;
  }, [activeDates, todayCount]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    const since = getDateStr(60);
    supabase
      .from('daily_hands')
      .select('date, count')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: false })
      .then(({ data }) => {
        const dateSet = new Set(
          (data || []).filter(d => d.count > 0).map(d => d.date as string)
        );
        setActiveDates(dateSet);

        const today = getToday();
        const doneToday = dateSet.has(today);
        setTodayDone(doneToday);

        // 연속 일수 계산
        let streak = 0;
        const startOffset = doneToday ? 0 : 1;
        for (let i = startOffset; ; i++) {
          if (dateSet.has(getDateStr(i))) {
            streak++;
          } else {
            break;
          }
        }
        setCurrentStreak(streak);

        // 최고 연속 기록
        const sorted = Array.from(dateSet).sort();
        let best = 0;
        let run = 0;
        let prev = '';
        for (const dateStr of sorted) {
          if (prev) {
            const prevDate = new Date(prev);
            const currDate = new Date(dateStr);
            const diff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
            run = diff === 1 ? run + 1 : 1;
          } else {
            run = 1;
          }
          if (run > best) best = run;
          prev = dateStr;
        }
        setBestStreak(best);
      });
  }, [user]);

  return { currentStreak, bestStreak, todayDone, weekDays };
}
