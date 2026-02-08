'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useUser } from './useUser';

export type WrongNote = {
  id?: string;
  hand: string;
  position: string;
  vsPosition?: string;
  mode: string;
  myAnswer: string;
  correctAnswer: string;
  createdAt?: string;
};

export function useWrongNotes() {
  const { user } = useUser();
  const [notes, setNotes] = useState<WrongNote[]>([]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from('wrong_notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => {
        setNotes((data || []).map((r: Record<string, unknown>) => ({
          id: r.id as string,
          hand: r.hand as string,
          position: r.position as string,
          vsPosition: r.vs_position as string | undefined,
          mode: r.mode as string,
          myAnswer: r.my_answer as string,
          correctAnswer: r.correct_answer as string,
          createdAt: r.created_at as string,
        })));
      });
  }, [user]);

  const addNote = useCallback(async (note: Omit<WrongNote, 'id' | 'createdAt'>) => {
    if (!user) return;
    setNotes(prev => [{ ...note, createdAt: new Date().toISOString() }, ...prev].slice(0, 20));

    const supabase = createClient();
    await supabase.from('wrong_notes').insert({
      user_id: user.id,
      hand: note.hand,
      position: note.position,
      vs_position: note.vsPosition,
      mode: note.mode,
      my_answer: note.myAnswer,
      correct_answer: note.correctAnswer,
    });
  }, [user]);

  const clearNotes = useCallback(async () => {
    if (!user) return;
    setNotes([]);
    const supabase = createClient();
    await supabase.from('wrong_notes').delete().eq('user_id', user.id);
  }, [user]);

  return { notes, addNote, clearNotes };
}
