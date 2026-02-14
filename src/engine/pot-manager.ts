export type BetState = {
  pot: number;
  heroStack: number;
  botStack: number;
  heroStreetBet: number;
  botStreetBet: number;
  currentBet: number;  // highest bet on current street
  minRaise: number;
};

export type GameAction =
  | { type: 'fold' }
  | { type: 'check' }
  | { type: 'call' }
  | { type: 'bet'; amount: number }
  | { type: 'raise'; amount: number }
  | { type: 'allin' };

const STARTING_STACK = 100; // bb
const SB_SIZE = 0.5;
const BB_SIZE = 1;

export function initBetState(heroIsButton: boolean): BetState {
  // HU: Button posts SB, other posts BB
  const heroSB = heroIsButton;
  return {
    pot: SB_SIZE + BB_SIZE,
    heroStack: STARTING_STACK - (heroSB ? SB_SIZE : BB_SIZE),
    botStack: STARTING_STACK - (heroSB ? BB_SIZE : SB_SIZE),
    heroStreetBet: heroSB ? SB_SIZE : BB_SIZE,
    botStreetBet: heroSB ? BB_SIZE : SB_SIZE,
    currentBet: BB_SIZE,
    minRaise: BB_SIZE, // min raise size = 1bb
  };
}

export function initBetStateWithStacks(heroStack: number, botStack: number, heroIsButton: boolean): BetState {
  const heroSB = heroIsButton;
  const heroBlind = heroSB ? SB_SIZE : BB_SIZE;
  const botBlind = heroSB ? BB_SIZE : SB_SIZE;
  return {
    pot: heroBlind + botBlind,
    heroStack: heroStack - heroBlind,
    botStack: botStack - botBlind,
    heroStreetBet: heroBlind,
    botStreetBet: botBlind,
    currentBet: BB_SIZE,
    minRaise: BB_SIZE,
  };
}

export function applyAction(
  state: BetState,
  actor: 'hero' | 'bot',
  action: GameAction
): BetState {
  const s = { ...state };
  const isHero = actor === 'hero';

  switch (action.type) {
    case 'fold':
      // No stack changes — winner determined by game-state
      return s;

    case 'check':
      return s;

    case 'call': {
      const myStreetBet = isHero ? s.heroStreetBet : s.botStreetBet;
      const callAmount = Math.min(
        s.currentBet - myStreetBet,
        isHero ? s.heroStack : s.botStack
      );
      if (isHero) {
        s.heroStack -= callAmount;
        s.heroStreetBet += callAmount;
      } else {
        s.botStack -= callAmount;
        s.botStreetBet += callAmount;
      }
      s.pot += callAmount;
      return s;
    }

    case 'bet': {
      const betAmount = Math.min(action.amount, isHero ? s.heroStack : s.botStack);
      if (isHero) {
        s.heroStack -= betAmount;
        s.heroStreetBet += betAmount;
      } else {
        s.botStack -= betAmount;
        s.botStreetBet += betAmount;
      }
      s.pot += betAmount;
      s.currentBet = isHero ? s.heroStreetBet : s.botStreetBet;
      s.minRaise = betAmount;
      return s;
    }

    case 'raise': {
      const myStreetBet = isHero ? s.heroStreetBet : s.botStreetBet;
      const totalToRaise = action.amount; // total street bet after raise
      const raiseAmount = Math.min(
        totalToRaise - myStreetBet,
        isHero ? s.heroStack : s.botStack
      );
      if (isHero) {
        s.heroStack -= raiseAmount;
        s.heroStreetBet += raiseAmount;
      } else {
        s.botStack -= raiseAmount;
        s.botStreetBet += raiseAmount;
      }
      s.pot += raiseAmount;
      const newTotal = isHero ? s.heroStreetBet : s.botStreetBet;
      s.minRaise = newTotal - s.currentBet;
      s.currentBet = newTotal;
      return s;
    }

    case 'allin': {
      const allinAmount = isHero ? s.heroStack : s.botStack;
      if (isHero) {
        s.heroStreetBet += allinAmount;
        s.heroStack = 0;
      } else {
        s.botStreetBet += allinAmount;
        s.botStack = 0;
      }
      s.pot += allinAmount;
      const newTotal = isHero ? s.heroStreetBet : s.botStreetBet;
      if (newTotal > s.currentBet) {
        s.minRaise = newTotal - s.currentBet;
        s.currentBet = newTotal;
      }
      return s;
    }
  }
}

export function startNewStreet(state: BetState): BetState {
  return {
    ...state,
    heroStreetBet: 0,
    botStreetBet: 0,
    currentBet: 0,
    minRaise: 1, // 1bb min
  };
}

export function getAvailableActions(
  state: BetState,
  actor: 'hero' | 'bot'
): GameAction[] {
  const isHero = actor === 'hero';
  const myStack = isHero ? state.heroStack : state.botStack;
  const myStreetBet = isHero ? state.heroStreetBet : state.botStreetBet;
  const actions: GameAction[] = [];

  if (myStack <= 0) return [];

  const amountToCall = state.currentBet - myStreetBet;

  if (amountToCall <= 0) {
    // No bet to face — can check or bet
    actions.push({ type: 'check' });
    // Bet sizes: 1/3 pot, 2/3 pot, pot
    const potBets = [
      Math.round(state.pot / 3),
      Math.round(state.pot * 2 / 3),
      state.pot,
    ].filter(b => b >= 1 && b < myStack);
    for (const b of potBets) {
      actions.push({ type: 'bet', amount: b });
    }
  } else {
    // Facing a bet — can fold, call, or raise
    actions.push({ type: 'fold' });
    actions.push({ type: 'call' });
    // Raise sizes
    const minRaiseTotal = state.currentBet + Math.max(state.minRaise, 1);
    if (minRaiseTotal < myStreetBet + myStack) {
      // Standard raises: 2.5x, 3x of current bet (preflop style)
      const raises = [
        Math.round(state.currentBet * 2.5),
        Math.round(state.currentBet * 3),
      ].filter(r => r >= minRaiseTotal && r < myStreetBet + myStack);
      for (const r of raises) {
        actions.push({ type: 'raise', amount: r });
      }
    }
  }

  // Always can go all-in if has chips
  if (myStack > 0) {
    actions.push({ type: 'allin' });
  }

  return actions;
}
