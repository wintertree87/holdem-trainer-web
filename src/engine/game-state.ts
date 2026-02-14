import { type Card } from '@/data/constants';
import { Deck } from './deck';
import {
  type BetState,
  type GameAction,
  initBetStateForPositions,
  applyAction,
  startNewStreet,
  getAvailableActions,
} from './pot-manager';
import { evaluateBestHand, compareHandRanks, type HandRank } from './hand-evaluator';

export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export type ActionRecord = {
  street: Street;
  actor: 'hero' | 'bot';
  action: GameAction;
};

export type GameResult = {
  winner: 'hero' | 'bot' | 'tie';
  heroHand?: HandRank;
  botHand?: HandRank;
  potWon: number;
  wonByFold: boolean;
};

export type GameState = {
  street: Street;
  deck: Deck;
  heroHand: Card[];
  botHand: Card[];
  communityCards: Card[];
  bets: BetState;
  heroPosition: string;
  botPosition: string;
  actionHistory: ActionRecord[];
  result: GameResult | null;
  streetActionCount: number;
  lastActor: 'hero' | 'bot' | null;
};

// Preflop: UTG acts first, BB acts last
const PREFLOP_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
// Postflop: SB (OOP) acts first, BTN (IP) acts last
const POSTFLOP_ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];

export function initHand(
  heroStack: number,
  botStack: number,
  heroPosition: string,
  botPosition: string
): GameState {
  const deck = new Deck();
  const heroHand = deck.deal(2);
  const botHand = deck.deal(2);
  const bets = initBetStateForPositions(heroStack, botStack, heroPosition, botPosition);

  return {
    street: 'preflop',
    deck,
    heroHand,
    botHand,
    communityCards: [],
    bets,
    heroPosition,
    botPosition,
    actionHistory: [],
    result: null,
    streetActionCount: 0,
    lastActor: null,
  };
}

export function getNextToAct(state: GameState): 'hero' | 'bot' | null {
  if (state.result) return null;

  // Both all-in
  if (state.bets.heroStack <= 0 && state.bets.botStack <= 0) return null;

  const { street, heroPosition, botPosition, streetActionCount, lastActor } = state;

  if (streetActionCount === 0) {
    // First action on the street — earlier position acts first
    const order = street === 'preflop' ? PREFLOP_ORDER : POSTFLOP_ORDER;
    const heroIdx = order.indexOf(heroPosition);
    const botIdx = order.indexOf(botPosition);
    return heroIdx < botIdx ? 'hero' : 'bot';
  }

  if (!lastActor) return null;

  // Check if street is complete
  const lastAction = state.actionHistory[state.actionHistory.length - 1];

  // Call always ends the street (caller matched the bet)
  if (lastAction && lastAction.action.type === 'call') return null;

  // Two checks = street done
  if (lastAction && lastAction.action.type === 'check' && streetActionCount >= 2) return null;

  return lastActor === 'hero' ? 'bot' : 'hero';
}

function advanceStreet(state: GameState): GameState {
  const s = { ...state };
  s.bets = startNewStreet(s.bets);
  s.streetActionCount = 0;
  s.lastActor = null;

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

  return s;
}

function resolveShowdown(state: GameState): GameState {
  const heroRank = evaluateBestHand([...state.heroHand, ...state.communityCards]);
  const botRank = evaluateBestHand([...state.botHand, ...state.communityCards]);
  const cmp = compareHandRanks(heroRank, botRank);

  let winner: 'hero' | 'bot' | 'tie';
  if (cmp > 0) winner = 'hero';
  else if (cmp < 0) winner = 'bot';
  else winner = 'tie';

  return {
    ...state,
    street: 'showdown',
    result: {
      winner,
      heroHand: heroRank,
      botHand: botRank,
      potWon: state.bets.pot,
      wonByFold: false,
    },
  };
}

function dealRemainingCards(state: GameState): GameState {
  const s = { ...state };
  const needed = 5 - s.communityCards.length;
  if (needed > 0) {
    for (let i = 0; i < needed; i++) {
      s.communityCards = [...s.communityCards, ...s.deck.burnAndDeal(1)];
    }
  }
  return s;
}

export function applyGameAction(
  state: GameState,
  actor: 'hero' | 'bot',
  action: GameAction
): GameState {
  if (state.result) return state;

  let s: GameState = {
    ...state,
    bets: applyAction(state.bets, actor, action),
    actionHistory: [...state.actionHistory, { street: state.street, actor, action }],
    streetActionCount: state.streetActionCount + 1,
    lastActor: actor,
  };

  // Fold → immediate winner
  if (action.type === 'fold') {
    const winner = actor === 'hero' ? 'bot' : 'hero';
    s.result = {
      winner,
      potWon: s.bets.pot,
      wonByFold: true,
    };
    return s;
  }

  // Both all-in → run out remaining cards
  if (s.bets.heroStack <= 0 && s.bets.botStack <= 0) {
    s = dealRemainingCards(s);
    return resolveShowdown(s);
  }

  // One player all-in and the other just called
  if (action.type === 'call' && (s.bets.heroStack <= 0 || s.bets.botStack <= 0)) {
    s = dealRemainingCards(s);
    return resolveShowdown(s);
  }

  // Check if street is complete
  const nextActor = getNextToAct(s);
  if (nextActor === null && !s.result) {
    if (s.street === 'river') {
      return resolveShowdown(s);
    }
    s = advanceStreet(s);
    // After advancing, if both all-in, run out
    if (s.bets.heroStack <= 0 && s.bets.botStack <= 0) {
      s = dealRemainingCards(s);
      return resolveShowdown(s);
    }
  }

  return s;
}

export function getHeroActions(state: GameState): GameAction[] {
  return getAvailableActions(state.bets, 'hero');
}

export function getBotActions(state: GameState): GameAction[] {
  return getAvailableActions(state.bets, 'bot');
}
