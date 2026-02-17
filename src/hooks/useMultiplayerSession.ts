'use client';

import { useState, useCallback, useRef } from 'react';
import { type GameTier, HANDS_PER_MATCH, STARTING_STACK } from '@/data/game-config';
import { type GameAction } from '@/engine/pot-manager';
import { type Card } from '@/data/constants';
import { type PlayerId, ALL_PLAYER_IDS } from '@/engine/mp-pot-manager';
import {
  type MPGameState,
  type MPGameResult,
  type MPActionRecord,
  initMPHand,
  applyMPAction,
  getNextToAct,
  getHeroMPActions,
} from '@/engine/mp-game-state';
import { decideMPBotAction } from '@/engine/mp-bot-ai';

export type MPHandRecord = {
  number: number;
  result: MPGameResult | null;
  heroStackChange: number;
  heroHand?: Card[];
  heroPosition?: string;
  allPlayers: {
    id: PlayerId;
    position: string;
    hand?: Card[];
    stackChange: number;
  }[];
  preflopActions?: MPActionRecord[];
};

export type MPMatchState = {
  tier: GameTier;
  handNumber: number;
  players: { id: PlayerId; stack: number }[];
  btnIndex: number;
  currentHand: MPGameState | null;
  matchHistory: MPHandRecord[];
  matchComplete: boolean;
};

export type MPMatchResult = {
  tier: GameTier;
  heroFinalStack: number;
  handsPlayed: number;
  bbWon: number;
  wins: number;
  losses: number;
  ranking: { id: PlayerId; stack: number }[];
  history: MPHandRecord[];
};

function calculateStackChanges(
  state: MPGameState,
  result: MPGameResult,
  prevStacks: Map<PlayerId, number>,
): Map<PlayerId, number> {
  const changes = new Map<PlayerId, number>();

  // Start with what each player lost (total invested)
  for (const p of state.bets.players) {
    changes.set(p.id, -p.totalInvested);
  }

  // Add pot winnings
  for (const pot of result.pots) {
    if (pot.winners.length === 0) continue;
    const share = pot.amount / pot.winners.length;
    for (const winner of pot.winners) {
      changes.set(winner, (changes.get(winner) ?? 0) + share);
    }
  }

  return changes;
}

