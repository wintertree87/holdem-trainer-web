'use client';

import { useState, useCallback, useRef } from 'react';
import { type GameTier, HANDS_PER_MATCH, STARTING_STACK } from '@/data/game-config';
import { type GameState, type GameResult, initHand, applyGameAction, getNextToAct, getHeroActions } from '@/engine/game-state';
import { type GameAction } from '@/engine/pot-manager';
import { decideBotAction } from '@/engine/bot-ai';

export type HandRecord = {
  number: number;
  result: GameResult | null;
  heroStackChange: number;
};

export type MatchState = {
  tier: GameTier;
  handNumber: number;
  heroStack: number;
  botStack: number;
  currentHand: GameState | null;
  matchHistory: HandRecord[];
  matchComplete: boolean;
  heroIsButton: boolean;
};

export type MatchResult = {
  tier: GameTier;
  winner: 'hero' | 'bot' | 'tie';
  heroFinalStack: number;
  botFinalStack: number;
  handsPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  bbWon: number;
};

export function useGameSession() {
  const [match, setMatch] = useState<MatchState | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startMatch = useCallback((tier: GameTier) => {
    const heroIsButton = Math.random() < 0.5;
    const hand = initHand(STARTING_STACK, STARTING_STACK, heroIsButton);

    const newMatch: MatchState = {
      tier,
      handNumber: 1,
      heroStack: STARTING_STACK,
      botStack: STARTING_STACK,
      currentHand: hand,
      matchHistory: [],
      matchComplete: false,
      heroIsButton,
    };

    setMatch(newMatch);
    setMatchResult(null);
    setShowResult(false);

    // If bot acts first, trigger bot action
    const nextActor = getNextToAct(hand);
    if (nextActor === 'bot') {
      scheduleBotAction(newMatch);
    }
  }, []);

  const scheduleBotAction = useCallback((currentMatch: MatchState) => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    botTimerRef.current = setTimeout(() => {
      setMatch(prev => {
        if (!prev || !prev.currentHand) return prev;
        const hand = prev.currentHand;
        const nextActor = getNextToAct(hand);
        if (nextActor !== 'bot') return prev;

        const botAction = decideBotAction(hand);
        let newHand = applyGameAction(hand, 'bot', botAction);

        // Check if hand is over
        if (newHand.result) {
          return { ...prev, currentHand: newHand };
        }

        // Check if bot should act again
        const nextNext = getNextToAct(newHand);
        if (nextNext === 'bot') {
          // Schedule another bot action
          const updated = { ...prev, currentHand: newHand };
          setTimeout(() => scheduleBotAction(updated), 500);
          return updated;
        }

        return { ...prev, currentHand: newHand };
      });
    }, 600 + Math.random() * 400); // 600-1000ms delay
  }, []);

  const handleHeroAction = useCallback((action: GameAction) => {
    setMatch(prev => {
      if (!prev || !prev.currentHand) return prev;
      const hand = prev.currentHand;
      const nextActor = getNextToAct(hand);
      if (nextActor !== 'hero') return prev;

      let newHand = applyGameAction(hand, 'hero', action);
      const updated = { ...prev, currentHand: newHand };

      if (newHand.result) {
        return updated;
      }

      // If bot's turn, schedule
      const nextNext = getNextToAct(newHand);
      if (nextNext === 'bot') {
        setTimeout(() => scheduleBotAction(updated), 100);
      }

      return updated;
    });
  }, [scheduleBotAction]);

  const handleShowResult = useCallback(() => {
    setShowResult(true);
  }, []);

  const nextHand = useCallback(() => {
    setMatch(prev => {
      if (!prev || !prev.currentHand) return prev;

      const result = prev.currentHand.result;
      let stackChange = 0;
      if (result) {
        if (result.winner === 'hero') {
          stackChange = result.potWon / 2; // net win = half pot (we put half in)
        } else if (result.winner === 'bot') {
          stackChange = -(result.potWon / 2);
        }
        // For tie, stackChange = 0
      }

      // Calculate stacks based on actual betting
      const handBets = prev.currentHand.bets;
      let newHeroStack: number;
      let newBotStack: number;

      if (result) {
        if (result.winner === 'hero') {
          newHeroStack = handBets.heroStack + handBets.pot;
          newBotStack = handBets.botStack;
        } else if (result.winner === 'bot') {
          newHeroStack = handBets.heroStack;
          newBotStack = handBets.botStack + handBets.pot;
        } else {
          // Tie — split pot
          newHeroStack = handBets.heroStack + handBets.pot / 2;
          newBotStack = handBets.botStack + handBets.pot / 2;
        }
      } else {
        newHeroStack = prev.heroStack;
        newBotStack = prev.botStack;
      }

      const record: HandRecord = {
        number: prev.handNumber,
        result,
        heroStackChange: newHeroStack - prev.heroStack,
      };

      const newHistory = [...prev.matchHistory, record];
      const newHandNumber = prev.handNumber + 1;

      // Match over?
      if (newHandNumber > HANDS_PER_MATCH || newHeroStack <= 0 || newBotStack <= 0) {
        const wins = newHistory.filter(h => h.result?.winner === 'hero').length;
        const losses = newHistory.filter(h => h.result?.winner === 'bot').length;
        const ties = newHistory.filter(h => h.result?.winner === 'tie').length;
        const bbWon = newHeroStack - STARTING_STACK;

        setMatchResult({
          tier: prev.tier,
          winner: bbWon > 0 ? 'hero' : bbWon < 0 ? 'bot' : 'tie',
          heroFinalStack: newHeroStack,
          botFinalStack: newBotStack,
          handsPlayed: newHistory.length,
          wins,
          losses,
          ties,
          bbWon,
        });

        return {
          ...prev,
          handNumber: newHandNumber,
          heroStack: newHeroStack,
          botStack: newBotStack,
          matchHistory: newHistory,
          matchComplete: true,
          currentHand: null,
        };
      }

      // Start next hand with alternating button
      const newHeroIsButton = !prev.heroIsButton;
      const newHand = initHand(newHeroStack, newBotStack, newHeroIsButton);
      const updated: MatchState = {
        ...prev,
        handNumber: newHandNumber,
        heroStack: newHeroStack,
        botStack: newBotStack,
        currentHand: newHand,
        matchHistory: newHistory,
        heroIsButton: newHeroIsButton,
      };

      setShowResult(false);

      // If bot acts first, schedule
      const nextActor = getNextToAct(newHand);
      if (nextActor === 'bot') {
        setTimeout(() => scheduleBotAction(updated), 500);
      }

      return updated;
    });
  }, [scheduleBotAction]);

  const endMatch = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setMatch(null);
    setMatchResult(null);
    setShowResult(false);
  }, []);

  return {
    match,
    matchResult,
    showResult,
    startMatch,
    handleHeroAction,
    handleShowResult,
    nextHand,
    endMatch,
  };
}
