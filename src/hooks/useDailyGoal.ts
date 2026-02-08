'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useUser } from './useUser';
import { DAILY_GOAL } from '@/data/constants';

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyGoal() {
  const { user } = useUser();
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from('daily_hands').select('count').eq('user_id', user.id).eq('date', getToday()).single()
      .then(({ data }) => {
        setTodayCount(data?.count ?? 0);
      });
  }, [user]);

  const increment = useCallback(async () => {
    if (!user) return;
    const newCount = todayCount + 1;
    setTodayCount(newCount);

    const supabase = createClient();
    await supabase.from('daily_hands').upsert({
      user_id: user.id,
      date: getToday(),
      count: newCount,
    }, { onConflict: 'user_id,date' });

    return newCount;
  }, [user, todayCount]);

  const isComplete = todayCount >= DAILY_GOAL;
  const percentage = Math.min(100, Math.round((todayCount / DAILY_GOAL) * 100));

  return { todayCount, increment, isComplete, percentage, goal: DAILY_GOAL };
}
