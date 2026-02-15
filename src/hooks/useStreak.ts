'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useUser } from './useUser';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

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
  const [activeDates, setActiveDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from('daily_hands')
      .select('date, count')
      .eq('user_id', user.id)
      .gte('date', getDateStr(60))
      .order('date', { ascending: false })
      .then(({ data }) => {
        setActiveDates(new Set(
          (data || []).filter(d => d.count > 0).map(d => d.date as string)
        ));
      });
  }, [user]);

  // todayCount + DB 데이터 합쳐서 모든 값 실시간 계산
  const { currentStreak, bestStreak, weekDays, justCheckedIn } = useMemo(() => {
    const todayActive = todayCount > 0;

    // 최근 7일
    const days: WeekDay[] = [];
    for (let i = 6; i >= 0; i--) {
      days.push({
        label: getDayLabel(i),
        done: i === 0 ? todayActive : activeDates.has(getDateStr(i)),
      });
    }

    // 연속 일수: 오늘부터 역순
    let streak = 0;
    if (todayActive) {
      streak = 1;
      for (let i = 1; ; i++) {
        if (activeDates.has(getDateStr(i))) streak++;
        else break;
      }
    } else {
      // 오늘 아직 안 했으면 어제부터 (자정 유예)
      for (let i = 1; ; i++) {
        if (activeDates.has(getDateStr(i))) streak++;
        else break;
      }
    }

    // 최고 기록
    const allDates = new Set(activeDates);
    if (todayActive) allDates.add(getDateStr(0));
    const sorted = Array.from(allDates).sort();
    let best = 0;
    let run = 0;
    let prev = '';
    for (const dateStr of sorted) {
      if (prev) {
        const diff = (new Date(dateStr).getTime() - new Date(prev).getTime()) / 86400000;
        run = diff === 1 ? run + 1 : 1;
      } else {
        run = 1;
      }
      if (run > best) best = run;
      prev = dateStr;
    }

    // 오늘 첫 출석인지 (DB에는 없었는데 todayCount로 활성화됨)
    const wasInDb = activeDates.has(getDateStr(0));
    const justIn = todayActive && !wasInDb;

    return { currentStreak: streak, bestStreak: best, weekDays: days, justCheckedIn: justIn };
  }, [activeDates, todayCount]);

  return { currentStreak, bestStreak, weekDays, justCheckedIn };
}
