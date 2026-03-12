import { type MPGameState, getPlayerPosition, getPlayerBet } from './mp-game-state';
import { type PlayerId, getAvailableMPActions } from './mp-pot-manager';
import { type GameAction } from './pot-manager';
import { getHandNotation } from '@/utils/hand';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from '@/utils/correct-action';
import { evaluateBestHand, HAND_CATEGORY } from './hand-evaluator';
import { RANK_VALUE, type Card } from '@/data/constants';

const PREFLOP_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const POSTFLOP_ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];

// Extended calling ranges (same as 2-player bot-ai.ts)
const EXTRA_CALL_RANGES: Record<string, string[]> = {
  'BB': ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22','JTs','T9s','98s','87s','76s','65s','54s','J9s','T8s','97s','86s','75s','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','AJo','ATo','KQo','KJo','QJo','JTo','KTo','QTo','K9s','Q9s'],
  'SB': ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','JTs','T9s','98s','87s','76s','A9s','A8s','A7s','A6s','A5s','A4s','KQo','KJo','AJo','ATo'],
  'BTN': ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22','JTs','T9s','98s','87s','76s','65s','54s','A9s','A8s','A7s','A6s','A5s','A4s','AJo','ATo','KQo','KJo'],
  'CO': ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','JTs','T9s','98s','87s','A9s','A8s','A7s','A6s','AJo','KQo'],
  'HJ': ['AA','KK','QQ','JJ','TT','99','88','77','66','55','JTs','T9s','98s','AJo','KQo'],
  'UTG': ['AA','KK','QQ','JJ','TT','99','AQo','AJs'],
};

const EXTRA_VS3BET: Record<string, string[]> = {
  'BTN': ['TT','99','88','77','AQo','AJs','ATs','KQs','KJs','QJs','JTs'],
  'CO': ['TT','99','88','AQo','AJs','KQs'],
  'HJ': ['TT','99','AQo','KQs'],
  'UTG': ['TT','99','AQo'],
  'SB': ['TT','99','88','77','AQo','AJs','ATs','KQs','KJs','QJs','JTs'],
};

export function decideMPBotAction(state: MPGameState, botId: PlayerId): GameAction {
  const available = getAvailableMPActions(state.bets, botId);
  if (available.length === 0) return { type: 'fold' };
  if (available.length === 1) return available[0];

  if (state.street === 'preflop') {
    return decideMPPreflopAction(state, botId, available);
  }
  return decideMPPostflopAction(state, botId, available);
}

function decideMPPreflopAction(
  state: MPGameState,
  botId: PlayerId,
  available: GameAction[],
): GameAction {
  const botPlayer = state.players.find(p => p.id === botId)!;
  const notation = getHandNotation(botPlayer.hand[0], botPlayer.hand[1]);
  const botPos = botPlayer.position;
  const botPosIdx = PREFLOP_ORDER.indexOf(botPos);

  // Analyze action history
  const preflopActions = state.actionHistory.filter(a => a.street === 'preflop');
  const myActions = preflopActions.filter(a => a.playerId === botId);

  // Find the first raiser before us
  const raiseBefore = preflopActions.find(a =>
    a.playerId !== botId &&
    (a.action.type === 'raise' || a.action.type === 'bet' || a.action.type === 'allin')
  );

  // Count active players
  const activePlayers = state.bets.players.filter(p => !p.folded && !p.isAllIn).length;

  // Has anyone raised before us?
  const facingRaise = raiseBefore !== null && raiseBefore !== undefined;

  // Case 1: No raise yet, we are the opener
  if (!facingRaise && myActions.length === 0) {
    const rfiAction = getCorrectAction_RFI(notation, botPos);
    if (rfiAction === 'raise') {
      const raiseAction = available.find(a => a.type === 'raise') || available.find(a => a.type === 'bet');
      return raiseAction || findAction(available, 'call', 'check');
    }
    if (rfiAction === 'limp' && botPos === 'SB') {
      return findAction(available, 'call', 'fold');
    }
    return findAction(available, 'fold', 'check');
  }

  // Case 2: Facing a raise, we haven't acted yet (defender)
  if (facingRaise && myActions.length === 0) {
    const raiserPos = state.players.find(p => p.id === raiseBefore.playerId)?.position ?? 'UTG';

    // Check strict training range
    const facingAction = getCorrectAction_Facing(notation, botPos, raiserPos);
    if (facingAction === '3bet') {
      // In multiway, tighten 3bet range slightly
      if (activePlayers > 3 && Math.random() < 0.3) {
        return findAction(available, 'call', 'check');
      }
      const raiseAction = available.find(a => a.type === 'raise');
      return raiseAction || findAction(available, 'call', 'check');
    }
    if (facingAction === 'call') {
      return findAction(available, 'call', 'check');
    }

    // Training says fold → check extended calling range
    // In multiway, slightly tighter (need stronger hand)
    const extraRange = EXTRA_CALL_RANGES[botPos] || [];
    if (extraRange.includes(notation)) {
      // Multiway tightening: fold more of the extended range
      const foldProb = activePlayers > 3 ? 0.4 : activePlayers > 2 ? 0.2 : 0;
      if (Math.random() > foldProb) {
        return findAction(available, 'call', 'check');
      }
    }

    return findAction(available, 'fold', 'check');
  }

  // Case 3: We already raised, now facing a 3bet
  if (myActions.length >= 1) {
    const lastRaiseAgainstUs = preflopActions
      .filter(a => a.playerId !== botId && (a.action.type === 'raise' || a.action.type === 'allin'))
      .pop();

    if (lastRaiseAgainstUs) {
      // My first action was a raise, now facing 3bet
      if (myActions.length === 1 && myActions[0].action.type !== 'fold') {
        const vs3betAction = getCorrectAction_Vs3bet(notation, botPos);
        if (vs3betAction === '4bet') {
          const raiseAction = available.find(a => a.type === 'raise');
          return raiseAction || findAction(available, 'allin', 'call');
        }
        if (vs3betAction === 'call') {
          return findAction(available, 'call', 'check');
        }

        const extra3bet = EXTRA_VS3BET[botPos] || [];
        if (extra3bet.includes(notation)) {
          return findAction(available, 'call', 'check');
        }

        return findAction(available, 'fold', 'check');
      }

      // Facing 4bet+ (very strong range only)
      const premium = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'];
      if (premium.includes(notation)) {
        return findAction(available, 'allin', 'call');
      }
      const medium = ['TT', '99', 'AQs', 'AJs', 'AQo', 'KQs'];
      if (medium.includes(notation)) {
        return findAction(available, 'call', 'fold');
      }
      return findAction(available, 'fold', 'check');
    }
  }

  return findAction(available, 'check', 'fold');
}

