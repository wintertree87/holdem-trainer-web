'use client';

import { useState, useCallback, useRef } from 'react';
import { getPracticeGameConfig, type PracticeGameConfig } from '@/data/practice-game-config';
import { POSITION_MATCHUPS, STARTING_STACK } from '@/data/game-config';
import { type GameState, type GameResult, type ActionRecord, initHand, applyGameAction, getNextToAct } from '@/engine/game-state';
import { type GameAction } from '@/engine/pot-manager';
import { type Card } from '@/data/constants';
import { decideBotAction } from '@/engine/bot-ai';
import { getHandNotation } from '@/utils/hand';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from '@/utils/correct-action';

export type PracticeHandRecord = {
  number: number;
  heroHand: Card[];
  botHand: Card[];
  communityCards: Card[];
  heroPosition: string;
  botPosition: string;
  actionHistory: ActionRecord[];
  result: GameResult | null;
  heroStackChange: number;
  coachComment: string;
};

export type PracticeMatchState = {
  config: PracticeGameConfig;
  handNumber: number;            // 1-based
  heroStack: number;
  botStack: number;
  currentHand: GameState | null;
  heroPosition: string;
  botPosition: string;
};

export type PracticeMatchResult = {
  unitId: number;
  hands: PracticeHandRecord[];
  totalStackChange: number;
};

function pickPositionForUnit(config: PracticeGameConfig): { heroPosition: string; botPosition: string } {
  const heroPos = config.heroPositions[Math.floor(Math.random() * config.heroPositions.length)];

  // Find a valid opponent position from POSITION_MATCHUPS
  const validMatchups = POSITION_MATCHUPS.filter(
    ([a, b]) => a === heroPos || b === heroPos
  );

  if (validMatchups.length === 0) {
    // Fallback
    return { heroPosition: heroPos, botPosition: heroPos === 'BB' ? 'BTN' : 'BB' };
  }

  const matchup = validMatchups[Math.floor(Math.random() * validMatchups.length)];
  const botPos = matchup[0] === heroPos ? matchup[1] : matchup[0];

  return { heroPosition: heroPos, botPosition: botPos };
}

function generateCoachComment(
  heroHand: Card[],
  heroPos: string,
  botPos: string,
  actionHistory: ActionRecord[],
  result: GameResult | null,
  heroStackChange: number,
): string {
  const notation = getHandNotation(heroHand[0], heroHand[1]);
  const heroActions = actionHistory.filter(a => a.actor === 'hero');
  const firstHeroAction = heroActions[0];

  if (!firstHeroAction) {
    return `${notation} — 액션 없이 핸드가 끝났어요.`;
  }

  // Check what the optimal preflop action would have been
  const heroIsOpener = actionHistory.findIndex(a => a.actor === 'hero') < actionHistory.findIndex(a => a.actor === 'bot') ||
    actionHistory.filter(a => a.actor === 'bot').length === 0;

  let optimalAction = '';
  let scenarioDesc = '';

  if (heroIsOpener || firstHeroAction.action.type === 'bet' || firstHeroAction.action.type === 'raise') {
    // Hero is in RFI position
    optimalAction = getCorrectAction_RFI(notation, heroPos);
    scenarioDesc = `${heroPos}에서 ${notation}`;
  } else {
    // Hero is facing an open
    const botOpenedPreflop = actionHistory.some(a => a.actor === 'bot' && a.street === 'preflop' && (a.action.type === 'raise' || a.action.type === 'bet'));

    if (botOpenedPreflop) {
      // Check if hero already opened and this is vs 3bet
      const heroOpenedFirst = actionHistory.findIndex(a => a.actor === 'hero' && a.street === 'preflop' && (a.action.type === 'raise' || a.action.type === 'bet'));
      const botRaisedAfter = actionHistory.findIndex(a => a.actor === 'bot' && a.street === 'preflop' && a.action.type === 'raise');

      if (heroOpenedFirst >= 0 && botRaisedAfter > heroOpenedFirst) {
        optimalAction = getCorrectAction_Vs3bet(notation, heroPos);
        scenarioDesc = `${heroPos}에서 오픈 후 3bet 받은 ${notation}`;
      } else {
        optimalAction = getCorrectAction_Facing(notation, heroPos, botPos);
        scenarioDesc = `${botPos} 오픈에 ${heroPos}에서 ${notation}`;
      }
    } else {
      optimalAction = getCorrectAction_RFI(notation, heroPos);
      scenarioDesc = `${heroPos}에서 ${notation}`;
    }
  }

  // Map hero's actual first preflop action
  let heroActualAction = '';
  const firstPreflopAction = heroActions.find(a => a.street === 'preflop');
  if (firstPreflopAction) {
    const t = firstPreflopAction.action.type;
    if (t === 'fold') heroActualAction = 'fold';
    else if (t === 'check') heroActualAction = 'check';
    else if (t === 'call') heroActualAction = 'call';
    else if (t === 'raise' || t === 'bet') heroActualAction = 'raise';
    else if (t === 'allin') heroActualAction = 'raise';
  }

  // Normalize for comparison
  const normalizedOptimal = optimalAction === '3bet' || optimalAction === '4bet' ? 'raise' : optimalAction;
  const optimalLabel = optimalAction === 'raise' ? '레이즈' : optimalAction === '3bet' ? '3벳' : optimalAction === '4bet' ? '4벳' : optimalAction === 'call' ? '콜' : optimalAction === 'fold' ? '폴드' : optimalAction === 'limp' ? '림프' : optimalAction;

  const wasCorrect = heroActualAction === normalizedOptimal;
  const resultText = heroStackChange > 0 ? `+${heroStackChange.toFixed(1)}BB` : heroStackChange < 0 ? `${heroStackChange.toFixed(1)}BB` : '±0BB';

  if (wasCorrect) {
    if (heroStackChange > 0) {
      return `${scenarioDesc}\n정석은 ${optimalLabel} → 정확하게 플레이했어요! ${resultText} 이득.`;
    } else if (heroStackChange < 0) {
      return `${scenarioDesc}\n정석대로 ${optimalLabel}했지만 이번엔 아쉬운 결과. ${resultText}. 장기적으로는 이득이에요!`;
    }
    return `${scenarioDesc}\n정석대로 ${optimalLabel}! 잘 했어요.`;
  } else {
    if (heroActualAction === 'fold' && normalizedOptimal !== 'fold') {
      return `${scenarioDesc}\n폴드했지만, 여기서는 ${optimalLabel}가 정석이에요. 이 핸드는 충분히 플레이할 수 있어요!`;
    }
    if (normalizedOptimal === 'fold' && heroActualAction !== 'fold') {
      return `${scenarioDesc}\n여기서는 폴드가 정석이에요. 이 핸드로 계속하면 장기적으로 손해입니다. ${resultText}`;
    }
    return `${scenarioDesc}\n${optimalLabel}가 더 나았을 거예요. 다음엔 한번 시도해보세요! ${resultText}`;
  }
}

