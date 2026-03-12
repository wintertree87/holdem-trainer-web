import { type GameAction } from './pot-manager';

export type PlayerId = 'hero' | 'bot1' | 'bot2' | 'bot3' | 'bot4' | 'bot5';

export const ALL_PLAYER_IDS: PlayerId[] = ['hero', 'bot1', 'bot2', 'bot3', 'bot4', 'bot5'];

export type PlayerBet = {
  id: PlayerId;
  stack: number;
  streetBet: number;
  totalInvested: number; // total chips put into pot across all streets
  folded: boolean;
  isAllIn: boolean;
};

export type SidePot = {
  amount: number;
  eligible: PlayerId[];
};

export type MPBetState = {
  pot: number;
  sidePots: SidePot[];
  players: PlayerBet[];
  currentBet: number;
  minRaise: number;
};

const SB_SIZE = 0.5;
const BB_SIZE = 1;

export function initMPBets(
  playerStacks: Map<PlayerId, number>,
  positions: Map<PlayerId, string>,
): MPBetState {
  const players: PlayerBet[] = [];

  for (const [id, stack] of playerStacks) {
    const pos = positions.get(id)!;
    let blind = 0;
    if (pos === 'SB') blind = Math.min(SB_SIZE, stack);
    else if (pos === 'BB') blind = Math.min(BB_SIZE, stack);

    // Stack 0인 플레이어는 처음부터 folded 처리 (blind 없음)
    const isZeroStack = stack <= 0;
    players.push({
      id,
      stack: isZeroStack ? 0 : stack - blind,
      streetBet: isZeroStack ? 0 : blind,
      totalInvested: isZeroStack ? 0 : blind,
      folded: isZeroStack,
      isAllIn: !isZeroStack && stack - blind <= 0 && blind > 0,
    });
  }

  return {
    pot: SB_SIZE + BB_SIZE,
    sidePots: [],
    players,
    currentBet: BB_SIZE,
    minRaise: BB_SIZE,
  };
}

function getPlayer(state: MPBetState, id: PlayerId): PlayerBet {
  return state.players.find(p => p.id === id)!;
}

function updatePlayer(players: PlayerBet[], id: PlayerId, update: Partial<PlayerBet>): PlayerBet[] {
  return players.map(p => p.id === id ? { ...p, ...update } : p);
}

export function applyMPBetAction(
  state: MPBetState,
  playerId: PlayerId,
  action: GameAction,
): MPBetState {
  const s = { ...state, players: state.players.map(p => ({ ...p })) };
  const player = getPlayer(s, playerId);

  switch (action.type) {
    case 'fold': {
      s.players = updatePlayer(s.players, playerId, { folded: true });
      return s;
    }

    case 'check':
      return s;

    case 'call': {
      const callAmount = Math.min(s.currentBet - player.streetBet, player.stack);
      s.players = updatePlayer(s.players, playerId, {
        stack: player.stack - callAmount,
        streetBet: player.streetBet + callAmount,
        totalInvested: player.totalInvested + callAmount,
        isAllIn: player.stack - callAmount <= 0,
      });
      s.pot += callAmount;
      return s;
    }

    case 'bet': {
      const betAmount = Math.min(action.amount, player.stack);
      s.players = updatePlayer(s.players, playerId, {
        stack: player.stack - betAmount,
        streetBet: player.streetBet + betAmount,
        totalInvested: player.totalInvested + betAmount,
        isAllIn: player.stack - betAmount <= 0,
      });
      s.pot += betAmount;
      const newStreetBet = player.streetBet + betAmount;
      s.currentBet = newStreetBet;
      s.minRaise = betAmount;
      return s;
    }

    case 'raise': {
      const totalToRaise = action.amount;
      const raiseAmount = Math.min(totalToRaise - player.streetBet, player.stack);
      s.players = updatePlayer(s.players, playerId, {
        stack: player.stack - raiseAmount,
        streetBet: player.streetBet + raiseAmount,
        totalInvested: player.totalInvested + raiseAmount,
        isAllIn: player.stack - raiseAmount <= 0,
      });
      s.pot += raiseAmount;
      const newTotal = player.streetBet + raiseAmount;
      s.minRaise = newTotal - s.currentBet;
      s.currentBet = newTotal;
      return s;
    }

    case 'allin': {
      const allinAmount = player.stack;
      const newStreetBet = player.streetBet + allinAmount;
      s.players = updatePlayer(s.players, playerId, {
        stack: 0,
        streetBet: newStreetBet,
        totalInvested: player.totalInvested + allinAmount,
        isAllIn: true,
      });
      s.pot += allinAmount;
      if (newStreetBet > s.currentBet) {
        s.minRaise = newStreetBet - s.currentBet;
        s.currentBet = newStreetBet;
      }
      return s;
    }
  }
}

