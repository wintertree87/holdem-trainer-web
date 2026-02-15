'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useUser } from './useUser';

export type LessonData = {
  crown: number;
  bestAccuracy: number;
  attempts: number;
  lastAttempt: string | null;
};

export function useProgress() {
  const { user } = useUser();
  const [progress, setProgress] = useState<Record<string, LessonData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setProgress({});
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    const supabase = createClient();
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id);

        if (!mounted) return;
        if (error) {
          console.error('Failed to load lesson_progress:', error);
          setProgress({});
          return;
        }
        const map: Record<string, LessonData> = {};
        data?.forEach((row: Record<string, unknown>) => {
          map[row.lesson_id as string] = {
            crown: row.crown as number,
            bestAccuracy: row.best_accuracy as number,
            attempts: row.attempts as number,
            lastAttempt: row.last_attempt as string | null,
          };
        });
        setProgress(map);
      } catch (error) {
        if (!mounted) return;
        console.error('Unexpected lesson_progress error:', error);
        setProgress({});
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  const updateLesson = useCallback(async (lessonId: string, data: Partial<LessonData>) => {
    if (!user) return;
    const prev = progress[lessonId] || { crown: 0, bestAccuracy: 0, attempts: 0, lastAttempt: null };
    const merged = { ...prev, ...data };
    setProgress(p => ({ ...p, [lessonId]: merged }));

    const supabase = createClient();
    await supabase.from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      crown: merged.crown,
      best_accuracy: merged.bestAccuracy,
      attempts: merged.attempts,
      last_attempt: merged.lastAttempt,
    }, { onConflict: 'user_id,lesson_id' });
  }, [user, progress]);

  return { progress, loading, updateLesson };
}
