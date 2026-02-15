'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { generateDailyChallenge, type DailyChallengeData } from '@/utils/daily-challenge';

type Distribution = Record<string, number>;

type DailyChallengeState = {
  challenge: DailyChallengeData | null;
  challengeId: string | null;
  userAnswer: string | null;
  isCorrect: boolean | null;
  distribution: Distribution | null;
  totalResponses: number;
  loading: boolean;
};

function getTodayKST(): string {
  const now = new Date();
  // KST = UTC+9
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function useDailyChallenge(userId?: string) {
  const [state, setState] = useState<DailyChallengeState>({
    challenge: null,
    challengeId: null,
    userAnswer: null,
    isCorrect: null,
    distribution: null,
    totalResponses: 0,
    loading: true,
  });

  const today = getTodayKST();

  // Load or create today's challenge
  useEffect(() => {
    if (!userId) { setState(s => ({ ...s, loading: false })); return; }

    const load = async () => {
      const supabase = createClient();

      // 1. Try to find today's challenge in DB
      let { data: existing } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', today)
        .single();

      let challengeId: string;
      let challenge: DailyChallengeData;

      if (existing) {
        challengeId = existing.id;
        challenge = {
          quizType: existing.quiz_type,
          position: existing.position,
          vsPosition: existing.vs_position,
          hand: existing.hand,
          correctAnswer: existing.correct_answer,
          options: existing.options as string[],
          explanation: existing.explanation,
        };
      } else {
        // Generate deterministic challenge from date
        challenge = generateDailyChallenge(today);

        // Insert into DB
        const { data: inserted, error } = await supabase
          .from('daily_challenges')
          .insert({
            challenge_date: today,
            quiz_type: challenge.quizType,
            position: challenge.position,
            vs_position: challenge.vsPosition || null,
            hand: challenge.hand,
            correct_answer: challenge.correctAnswer,
            options: challenge.options,
            explanation: challenge.explanation,
          })
          .select('id')
          .single();

        if (error) {
          // Another user might have inserted it — try reading again
          const { data: retry } = await supabase
            .from('daily_challenges')
            .select('*')
            .eq('challenge_date', today)
            .single();
          if (retry) {
            challengeId = retry.id;
          } else {
            setState(s => ({ ...s, loading: false }));
            return;
          }
        } else {
          challengeId = inserted!.id;
        }
      }

      // 2. Check if user already answered
      const { data: response } = await supabase
        .from('daily_responses')
        .select('selected_answer, is_correct')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      let distribution: Distribution | null = null;
      let totalResponses = 0;

      if (response) {
        // User already answered — load distribution
        const { data: dist } = await supabase.rpc('get_daily_distribution', { p_challenge_id: challengeId });
        if (dist) {
          distribution = {};
          for (const row of dist) {
            distribution[row.selected_answer] = Number(row.count);
            totalResponses += Number(row.count);
          }
        }
      }

      setState({
        challenge,
        challengeId: challengeId!,
        userAnswer: response?.selected_answer || null,
        isCorrect: response?.is_correct ?? null,
        distribution,
        totalResponses,
        loading: false,
      });
    };

    load();
  }, [userId, today]);

  // Submit answer
  const submitAnswer = useCallback(async (answer: string) => {
    if (!userId || !state.challengeId || state.userAnswer) return;

    const supabase = createClient();
    const isCorrect = answer === state.challenge?.correctAnswer;

    await supabase.from('daily_responses').insert({
      challenge_id: state.challengeId,
      user_id: userId,
      selected_answer: answer,
      is_correct: isCorrect,
    });

    // Load updated distribution
    const { data: dist } = await supabase.rpc('get_daily_distribution', { p_challenge_id: state.challengeId });
    let distribution: Distribution = {};
    let totalResponses = 0;
    if (dist) {
      for (const row of dist) {
        distribution[row.selected_answer] = Number(row.count);
        totalResponses += Number(row.count);
      }
    }

    setState(s => ({
      ...s,
      userAnswer: answer,
      isCorrect,
      distribution,
      totalResponses,
    }));
  }, [userId, state.challengeId, state.challenge, state.userAnswer]);

  return {
    ...state,
    submitAnswer,
    today,
  };
}