export function startMPNewStreet(state: MPBetState): MPBetState {
  return {
    ...state,
    players: state.players.map(p => ({ ...p, streetBet: 0 })),
    currentBet: 0,
    minRaise: 1,
  };
}

export function calculateSidePots(state: MPBetState): SidePot[] {
  // Collect all-in amounts to determine pot boundaries
  const activePlayers = state.players.filter(p => !p.folded);
  const allInAmounts = activePlayers
    .filter(p => p.isAllIn)
    .map(p => p.totalInvested)
    .sort((a, b) => a - b);

  // Remove duplicates
  const levels = [...new Set(allInAmounts)];

  if (levels.length === 0) return [];

  const pots: SidePot[] = [];
  let prevLevel = 0;

  for (const level of levels) {
    const contribution = level - prevLevel;
    if (contribution <= 0) continue;

    let potAmount = 0;
    const eligible: PlayerId[] = [];

    for (const p of state.players) {
      const contributed = Math.min(p.totalInvested - prevLevel, contribution);
      if (contributed > 0) {
        potAmount += contributed;
      }
      // Player is eligible if not folded and invested at least up to this level
      if (!p.folded && p.totalInvested >= level) {
        eligible.push(p.id);
      }
    }

    if (potAmount > 0 && eligible.length > 0) {
      pots.push({ amount: potAmount, eligible });
    }

    prevLevel = level;
  }

  // Remaining pot (above highest all-in)
  const maxLevel = levels[levels.length - 1] || 0;
  let remainingPot = 0;
  const remainingEligible: PlayerId[] = [];

  for (const p of state.players) {
    const extra = p.totalInvested - maxLevel;
    if (extra > 0) {
      remainingPot += extra;
    }
    if (!p.folded && p.totalInvested > maxLevel) {
      remainingEligible.push(p.id);
    }
  }

  if (remainingPot > 0 && remainingEligible.length > 0) {
    pots.push({ amount: remainingPot, eligible: remainingEligible });
  }

  return pots;
}

export function getAvailableMPActions(
  state: MPBetState,
  playerId: PlayerId,
): GameAction[] {
  const player = getPlayer(state, playerId);
  if (!player || player.folded || player.isAllIn || player.stack <= 0) return [];

  const actions: GameAction[] = [];
  const amountToCall = state.currentBet - player.streetBet;

  if (amountToCall <= 0) {
    // Can check or bet
    actions.push({ type: 'check' });
    const potBets = [
      Math.round(state.pot / 3),
      Math.round(state.pot * 2 / 3),
      state.pot,
    ].filter(b => b >= 1 && b < player.stack);
    for (const b of potBets) {
      actions.push({ type: 'bet', amount: b });
    }
  } else {
    // Facing a bet
    actions.push({ type: 'fold' });
    actions.push({ type: 'call' });
    const minRaiseTotal = state.currentBet + Math.max(state.minRaise, 1);
    if (minRaiseTotal < player.streetBet + player.stack) {
      const raises = [
        Math.round(state.currentBet * 2.5),
        Math.round(state.currentBet * 3),
      ].filter(r => r >= minRaiseTotal && r < player.streetBet + player.stack);
      for (const r of raises) {
        actions.push({ type: 'raise', amount: r });
      }
    }
  }

  if (player.stack > 0) {
    actions.push({ type: 'allin' });
  }

  return actions;
}
