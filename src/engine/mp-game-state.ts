import { type Card } from '@/data/constants';
import { Deck } from './deck';
import { type GameAction } from './pot-manager';
import { evaluateBestHand, compareHandRanks, type HandRank } from './hand-evaluator';
import {
  type PlayerId,
  type MPBetState,
  type SidePot,
  ALL_PLAYER_IDS,
  initMPBets,
  applyMPBetAction,
  startMPNewStreet,
  getAvailableMPActions,
  calculateSidePots,
} from './mp-pot-manager';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type PlayerState = {
  id: PlayerId;
  position: string;
  hand: Card[];
};

export type MPActionRecord = {
  street: Street;
  playerId: PlayerId;
  action: GameAction;
};

export type PotResult = {
  amount: number;
  winners: PlayerId[];
  split: boolean;
};

export type MPGameResult = {
  pots: PotResult[];
  showdownHands: { playerId: PlayerId; hand: Card[]; rank: HandRank }[];
  wonByFold?: PlayerId;
};

export type MPGameState = {
  street: Street;
  deck: Deck;
  players: PlayerState[];
  communityCards: Card[];
  bets: MPBetState;
  actionHistory: MPActionRecord[];
  result: MPGameResult | null;
  activePlayerIdx: number;
  lastRaiserIdx: number | null;
  roundStartIdx: number; // who started the current betting round
  actedThisRound: Set<PlayerId>; // players who have acted since last raise/start
};

// Preflop: UTG acts first, BB acts last
const PREFLOP_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
// Postflop: SB (OOP) acts first, BTN (IP) acts last
const POSTFLOP_ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];

const SIX_MAX_POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

function getPositionOrder(street: Street): string[] {
  return street === 'preflop' ? PREFLOP_ORDER : POSTFLOP_ORDER;
}

export function initMPHand(
  playerStacks: Map<PlayerId, number>,
  btnIndex: number,
): MPGameState {
  const deck = new Deck();

  // Assign positions based on btnIndex
  // btnIndex determines which player is BTN, then clockwise: SB, BB, UTG, HJ, CO
  const positionAssignment = new Map<PlayerId, string>();
  const playerIds = ALL_PLAYER_IDS;
  // Position order clockwise from BTN: BTN, SB, BB, UTG, HJ, CO
  const positionsFromBtn = ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'];

  for (let i = 0; i < 6; i++) {
    const playerIdx = (btnIndex + i) % 6;
    positionAssignment.set(playerIds[playerIdx], positionsFromBtn[i]);
  }

  // Deal hands
  const players: PlayerState[] = playerIds.map(id => ({
    id,
    position: positionAssignment.get(id)!,
    hand: deck.deal(2),
  }));

  // Init bets (SB and BB posting)
  const bets = initMPBets(playerStacks, positionAssignment);

  // Find first to act preflop (UTG)
  const firstToActPos = PREFLOP_ORDER[0]; // UTG
  const firstToActIdx = players.findIndex(p => p.position === firstToActPos);

  return {
    street: 'preflop',
    deck,
    players,
    communityCards: [],
    bets,
    actionHistory: [],
    result: null,
    activePlayerIdx: firstToActIdx,
    lastRaiserIdx: null,
    roundStartIdx: firstToActIdx,
    actedThisRound: new Set(),
  };
}

function getActivePlayers(state: MPGameState): PlayerState[] {
  return state.players.filter(p => {
    const bet = state.bets.players.find(b => b.id === p.id)!;
    return !bet.folded && !bet.isAllIn;
  });
}

function getNonFoldedPlayers(state: MPGameState): PlayerState[] {
  return state.players.filter(p => {
    const bet = state.bets.players.find(b => b.id === p.id)!;
    return !bet.folded;
  });
}

// Find next player to act in position order, skipping folded/allin
function findNextActiveIdx(state: MPGameState, fromIdx: number): number | null {
  const order = getPositionOrder(state.street);

  // Sort players by position order
  const sortedByPos = state.players
    .map((p, idx) => ({ ...p, idx, posOrder: order.indexOf(p.position) }))
    .sort((a, b) => a.posOrder - b.posOrder);

  // Find current player's position order
  const currentPosOrder = order.indexOf(state.players[fromIdx].position);

  // Look for next active player after current position
  for (const entry of sortedByPos) {
    if (entry.posOrder <= currentPosOrder) continue;
    const bet = state.bets.players.find(b => b.id === entry.id)!;
    if (!bet.folded && !bet.isAllIn) return entry.idx;
  }

  // Wrap around
  for (const entry of sortedByPos) {
    if (entry.posOrder >= currentPosOrder) break;
    const bet = state.bets.players.find(b => b.id === entry.id)!;
    if (!bet.folded && !bet.isAllIn) return entry.idx;
  }

  return null;
}

