import { type GameState, getBotActions } from './game-state';
import { type GameAction } from './pot-manager';
import { getHandNotation } from '@/utils/hand';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from '@/utils/correct-action';
import { evaluateBestHand, HAND_CATEGORY } from './hand-evaluator';
import { RANK_VALUE, type Card } from '@/data/constants';

const PREFLOP_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
const POSTFLOP_ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];

// ── Extended calling ranges (beyond strict training ranges) ──
// Training ranges are GTO-optimal for students — too tight for a realistic bot.
// These "extra" hands only kick in when the training range says fold.

const POCKET_PAIRS = ['AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22'];
const SUITED_CONNECTORS = ['JTs','T9s','98s','87s','76s','65s','54s'];
const SUITED_GAPPERS = ['J9s','T8s','97s','86s','75s'];
const SUITED_ACES = ['A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s'];
const OFFSUIT_BROADWAYS = ['AJo','ATo','KQo','KJo','QJo','JTo'];

const EXTRA_CALL_RANGES: Record<string, string[]> = {
  'BB': [...POCKET_PAIRS, ...SUITED_CONNECTORS, ...SUITED_GAPPERS, ...SUITED_ACES, ...OFFSUIT_BROADWAYS, 'KTo','QTo','K9s','Q9s'],
  'SB': [...POCKET_PAIRS.slice(0, 10), ...SUITED_CONNECTORS.slice(0, 5), ...SUITED_ACES.slice(0, 6), 'KQo','KJo','AJo','ATo'],
  'BTN': [...POCKET_PAIRS, ...SUITED_CONNECTORS, ...SUITED_ACES.slice(0, 6), ...OFFSUIT_BROADWAYS.slice(0, 4)],
  'CO': [...POCKET_PAIRS.slice(0, 10), ...SUITED_CONNECTORS.slice(0, 4), ...SUITED_ACES.slice(0, 4), 'AJo','KQo'],
  'HJ': [...POCKET_PAIRS.slice(0, 8), ...SUITED_CONNECTORS.slice(0, 3), 'AJo','KQo'],
  'UTG': [...POCKET_PAIRS.slice(0, 6), 'AQo','AJs'],
};

const EXTRA_VS3BET: Record<string, string[]> = {
  'BTN': ['TT','99','88','77','AQo','AJs','ATs','KQs','KJs','QJs','JTs'],
  'CO': ['TT','99','88','AQo','AJs','KQs'],
  'HJ': ['TT','99','AQo','KQs'],
  'UTG': ['TT','99','AQo'],
  'SB': ['TT','99','88','77','AQo','AJs','ATs','KQs','KJs','QJs','JTs'],
};

// ── Main entry ──

export function decideBotAction(state: GameState): GameAction {
  const available = getBotActions(state);
  if (available.length === 0) return { type: 'check' };
  if (available.length === 1) return available[0];

  if (state.street === 'preflop') {
    return decidePreflopAction(state, available);
  }
  return decidePostflopAction(state, available);
}

// ── Preflop ──

