export type BetState = {
  pot: number;
  heroStack: number;
  botStack: number;
  heroStreetBet: number;
  botStreetBet: number;
  currentBet: number;
  minRaise: number;
};

export type GameAction =
  | { type: 'fold' }
  | { type: 'check' }
  | { type: 'call' }
  | { type: 'bet'; amount: number }
  | { type: 'raise'; amount: number }
  | { type: 'allin' };

const SB_SIZE = 0.5;
const BB_SIZE = 1;

// Position-aware blind posting for 6-max
export function initBetStateForPositions(
  heroStack: number,
  botStack: number,
  heroPosition: string,
  botPosition: string
): BetState {
  let heroBlind = 0;
  let botBlind = 0;

  if (heroPosition === 'BB') heroBlind = BB_SIZE;
  else if (heroPosition === 'SB') heroBlind = SB_SIZE;

  if (botPosition === 'BB') botBlind = BB_SIZE;
  else if (botPosition === 'SB') botBlind = SB_SIZE;

  // Pot always has full blinds (1.5). Ghost players cover any gap.
  const pot = SB_SIZE + BB_SIZE;

  return {
    pot,
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
      const totalToRaise = action.amount;
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
    minRaise: 1,
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
    actions.push({ type: 'check' });
    const potBets = [
      Math.round(state.pot / 3),
      Math.round(state.pot * 2 / 3),
      state.pot,
    ].filter(b => b >= 1 && b < myStack);
    for (const b of potBets) {
      actions.push({ type: 'bet', amount: b });
    }
  } else {
    actions.push({ type: 'fold' });
    actions.push({ type: 'call' });
    const minRaiseTotal = state.currentBet + Math.max(state.minRaise, 1);
    if (minRaiseTotal < myStreetBet + myStack) {
      const raises = [
        Math.round(state.currentBet * 2.5),
        Math.round(state.currentBet * 3),
      ].filter(r => r >= minRaiseTotal && r < myStreetBet + myStack);
      for (const r of raises) {
        actions.push({ type: 'raise', amount: r });
      }
    }
  }

  if (myStack > 0) {
    actions.push({ type: 'allin' });
  }

  return actions;
}