export function usePracticeGame() {
  const [match, setMatch] = useState<PracticeMatchState | null>(null);
  const [matchResult, setMatchResult] = useState<PracticeMatchResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completedHands, setCompletedHands] = useState<PracticeHandRecord[]>([]);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPracticeMatch = useCallback((unitId: number) => {
    const config = getPracticeGameConfig(unitId);
    if (!config) return;

    const { heroPosition, botPosition } = pickPositionForUnit(config);
    const hand = initHand(STARTING_STACK, STARTING_STACK, heroPosition, botPosition);

    const newMatch: PracticeMatchState = {
      config,
      handNumber: 1,
      heroStack: STARTING_STACK,
      botStack: STARTING_STACK,
      currentHand: hand,
      heroPosition,
      botPosition,
    };

    setMatch(newMatch);
    setMatchResult(null);
    setShowResult(false);
    setCompletedHands([]);

    const nextActor = getNextToAct(hand);
    if (nextActor === 'bot') {
      scheduleBotAction(newMatch);
    }
  }, []);

  const scheduleBotAction = useCallback((currentMatch: PracticeMatchState) => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    botTimerRef.current = setTimeout(() => {
      setMatch(prev => {
        if (!prev || !prev.currentHand) return prev;
        const hand = prev.currentHand;
        const nextActor = getNextToAct(hand);
        if (nextActor !== 'bot') return prev;

        const botAction = decideBotAction(hand);
        const newHand = applyGameAction(hand, 'bot', botAction);

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

      const newHand = applyGameAction(hand, 'hero', action);
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
          newHeroStack = handBets.heroStack + handBets.pot / 2;
          newBotStack = handBets.botStack + handBets.pot / 2;
        }
      } else {
        newHeroStack = prev.heroStack;
        newBotStack = prev.botStack;
      }

      const heroStackChange = newHeroStack - prev.heroStack;

      const record: PracticeHandRecord = {
        number: prev.handNumber,
        heroHand: [...prev.currentHand.heroHand],
        botHand: [...prev.currentHand.botHand],
        communityCards: [...prev.currentHand.communityCards],
        heroPosition: prev.heroPosition,
        botPosition: prev.botPosition,
        actionHistory: [...prev.currentHand.actionHistory],
        result,
        heroStackChange,
        coachComment: generateCoachComment(
          prev.currentHand.heroHand,
          prev.heroPosition,
          prev.botPosition,
          prev.currentHand.actionHistory,
          result,
          heroStackChange,
        ),
      };

      const newHands = [...completedHands, record];
      setCompletedHands(newHands);
      setShowResult(false);

      // Check if practice match is complete
      if (prev.handNumber >= prev.config.handsCount) {
        const totalStackChange = newHands.reduce((sum, h) => sum + h.heroStackChange, 0);
        setMatchResult({
          unitId: prev.config.unitId,
          hands: newHands,
          totalStackChange,
        });
        return null;
      }

      // Next hand with new position
      const { heroPosition, botPosition } = pickPositionForUnit(prev.config);
      const nextHandState = initHand(newHeroStack, newBotStack, heroPosition, botPosition);

      const updated: PracticeMatchState = {
        ...prev,
        handNumber: prev.handNumber + 1,
        heroStack: newHeroStack,
        botStack: newBotStack,
        currentHand: nextHandState,
        heroPosition,
        botPosition,
      };

      const nextActor = getNextToAct(nextHandState);
      if (nextActor === 'bot') {
        setTimeout(() => scheduleBotAction(updated), 100);
      }

      return updated;
    });
  }, [completedHands, scheduleBotAction]);

  const endPractice = useCallback(() => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    setMatch(null);
    setMatchResult(null);
    setShowResult(false);
    setCompletedHands([]);
  }, []);

  return {
    match,
    matchResult,
    showResult,
    startPracticeMatch,
    handleHeroAction,
    handleShowResult,
    nextHand,
    endPractice,
  };
}