function decidePreflopAction(state: GameState, available: GameAction[]): GameAction {
  const notation = getHandNotation(state.botHand[0], state.botHand[1]);
  const { heroPosition, botPosition } = state;

  const botIdx = PREFLOP_ORDER.indexOf(botPosition);
  const heroIdx = PREFLOP_ORDER.indexOf(heroPosition);
  const botIsOpener = botIdx < heroIdx;

  const preflopActions = state.actionHistory.filter(a => a.street === 'preflop');
  const heroActions = preflopActions.filter(a => a.actor === 'hero');
  const botActions = preflopActions.filter(a => a.actor === 'bot');

  // Case 1: Bot is opener — use RFI ranges (already reasonable)
  if (botIsOpener && botActions.length === 0) {
    const rfiAction = getCorrectAction_RFI(notation, botPosition);
    if (rfiAction === 'raise') {
      const raiseAction = available.find(a => a.type === 'raise') || available.find(a => a.type === 'bet');
      return raiseAction || findAction(available, 'call', 'check');
    }
    if (rfiAction === 'limp' && botPosition === 'SB') {
      return findAction(available, 'call', 'fold');
    }
    return findAction(available, 'fold', 'check');
  }

  // Case 2: Bot is defender, facing hero's raise
  if (!botIsOpener && botActions.length === 0 && heroActions.length > 0) {
    const lastHeroAction = heroActions[heroActions.length - 1];

    if (lastHeroAction.action.type === 'raise' || lastHeroAction.action.type === 'bet' || lastHeroAction.action.type === 'allin') {
      // Check strict training range first
      const facingAction = getCorrectAction_Facing(notation, botPosition, heroPosition);
      if (facingAction === '3bet') {
        const raiseAction = available.find(a => a.type === 'raise');
        return raiseAction || findAction(available, 'call', 'check');
      }
      if (facingAction === 'call') {
        return findAction(available, 'call', 'check');
      }

      // Training says fold → check extended calling range
      const extraRange = EXTRA_CALL_RANGES[botPosition] || [];
      if (extraRange.includes(notation)) {
        return findAction(available, 'call', 'check');
      }

      return findAction(available, 'fold', 'check');
    }

    // Hero limped
    if (botPosition === 'BB') {
      const raiseHands = ['AA','KK','QQ','JJ','TT','99','AKs','AQs','AJs','ATs','KQs','KJs','AKo','AQo'];
      if (raiseHands.includes(notation) && Math.random() < 0.7) {
        const raiseAction = available.find(a => a.type === 'raise') || available.find(a => a.type === 'bet');
        if (raiseAction) return raiseAction;
      }
      return findAction(available, 'check', 'call');
    }
    return findAction(available, 'check', 'fold');
  }

  // Case 3: Bot opened, facing 3bet
  if (botIsOpener && botActions.length >= 1) {
    const lastHeroAction = heroActions[heroActions.length - 1];
    if (lastHeroAction && (lastHeroAction.action.type === 'raise' || lastHeroAction.action.type === 'allin')) {
      const vs3betAction = getCorrectAction_Vs3bet(notation, botPosition);
      if (vs3betAction === '4bet') {
        const raiseAction = available.find(a => a.type === 'raise');
        return raiseAction || findAction(available, 'allin', 'call');
      }
      if (vs3betAction === 'call') {
        return findAction(available, 'call', 'check');
      }

      // Training says fold → check extended range
      const extra3bet = EXTRA_VS3BET[botPosition] || [];
      if (extra3bet.includes(notation)) {
        return findAction(available, 'call', 'check');
      }

      return findAction(available, 'fold', 'check');
    }
  }

  // Case 4: Bot 3bet, facing 4bet
  if (!botIsOpener && botActions.length >= 1) {
    const lastHeroAction = heroActions[heroActions.length - 1];
    if (lastHeroAction && (lastHeroAction.action.type === 'raise' || lastHeroAction.action.type === 'allin')) {
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

// ── Postflop hand strength (uses proper hand evaluator) ──

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

      if (isPocketPair && pairValue > maxBoardValue) return 62; // overpair
      if (pairValue === maxBoardValue) {
        const kicker = handRank.tiebreakers[1];
        if (kicker >= 12) return 55; // TPTK
        if (kicker >= 10) return 50; // TPGK
        return 45; // TPWK
      }
      const sortedBoard = [...boardValues].sort((a, b) => b - a);
      if (sortedBoard.length >= 2 && pairValue >= sortedBoard[1]) return 35; // middle pair
      if (isPocketPair) return 30; // underpair
      return 25; // bottom pair
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

  // Flush draw: 4 cards of same suit, at least 1 from hole cards
  let flush = false;
  const suitCounts: Record<string, number> = {};
  for (const c of allCards) suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
  for (const suit of Object.keys(suitCounts)) {
    if (suitCounts[suit] === 4 && botHand.some(c => c.suit === suit)) {
      flush = true;
    }
  }

  // Straight draw: 4 of 5 consecutive, at least 1 from hole cards
  let straight = false;
  const allValues = [...new Set(allCards.map(c => RANK_VALUE[c.rank] ?? 0))].sort((a, b) => a - b);
  if (allValues.includes(14)) allValues.unshift(1); // ace-low
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

// ── Postflop decision ──

function decidePostflopAction(state: GameState, available: GameAction[]): GameAction {
  const strength = getPostflopStrength(state.botHand, state.communityCards);
  const draws = state.street !== 'river'
    ? detectDraws(state.botHand, state.communityCards)
    : { flush: false, straight: false };
  const hasDraw = draws.flush || draws.straight;

  const botPosIdx = POSTFLOP_ORDER.indexOf(state.botPosition);
  const heroPosIdx = POSTFLOP_ORDER.indexOf(state.heroPosition);
  const isIP = botPosIdx > heroPosIdx;

  const canBet = available.some(a => a.type === 'bet');
  const facingBet = available.some(a => a.type === 'call');
  const rand = Math.random();

  // Draw equity boost (only below made-hand territory)
  let effective = strength;
  if (hasDraw && strength < 60) {
    effective += draws.flush ? 18 : 0;
    effective += draws.straight ? 12 : 0;
  }

  // ── Monster (80+): sets, straights, flushes, boats, quads ──
  if (strength >= 80) {
    if (facingBet) {
      // Slow-play sometimes with nut hands
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

  // ── Strong (60-79): overpair, top pair top kicker, two pair, trips ──
  if (strength >= 60) {
    if (facingBet) {
      if (rand < 0.3) {
        const raiseAction = available.find(a => a.type === 'raise');
        if (raiseAction) return raiseAction;
      }
      return findAction(available, 'call', 'check');
    }
    if (canBet && rand < 0.80) {
      const betAction = available.find(a => a.type === 'bet' && a.amount! >= Math.round(state.bets.pot * 0.5));
      return betAction || available.find(a => a.type === 'bet') || findAction(available, 'check', 'fold');
    }
    return findAction(available, 'check', 'fold');
  }

  // ── Medium (40-59 effective): mid pairs, TPWK, draws ──
  if (effective >= 40) {
    if (facingBet) {
      if (rand < 0.80) return findAction(available, 'call', 'check');
      return findAction(available, 'fold', 'check');
    }
    const betFreq = isIP ? 0.45 : 0.25;
    if (canBet && rand < betFreq) {
      const bet = available.find(a => a.type === 'bet');
      if (bet) return bet;
    }
    return findAction(available, 'check', 'fold');
  }

  // ── Draws with weak showdown (30-39 effective) ──
  if (hasDraw && effective >= 30) {
    if (facingBet) {
      if (rand < 0.65) return findAction(available, 'call', 'check');
      if (rand < 0.80) {
        const raiseAction = available.find(a => a.type === 'raise');
        if (raiseAction) return raiseAction;
        return findAction(available, 'call', 'fold');
      }
      return findAction(available, 'fold', 'check');
    }
    if (canBet && rand < 0.45) {
      const bet = available.find(a => a.type === 'bet');
      if (bet) return bet;
    }
    return findAction(available, 'check', 'fold');
  }

  // ── Air / weak: bluff sometimes ──
  if (facingBet) {
    const floatFreq = isIP ? 0.20 : 0.10;
    if (rand < floatFreq) return findAction(available, 'call', 'fold');
    return findAction(available, 'fold', 'check');
  }
  const bluffFreq = isIP ? 0.30 : 0.18;
  if (canBet && rand < bluffFreq) {
    const bet = available.find(a => a.type === 'bet');
    if (bet) return bet;
  }
  return findAction(available, 'check', 'fold');
}

function findAction(available: GameAction[], preferred: GameAction['type'], fallback: GameAction['type']): GameAction {
  return available.find(a => a.type === preferred) || available.find(a => a.type === fallback) || available[0];
}