// Postflop hand strength evaluation (same logic as bot-ai.ts)
function getPostflopStrength(botHand: Card[], communityCards: Card[]): number {
  const handRank = evaluateBestHand([...botHand, ...communityCards]);

  switch (handRank.category) {
    case HAND_CATEGORY.ROYAL_FLUSH: return 99;
    case HAND_CATEGORY.STRAIGHT_FLUSH: return 97;
    case HAND_CATEGORY.FOUR_OF_A_KIND: return 95;
    case HAND_CATEGORY.FULL_HOUSE: return 90;
    case HAND_CATEGORY.FLUSH: return 85;
    case HAND_CATEGORY.STRAIGHT: return 80;
    case HAND_CATEGORY.THREE_OF_A_KIND: return 75;
    case HAND_CATEGORY.TWO_PAIR: return 65;
    case HAND_CATEGORY.ONE_PAIR: {
      const pairValue = handRank.tiebreakers[0];
      const boardValues = communityCards.map(c => RANK_VALUE[c.rank] ?? 0);
      const maxBoardValue = Math.max(...boardValues);
      const hv0 = RANK_VALUE[botHand[0].rank] ?? 0;
      const hv1 = RANK_VALUE[botHand[1].rank] ?? 0;
      const isPocketPair = hv0 === hv1;

      if (isPocketPair && pairValue > maxBoardValue) return 62;
      if (pairValue === maxBoardValue) {
        const kicker = handRank.tiebreakers[1];
        if (kicker >= 12) return 55;
        if (kicker >= 10) return 50;
        return 45;
      }
      const sortedBoard = [...boardValues].sort((a, b) => b - a);
      if (sortedBoard.length >= 2 && pairValue >= sortedBoard[1]) return 35;
      if (isPocketPair) return 30;
      return 25;
    }
    case HAND_CATEGORY.HIGH_CARD: {
      const hv0 = RANK_VALUE[botHand[0].rank] ?? 0;
      const hv1 = RANK_VALUE[botHand[1].rank] ?? 0;
      const boardValues = communityCards.map(c => RANK_VALUE[c.rank] ?? 0);
      const maxBoard = Math.max(...boardValues);
      const overcards = [hv0, hv1].filter(v => v > maxBoard).length;
      if (overcards === 2) return 20;
      if (overcards === 1 && Math.max(hv0, hv1) >= 12) return 15;
      return 8;
    }
    default: return 0;
  }
}

function detectDraws(botHand: Card[], communityCards: Card[]): { flush: boolean; straight: boolean } {
  const allCards = [...botHand, ...communityCards];

  let flush = false;
  const suitCounts: Record<string, number> = {};
  for (const c of allCards) suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  for (const suit of Object.keys(suitCounts)) {
    if (suitCounts[suit] === 4 && botHand.some(c => c.suit === suit)) {
      flush = true;
    }
  }

  let straight = false;
  const allValues = [...new Set(allCards.map(c => RANK_VALUE[c.rank] ?? 0))].sort((a, b) => a - b);
  if (allValues.includes(14)) allValues.unshift(1);
  const holeValues = botHand.map(c => RANK_VALUE[c.rank] ?? 0);
  if (holeValues.includes(14)) holeValues.push(1);

  for (let start = 1; start <= 10; start++) {
    const window = [start, start + 1, start + 2, start + 3, start + 4];
    if (window.filter(v => allValues.includes(v)).length === 4) {
      if (window.some(v => holeValues.includes(v))) {
        straight = true;
        break;
      }
    }
  }

  return { flush, straight };
}

