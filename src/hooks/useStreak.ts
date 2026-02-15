'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useUser } from './useUser';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getDateStr(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function useStreak() {
  const { user } = useUser();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [todayDone, setTodayDone] = useState(false);
  const [weekDays, setWeekDays] = useState<boolean[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    // 최근 60일 데이터 가져오기 (streak 계산 + 주간 표시)
    const since = getDateStr(60);
    supabase
      .from('daily_hands')
      .select('date, count')
      .eq('user_id', user.id)
      .gte('date', since)
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!data) return;

        const dateSet = new Set(data.filter(d => d.count > 0).map(d => d.date));
        const today = getToday();

        // 오늘 했는지
        const doneToday = dateSet.has(today);
        setTodayDone(doneToday);

        // 연속 일수 계산: 오늘부터 역순. 오늘 안 했으면 어제부터 세기 (자정까지 유예)
        let streak = 0;
        const startOffset = doneToday ? 0 : 1;
        for (let i = startOffset; ; i++) {
          const d = getDateStr(i);
          if (dateSet.has(d)) {
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
            if (diff === 1) {
              run++;
            } else {
              run = 1;
            }
          } else {
            run = 1;
          }
          if (run > best) best = run;
          prev = dateStr;
        }
        setBestStreak(best);

        // 이번 주 활동 (월~일 기준, 최근 7일)
        const week: boolean[] = [];
        for (let i = 6; i >= 0; i--) {
          week.push(dateSet.has(getDateStr(i)));
        }
        setWeekDays(week);
      });
  }, [user]);

  return { currentStreak, bestStreak, todayDone, weekDays };
}