export function useMultiplayerSession() {
  const [match, setMatch] = useState<MPMatchState | null>(null);
  const [matchResult, setMatchResult] = useState<MPMatchResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleBotActions = useCallback((currentMatch: MPMatchState) => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    botTimerRef.current = setTimeout(() => {
      setMatch(prev => {
        if (!prev || !prev.currentHand) return prev;
        const hand = prev.currentHand;
        const nextPlayerId = getNextToAct(hand);

        if (!nextPlayerId || nextPlayerId === 'hero') return prev;

        // Bot's turn
        const botAction = decideMPBotAction(hand, nextPlayerId);
        const newHand = applyMPAction(hand, nextPlayerId, botAction);
        const updated = { ...prev, currentHand: newHand };

        if (newHand.result) {
          return updated;
        }

        const nextNext = getNextToAct(newHand);
        if (nextNext && nextNext !== 'hero') {
          // Another bot needs to act
          setTimeout(() => scheduleBotActions(updated), 400 + Math.random() * 300);
        }

        return updated;
      });
    }, 600 + Math.random() * 400);
  }, []);

  const startMatch = useCallback((tier: GameTier) => {
    const players = ALL_PLAYER_IDS.map(id => ({ id, stack: STARTING_STACK }));
    const btnIndex = Math.floor(Math.random() * 6);

    const stacks = new Map<PlayerId, number>();
    players.forEach(p => stacks.set(p.id, p.stack));

    const hand = initMPHand(stacks, btnIndex);

    const newMatch: MPMatchState = {
      tier,
      handNumber: 1,
      players,
      btnIndex,
      currentHand: hand,
      matchHistory: [],
      matchComplete: false,
    };

    setMatch(newMatch);
    setMatchResult(null);
    setShowResult(false);

    // If bot acts first, trigger
    const nextActor = getNextToAct(hand);
    if (nextActor && nextActor !== 'hero') {
      scheduleBotActions(newMatch);
    }
  }, [scheduleBotActions]);

  const handleHeroAction = useCallback((action: GameAction) => {
    setMatch(prev => {
      if (!prev || !prev.currentHand) return prev;
      const hand = prev.currentHand;
      const nextActor = getNextToAct(hand);
      if (nextActor !== 'hero') return prev;

      const newHand = applyMPAction(hand, 'hero', action);
      const updated = { ...prev, currentHand: newHand };

      if (newHand.result) {
        return updated;
      }

      const nextNext = getNextToAct(newHand);
      if (nextNext && nextNext !== 'hero') {
        setTimeout(() => scheduleBotActions(updated), 100);
      }

      return updated;
    });
  }, [scheduleBotActions]);

  const handleShowResult = useCallback(() => {
    setShowResult(true);
  }, []);

  const nextHand = useCallback(() => {
    setMatch(prev => {
      if (!prev || !prev.currentHand) return prev;

      const hand = prev.currentHand;
      const result = hand.result;
      if (!result) return prev;

      // Calculate stack changes
      const prevStacks = new Map<PlayerId, number>();
      prev.players.forEach(p => prevStacks.set(p.id, p.stack));

      const stackChanges = calculateStackChanges(hand, result, prevStacks);

      // New stacks
      const newPlayers = prev.players.map(p => ({
        ...p,
        stack: p.stack + (stackChanges.get(p.id) ?? 0),
      }));

      const heroChange = stackChanges.get('hero') ?? 0;
      const heroPlayer = hand.players.find(p => p.id === 'hero')!;

      const record: MPHandRecord = {
        number: prev.handNumber,
        result,
        heroStackChange: heroChange,
        heroHand: [...heroPlayer.hand],
        heroPosition: heroPlayer.position,
        allPlayers: hand.players.map(p => ({
          id: p.id,
          position: p.position,
          hand: result.wonByFold ? undefined : [...p.hand],
          stackChange: stackChanges.get(p.id) ?? 0,
        })),
        preflopActions: hand.actionHistory.filter(a => a.street === 'preflop'),
      };

      const newHistory = [...prev.matchHistory, record];
      const newHandNumber = prev.handNumber + 1;

      // Match over?
      const heroStack = newPlayers.find(p => p.id === 'hero')!.stack;
      if (newHandNumber > HANDS_PER_MATCH || heroStack <= 0) {
        const wins = newHistory.filter(h => {
          if (!h.result) return false;
          return h.result.pots.some(pot => pot.winners.includes('hero'));
        }).length;
        const losses = newHistory.filter(h => {
          if (!h.result) return false;
          return !h.result.pots.some(pot => pot.winners.includes('hero'));
        }).length;
        const bbWon = heroStack - STARTING_STACK;

        const ranking = [...newPlayers].sort((a, b) => b.stack - a.stack);

        setMatchResult({
          tier: prev.tier,
          heroFinalStack: heroStack,
          handsPlayed: newHistory.length,
          bbWon,
          wins,
          losses,
          ranking,
          history: newHistory,
        });

        return {
          ...prev,
          handNumber: newHandNumber,
          players: newPlayers,
          matchHistory: newHistory,
          matchComplete: true,
          currentHand: null,
        };
      }

      // Next hand — rotate button
      const newBtnIndex = (prev.btnIndex + 1) % 6;
      const stacks = new Map<PlayerId, number>();
      newPlayers.forEach(p => stacks.set(p.id, p.stack));

      const newHand = initMPHand(stacks, newBtnIndex);
      const updated: MPMatchState = {
        ...prev,
        handNumber: newHandNumber,
        players: newPlayers,
        btnIndex: newBtnIndex,
        currentHand: newHand,
        matchHistory: newHistory,
      };

      setShowResult(false);

      const nextActor = getNextToAct(newHand);
      if (nextActor && nextActor !== 'hero') {
        setTimeout(() => scheduleBotActions(updated), 500);
      }

      return updated;
    });
  }, [scheduleBotActions]);

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