export function getNextToAct(state: MPGameState): PlayerId | null {
  if (state.result) return null;

  const nonFolded = getNonFoldedPlayers(state);
  if (nonFolded.length <= 1) return null;

  const active = getActivePlayers(state);
  if (active.length === 0) return null; // everyone all-in or folded

  // Check if betting round is complete
  // All active players must have acted and matched the current bet
  const allMatched = active.every(p => {
    const bet = state.bets.players.find(b => b.id === p.id)!;
    return state.actedThisRound.has(p.id) && bet.streetBet >= state.bets.currentBet;
  });

  if (allMatched) return null; // street done

  // Find the current active player
  const currentPlayer = state.players[state.activePlayerIdx];
  const currentBet = state.bets.players.find(b => b.id === currentPlayer.id)!;

  if (!currentBet.folded && !currentBet.isAllIn) {
    return currentPlayer.id;
  }

  // Current player is inactive, find next
  const nextIdx = findNextActiveIdx(state, state.activePlayerIdx);
  if (nextIdx === null) return null;
  return state.players[nextIdx].id;
}

function advanceStreet(state: MPGameState): MPGameState {
  const s: MPGameState = {
    ...state,
    bets: startMPNewStreet(state.bets),
    lastRaiserIdx: null,
    actedThisRound: new Set(),
  };

  switch (s.street) {
    case 'preflop':
      s.street = 'flop';
      s.communityCards = [...s.communityCards, ...s.deck.burnAndDeal(3)];
      break;
    case 'flop':
      s.street = 'turn';
      s.communityCards = [...s.communityCards, ...s.deck.burnAndDeal(1)];
      break;
    case 'turn':
      s.street = 'river';
      s.communityCards = [...s.communityCards, ...s.deck.burnAndDeal(1)];
      break;
    case 'river':
      s.street = 'showdown';
      break;
  }

  // Find first to act postflop
  if (s.street !== 'showdown') {
    const order = getPositionOrder(s.street);
    const sortedByPos = s.players
      .map((p, idx) => ({ ...p, idx, posOrder: order.indexOf(p.position) }))
      .sort((a, b) => a.posOrder - b.posOrder);

    let firstIdx: number | null = null;
    for (const entry of sortedByPos) {
      const bet = s.bets.players.find(b => b.id === entry.id)!;
      if (!bet.folded && !bet.isAllIn) {
        firstIdx = entry.idx;
        break;
      }
    }

    if (firstIdx !== null) {
      s.activePlayerIdx = firstIdx;
      s.roundStartIdx = firstIdx;
    }
  }

  return s;
}

function dealRemainingCards(state: MPGameState): MPGameState {
  const s = { ...state };
  const needed = 5 - s.communityCards.length;
  if (needed > 0) {
    for (let i = 0; i < needed; i++) {
      s.communityCards = [...s.communityCards, ...s.deck.burnAndDeal(1)];
    }
  }
  return s;
}

function resolveMPShowdown(state: MPGameState): MPGameState {
  const nonFolded = getNonFoldedPlayers(state);

  // Evaluate all hands
  const showdownHands = nonFolded.map(p => ({
    playerId: p.id,
    hand: p.hand,
    rank: evaluateBestHand([...p.hand, ...state.communityCards]),
  }));

  // Check if there are side pots (any all-in players)
  const hasAllIn = state.bets.players.some(p => p.isAllIn && !p.folded);

  let pots: PotResult[];

  if (hasAllIn) {
    // Calculate side pots
    const sidePots = calculateSidePots(state.bets);

    if (sidePots.length === 0) {
      // Fallback: single pot
      pots = [resolveOnePot(state.bets.pot, nonFolded.map(p => p.id), showdownHands)];
    } else {
      pots = sidePots.map(sp =>
        resolveOnePot(sp.amount, sp.eligible, showdownHands)
      );
    }
  } else {
    // Single pot — all non-folded players
    pots = [resolveOnePot(state.bets.pot, nonFolded.map(p => p.id), showdownHands)];
  }

  return {
    ...state,
    street: 'showdown',
    result: { pots, showdownHands },
  };
}

