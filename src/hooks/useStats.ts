'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useUser } from './useUser';

type ModeStats = { correct: number; wrong: number };

export function useStats() {
  const { user } = useUser();
  const [stats, setStats] = useState<Record<string, ModeStats>>({
    rfi: { correct: 0, wrong: 0 },
    facing: { correct: 0, wrong: 0 },
    vs3bet: { correct: 0, wrong: 0 },
    cbet: { correct: 0, wrong: 0 },
  });

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from('practice_stats').select('*').eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, ModeStats> = { ...stats };
        data.forEach((row: Record<string, unknown>) => {
          map[row.mode as string] = { correct: row.correct as number, wrong: row.wrong as number };
        });
        setStats(map);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const recordResult = useCallback(async (mode: string, isCorrect: boolean) => {
    if (!user) return;
    const prev = stats[mode] || { correct: 0, wrong: 0 };
    const updated = {
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    };
    setStats(s => ({ ...s, [mode]: updated }));

    const supabase = createClient();
    await supabase.from('practice_stats').upsert({
      user_id: user.id,
      mode,
      correct: updated.correct,
      wrong: updated.wrong,
    }, { onConflict: 'user_id,mode' });
  }, [user, stats]);

  const totalCorrect = Object.values(stats).reduce((s, m) => s + m.correct, 0);
  const totalWrong = Object.values(stats).reduce((s, m) => s + m.wrong, 0);
  const total = totalCorrect + totalWrong;
  const accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  return { stats, recordResult, totalCorrect, totalWrong, total, accuracy };
}
