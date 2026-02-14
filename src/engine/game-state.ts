import { type Card } from '@/data/constants';
import { Deck } from './deck';
import {
  type BetState,
  type GameAction,
  initBetStateWithStacks,
  applyAction,
  startNewStreet,
  getAvailableActions,
} from './pot-manager';
import { evaluateBestHand, compareHandRanks, type HandRank, HAND_NAMES } from './hand-evaluator';

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
  heroIsButton: boolean;
  actionHistory: ActionRecord[];
  result: GameResult | null;
  streetActionCount: number; // actions taken on current street
  lastActor: 'hero' | 'bot' | null;
};

export function initHand(
  heroStack: number,
  botStack: number,
  heroIsButton: boolean
): GameState {
  const deck = new Deck();
  const heroHand = deck.deal(2);
  const botHand = deck.deal(2);
  const bets = initBetStateWithStacks(heroStack, botStack, heroIsButton);

  return {
    street: 'preflop',
    deck,
    heroHand,
    botHand,
    communityCards: [],
    bets,
    heroIsButton,
    actionHistory: [],
    result: null,
    streetActionCount: 0,
    lastActor: null,
  };
}

// HU action order:
// Preflop: BTN(SB) acts first, then BB
// Postflop: BB acts first (OOP), then BTN(IP)
export function getNextToAct(state: GameState): 'hero' | 'bot' | null {
  if (state.result) return null;

  // Check if both players are all-in
  if (state.bets.heroStack <= 0 && state.bets.botStack <= 0) return null;

  const { street, heroIsButton, streetActionCount, lastActor } = state;

  if (streetActionCount === 0) {
    // First action on the street
    if (street === 'preflop') {
      // BTN(SB) acts first preflop
      return heroIsButton ? 'hero' : 'bot';
    } else {
      // BB acts first postflop (BB = non-button)
      return heroIsButton ? 'bot' : 'hero';
    }
  }

  // After first action, alternate
  if (!lastActor) return null;

  // Check if street is complete
  const heroBet = state.bets.heroStreetBet;
  const botBet = state.bets.botStreetBet;
  const betsEqual = Math.abs(heroBet - botBet) < 0.01;

  // If the last action was check/call and bets are equal, street is done
  const lastAction = state.actionHistory[state.actionHistory.length - 1];
  if (lastAction && (lastAction.action.type === 'check' || lastAction.action.type === 'call') && betsEqual && streetActionCount >= 2) {
    return null; // street complete
  }

  // If last action was a call and bets are equal, street is done (even with 1 action count for preflop BB check)
  if (lastAction && lastAction.action.type === 'call') {
    return null;
  }

  // For preflop: after SB just calls (limps), BB still needs to act
  // streetActionCount >= 2 && both checked = done
  if (lastAction && lastAction.action.type === 'check' && streetActionCount >= 2) {
    return null;
  }

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

// Deal remaining community cards for all-in runout
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

  // Check if both all-in → run out remaining cards
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
    // After advancing, check if both are all-in (one might have 0 stack from earlier)
    if (s.bets.heroStack <= 0 || s.bets.botStack <= 0) {
      // Skip through remaining streets
      if (s.bets.heroStack <= 0 && s.bets.botStack <= 0) {
        s = dealRemainingCards(s);
        return resolveShowdown(s);
      }
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
