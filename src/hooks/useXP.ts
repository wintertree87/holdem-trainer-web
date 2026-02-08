'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useUser } from './useUser';
import { XP_LEVELS } from '@/data/skill-tree';

export function useXP() {
  const { user } = useUser();
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    supabase.from('user_xp').select('total').eq('user_id', user.id).single()
      .then(({ data }) => {
        setTotalXP(data?.total ?? 0);
        setLoading(false);
      });
  }, [user]);

  const addXP = useCallback(async (amount: number) => {
    if (!user) return;
    const newTotal = totalXP + amount;
    setTotalXP(newTotal);

    const supabase = createClient();
    await supabase.from('user_xp').upsert({
      user_id: user.id,
      total: newTotal,
    }, { onConflict: 'user_id' });
  }, [user, totalXP]);

  const currentLevel = XP_LEVELS.reduce((acc, lvl) => totalXP >= lvl.xpRequired ? lvl : acc, XP_LEVELS[0]);
  const nextLevel = XP_LEVELS.find(l => l.xpRequired > totalXP);
  const progressPct = nextLevel
    ? Math.round(((totalXP - currentLevel.xpRequired) / (nextLevel.xpRequired - currentLevel.xpRequired)) * 100)
    : 100;

  return { totalXP, addXP, loading, currentLevel, nextLevel, progressPct };
}
