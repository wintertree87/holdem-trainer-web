'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useUser } from './useUser';

const MAX_HEARTS = 5;
const RECOVERY_MS = 30 * 60 * 1000; // 30분

type HeartsRow = {
  hearts: number;
  last_recovered_at: string;
};

function calcRecovery(dbHearts: number, lastRecoveredAt: string): { hearts: number; lastRecoveredAt: Date } {
  if (dbHearts >= MAX_HEARTS) {
    return { hearts: MAX_HEARTS, lastRecoveredAt: new Date(lastRecoveredAt) };
  }

  const lastTime = new Date(lastRecoveredAt).getTime();
  const elapsed = Date.now() - lastTime;
  const recovered = Math.floor(elapsed / RECOVERY_MS);

  if (recovered <= 0) {
    return { hearts: dbHearts, lastRecoveredAt: new Date(lastRecoveredAt) };
  }

  const newHearts = Math.min(MAX_HEARTS, dbHearts + recovered);
  const newLastRecovered = new Date(lastTime + recovered * RECOVERY_MS);

  return { hearts: newHearts, lastRecoveredAt: newLastRecovered };
}

export function useHearts() {
  const { user } = useUser();
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [lastRecoveredAt, setLastRecoveredAt] = useState<Date>(new Date());
  const [nextRecoveryMs, setNextRecoveryMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load hearts from DB
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const supabase = createClient();
    supabase
      .from('user_hearts')
      .select('hearts, last_recovered_at')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // 기존 유저 fallback: 레코드 없으면 생성
          supabase
            .from('user_hearts')
            .upsert({ user_id: user.id, hearts: MAX_HEARTS, last_recovered_at: new Date().toISOString() })
            .then(() => {
              setHearts(MAX_HEARTS);
              setLastRecoveredAt(new Date());
              setLoading(false);
            });
          return;
        }

        const row = data as HeartsRow;
        const { hearts: h, lastRecoveredAt: lr } = calcRecovery(row.hearts, row.last_recovered_at);
        setHearts(h);
        setLastRecoveredAt(lr);
        setLoading(false);

        // DB에 회복된 값 반영 (조용히)
        if (h !== row.hearts) {
          supabase
            .from('user_hearts')
            .update({ hearts: h, last_recovered_at: lr.toISOString() })
            .eq('user_id', user.id)
            .then(() => {});
        }
      });
  }, [user]);

  // Timer: 매 초 카운트다운 업데이트
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const tick = () => {
      if (hearts >= MAX_HEARTS) {
        setNextRecoveryMs(null);
        return;
      }

      const elapsed = Date.now() - lastRecoveredAt.getTime();
      const remaining = RECOVERY_MS - (elapsed % RECOVERY_MS);

      // 회복 시점 도달
      const newRecovered = Math.floor(elapsed / RECOVERY_MS);
      if (newRecovered > 0) {
        const newHearts = Math.min(MAX_HEARTS, hearts + newRecovered);
        const newLast = new Date(lastRecoveredAt.getTime() + newRecovered * RECOVERY_MS);
        setHearts(newHearts);
        setLastRecoveredAt(newLast);

        if (newHearts >= MAX_HEARTS) {
          setNextRecoveryMs(null);
        } else {
          setNextRecoveryMs(RECOVERY_MS);
        }

        // DB 업데이트
        if (user) {
          const supabase = createClient();
          supabase
            .from('user_hearts')
            .update({ hearts: newHearts, last_recovered_at: newLast.toISOString() })
            .eq('user_id', user.id)
            .then(() => {});
        }
        return;
      }

      setNextRecoveryMs(remaining);
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hearts, lastRecoveredAt, user]);

  // 하트 소진
  const consumeHeart = useCallback(async (): Promise<number> => {
    if (hearts <= 0) return 0;

    const newHearts = hearts - 1;
    const now = new Date();
    // 풀 하트 상태에서 처음 소진 시 lastRecoveredAt 리셋
    const newLast = hearts === MAX_HEARTS ? now : lastRecoveredAt;

    setHearts(newHearts);
    setLastRecoveredAt(newLast);

    if (user) {
      const supabase = createClient();
      await supabase
        .from('user_hearts')
        .update({ hearts: newHearts, last_recovered_at: newLast.toISOString() })
        .eq('user_id', user.id);
    }

    return newHearts;
  }, [hearts, lastRecoveredAt, user]);

  const canStartLesson = hearts > 0;

  return {
    hearts,
    maxHearts: MAX_HEARTS,
    nextRecoveryMs,
    loading,
    consumeHeart,
    canStartLesson,
  };
}