function resolveOnePot(
  amount: number,
  eligible: PlayerId[],
  showdownHands: { playerId: PlayerId; hand: Card[]; rank: HandRank }[],
): PotResult {
  const candidates = showdownHands.filter(h => eligible.includes(h.playerId));
  if (candidates.length === 0) return { amount, winners: [], split: false };
  if (candidates.length === 1) return { amount, winners: [candidates[0].playerId], split: false };

  // Find best hand(s)
  let best = candidates[0];
  const winners: PlayerId[] = [best.playerId];

  for (let i = 1; i < candidates.length; i++) {
    const cmp = compareHandRanks(candidates[i].rank, best.rank);
    if (cmp > 0) {
      best = candidates[i];
      winners.length = 0;
      winners.push(best.playerId);
    } else if (cmp === 0) {
      winners.push(candidates[i].playerId);
    }
  }

  return { amount, winners, split: winners.length > 1 };
}

export function applyMPAction(
  state: MPGameState,
  playerId: PlayerId,
  action: GameAction,
): MPGameState {
  if (state.result) return state;

  let s: MPGameState = {
    ...state,
    bets: applyMPBetAction(state.bets, playerId, action),
    actionHistory: [...state.actionHistory, { street: state.street, playerId, action }],
    actedThisRound: new Set(state.actedThisRound),
  };

  s.actedThisRound.add(playerId);

  // Fold
  if (action.type === 'fold') {
    const nonFolded = getNonFoldedPlayers(s);
    if (nonFolded.length === 1) {
      // Only one player left — they win
      return {
        ...s,
        result: {
          pots: [{ amount: s.bets.pot, winners: [nonFolded[0].id], split: false }],
          showdownHands: [],
          wonByFold: nonFolded[0].id,
        },
      };
    }
  }

  // Raise/bet resets the round — everyone else needs to act again
  if (action.type === 'raise' || action.type === 'bet' || action.type === 'allin') {
    const playerBet = s.bets.players.find(b => b.id === playerId)!;
    if (playerBet.streetBet >= s.bets.currentBet) {
      // This was an actual raise (not a short all-in)
      const playerIdx = s.players.findIndex(p => p.id === playerId);
      s.lastRaiserIdx = playerIdx;
      s.actedThisRound = new Set([playerId]);
    }
  }

  // Advance to next player
  const currentIdx = s.players.findIndex(p => p.id === playerId);
  const nextIdx = findNextActiveIdx(s, currentIdx);

  if (nextIdx !== null) {
    s.activePlayerIdx = nextIdx;
  }

  // Check if all active players have acted and matched
  const active = getActivePlayers(s);
  const nonFolded = getNonFoldedPlayers(s);

  // Everyone all-in or folded except maybe one
  if (active.length <= 1 && nonFolded.length >= 2) {
    // Run out remaining community cards
    s = dealRemainingCards(s);
    return resolveMPShowdown(s);
  }

  if (active.length === 0 && nonFolded.length <= 1) {
    // Only one non-folded (shouldn't normally reach here, handled by fold above)
    if (nonFolded.length === 1) {
      return {
        ...s,
        result: {
          pots: [{ amount: s.bets.pot, winners: [nonFolded[0].id], split: false }],
          showdownHands: [],
          wonByFold: nonFolded[0].id,
        },
      };
    }
  }

  // Check if street is complete
  const nextToAct = getNextToAct(s);
  if (nextToAct === null && !s.result) {
    if (nonFolded.length <= 1) {
      const winner = nonFolded[0]?.id;
      if (winner) {
        return {
          ...s,
          result: {
            pots: [{ amount: s.bets.pot, winners: [winner], split: false }],
            showdownHands: [],
            wonByFold: winner,
          },
        };
      }
    }

    if (s.street === 'river') {
      return resolveMPShowdown(s);
    }

    s = advanceStreet(s);

    // After advancing, if all remaining are all-in, run out
    const newActive = getActivePlayers(s);
    const newNonFolded = getNonFoldedPlayers(s);
    if (newActive.length <= 1 && newNonFolded.length >= 2) {
      s = dealRemainingCards(s);
      return resolveMPShowdown(s);
    }
  }

  return s;
}

export function getHeroMPActions(state: MPGameState): GameAction[] {
  return getAvailableMPActions(state.bets, 'hero');
}

export function getPlayerPosition(state: MPGameState, playerId: PlayerId): string {
  return state.players.find(p => p.id === playerId)?.position ?? '';
}

export function getPlayerBet(state: MPGameState, playerId: PlayerId) {
  return state.bets.players.find(b => b.id === playerId);
}