function decideMPPostflopAction(
  state: MPGameState,
  botId: PlayerId,
  available: GameAction[],
): GameAction {
  const botPlayer = state.players.find(p => p.id === botId)!;
  const strength = getPostflopStrength(botPlayer.hand, state.communityCards);
  const draws = state.street !== 'river'
    ? detectDraws(botPlayer.hand, state.communityCards)
    : { flush: false, straight: false };
  const hasDraw = draws.flush || draws.straight;

  // IP/OOP determination
  const botPosIdx = POSTFLOP_ORDER.indexOf(botPlayer.position);
  const activePlayers = state.bets.players.filter(p => !p.folded && !p.isAllIn);
  const playersAfterMe = activePlayers.filter(p => {
    const pos = state.players.find(pl => pl.id === p.id)?.position ?? '';
    return POSTFLOP_ORDER.indexOf(pos) > botPosIdx;
  });
  const isIP = playersAfterMe.length === 0;

  // Multiway adjustment: more players = tighter play
  const numActive = activePlayers.length;
  const multiwayFactor = numActive > 2 ? 0.7 : 1.0; // reduce aggression in multiway

  const canBet = available.some(a => a.type === 'bet');
  const facingBet = available.some(a => a.type === 'call');
  const rand = Math.random();

  let effective = strength;
  if (hasDraw && strength < 60) {
    effective += draws.flush ? 18 : 0;
    effective += draws.straight ? 12 : 0;
  }

  // Monster (80+)
  if (strength >= 80) {
    if (facingBet) {
      if (strength >= 90 && rand < 0.25) return findAction(available, 'call', 'check');
      const raiseAction = available.find(a => a.type === 'raise');
      if (raiseAction) return raiseAction;
      return findAction(available, 'call', 'check');
    }
    if (canBet) {
      const bigBet = available.find(a => a.type === 'bet' && a.amount! >= Math.round(state.bets.pot * 0.6));
      return bigBet || available.find(a => a.type === 'bet') || findAction(available, 'check', 'fold');
    }
    return findAction(available, 'check', 'fold');
  }

  // Strong (60-79)
  if (strength >= 60) {
    if (facingBet) {
      if (rand < 0.3 * multiwayFactor) {
        const raiseAction = available.find(a => a.type === 'raise');
        if (raiseAction) return raiseAction;
      }
      return findAction(available, 'call', 'check');
    }
    if (canBet && rand < 0.80 * multiwayFactor) {
      const betAction = available.find(a => a.type === 'bet' && a.amount! >= Math.round(state.bets.pot * 0.5));
      return betAction || available.find(a => a.type === 'bet') || findAction(available, 'check', 'fold');
    }
    return findAction(available, 'check', 'fold');
  }

  // Medium (40-59 effective)
  if (effective >= 40) {
    if (facingBet) {
      if (rand < 0.80 * multiwayFactor) return findAction(available, 'call', 'check');
      return findAction(available, 'fold', 'check');
    }
    const betFreq = (isIP ? 0.45 : 0.25) * multiwayFactor;
    if (canBet && rand < betFreq) {
      const bet = available.find(a => a.type === 'bet');
      if (bet) return bet;
    }
    return findAction(available, 'check', 'fold');
  }

  // Draws (30-39 effective)
  if (hasDraw && effective >= 30) {
    if (facingBet) {
      if (rand < 0.65 * multiwayFactor) return findAction(available, 'call', 'check');
      if (rand < 0.80 * multiwayFactor) {
        const raiseAction = available.find(a => a.type === 'raise');
        if (raiseAction) return raiseAction;
        return findAction(available, 'call', 'fold');
      }
      return findAction(available, 'fold', 'check');
    }
    if (canBet && rand < 0.45 * multiwayFactor) {
      const bet = available.find(a => a.type === 'bet');
      if (bet) return bet;
    }
    return findAction(available, 'check', 'fold');
  }

  // Air/weak — bluff less in multiway
  if (facingBet) {
    const floatFreq = (isIP ? 0.20 : 0.10) * multiwayFactor;
    if (rand < floatFreq) return findAction(available, 'call', 'fold');
    return findAction(available, 'fold', 'check');
  }
  const bluffFreq = (isIP ? 0.30 : 0.18) * multiwayFactor;
  if (canBet && rand < bluffFreq) {
    const bet = available.find(a => a.type === 'bet');
    if (bet) return bet;
  }
  return findAction(available, 'check', 'fold');
}

function findAction(available: GameAction[], preferred: GameAction['type'], fallback: GameAction['type']): GameAction {
  return available.find(a => a.type === preferred) || available.find(a => a.type === fallback) || available[0];
}
