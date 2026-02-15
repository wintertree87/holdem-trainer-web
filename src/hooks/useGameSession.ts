'use client';

import { useState, useCallback, useRef } from 'react';
import { type GameTier, HANDS_PER_MATCH, STARTING_STACK, POSITION_MATCHUPS } from '@/data/game-config';
import { type GameState, type GameResult, type ActionRecord, initHand, applyGameAction, getNextToAct, getHeroActions } from '@/engine/game-state';
import { type GameAction } from '@/engine/pot-manager';
import { type Card } from '@/data/constants';
import { decideBotAction } from '@/engine/bot-ai';

export type HandRecord = {
  number: number;
  result: GameResult | null;
  heroStackChange: number;
  heroHand?: Card[];
  heroPosition?: string;
  botPosition?: string;
  preflopActions?: ActionRecord[];
};

export type MatchState = {
  tier: GameTier;
  handNumber: number;
  heroStack: number;
  botStack: number;
  currentHand: GameState | null;
  matchHistory: HandRecord[];
  matchComplete: boolean;
  heroPosition: string;
  botPosition: string;
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
  history: HandRecord[];
};

function pickRandomPositions(): { heroPosition: string; botPosition: string } {
  const matchup = POSITION_MATCHUPS[Math.floor(Math.random() * POSITION_MATCHUPS.length)];
  const heroIsOpener = Math.random() < 0.5;
  return {
    heroPosition: heroIsOpener ? matchup[0] : matchup[1],
    botPosition: heroIsOpener ? matchup[1] : matchup[0],
  };
}

export function useGameSession() {
  const [match, setMatch] = useState<MatchState | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startMatch = useCallback((tier: GameTier) => {
    const { heroPosition, botPosition } = pickRandomPositions();
    const hand = initHand(STARTING_STACK, STARTING_STACK, heroPosition, botPosition);

    const newMatch: MatchState = {
      tier,
      handNumber: 1,
      heroStack: STARTING_STACK,
      botStack: STARTING_STACK,
      currentHand: hand,
      matchHistory: [],
      matchComplete: false,
      heroPosition,
      botPosition,
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

        if (newHand.result) {
          return { ...prev, currentHand: newHand };
        }

        const nextNext = getNextToAct(newHand);
        if (nextNext === 'bot') {
          const updated = { ...prev, currentHand: newHand };
          setTimeout(() => scheduleBotAction(updated), 500);
          return updated;
        }

        return { ...prev, currentHand: newHand };
      });
    }, 600 + Math.random() * 400);
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

      const preflopActions = prev.currentHand.actionHistory.filter(a => a.street === 'preflop');

      const record: HandRecord = {
        number: prev.handNumber,
        result,
        heroStackChange: newHeroStack - prev.heroStack,
        heroHand: [...prev.currentHand.heroHand],
        heroPosition: prev.heroPosition,
        botPosition: prev.botPosition,
        preflopActions,
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
          history: newHistory,
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

      // Next hand — pick new random positions
      const { heroPosition, botPosition } = pickRandomPositions();
      const newHand = initHand(newHeroStack, newBotStack, heroPosition, botPosition);
      const updated: MatchState = {
        ...prev,
        handNumber: newHandNumber,
        heroStack: newHeroStack,
        botStack: newBotStack,
        currentHand: newHand,
        matchHistory: newHistory,
        heroPosition,
        botPosition,
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
