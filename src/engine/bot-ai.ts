import { type Card } from '@/data/constants';
import { type GameState, getBotActions } from './game-state';
import { type GameAction, type BetState } from './pot-manager';
import { getHandNotation } from '@/utils/hand';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from '@/utils/correct-action';
import { evaluateHandStrength, analyzeBoardTexture } from '@/utils/board';

// Bot decides what action to take
export function decideBotAction(state: GameState): GameAction {
  const available = getBotActions(state);
  if (available.length === 0) return { type: 'check' };
  if (available.length === 1) return available[0];

  if (state.street === 'preflop') {
    return decidePreflopAction(state, available);
  }
  return decidePostflopAction(state, available);
}

function decidePreflopAction(state: GameState, available: GameAction[]): GameAction {
  const notation = getHandNotation(state.botHand[0], state.botHand[1]);
  const botIsButton = !state.heroIsButton; // bot is opposite of hero

  // Count preflop actions to determine phase
  const preflopActions = state.actionHistory.filter(a => a.street === 'preflop');
  const heroActions = preflopActions.filter(a => a.actor === 'hero');
  const botActions = preflopActions.filter(a => a.actor === 'bot');

  // Phase 1: Bot opens (RFI)
  if (botIsButton && botActions.length === 0) {
    // Bot is BTN/SB, first to act preflop
    const rfiAction = getCorrectAction_RFI(notation, 'BTN');
    if (rfiAction === 'raise') {
      const raiseAction = available.find(a => a.type === 'raise') || available.find(a => a.type === 'bet');
      return raiseAction || findAction(available, 'call', 'check');
    }
    // Fold or limp
    return findAction(available, 'fold', 'check');
  }

  if (!botIsButton && botActions.length === 0 && heroActions.length > 0) {
    // Bot is BB, facing hero open
    const lastHeroAction = heroActions[heroActions.length - 1];
    if (lastHeroAction.action.type === 'raise' || lastHeroAction.action.type === 'bet' || lastHeroAction.action.type === 'allin') {
      // Hero raised, bot faces RFI
      const facingAction = getCorrectAction_Facing(notation, 'BB', 'BTN');
      if (facingAction === '3bet') {
        const raiseAction = available.find(a => a.type === 'raise');
        return raiseAction || findAction(available, 'call', 'check');
      }
      if (facingAction === 'call') {
        return findAction(available, 'call', 'check');
      }
      return findAction(available, 'fold', 'check');
    }
    // Hero limped, bot checks
    return findAction(available, 'check', 'call');
  }

  // Phase 2: Bot faces 3bet (as opener)
  if (botIsButton && botActions.length >= 1) {
    const lastHeroAction = heroActions[heroActions.length - 1];
    if (lastHeroAction && (lastHeroAction.action.type === 'raise' || lastHeroAction.action.type === 'allin')) {
      const vs3betAction = getCorrectAction_Vs3bet(notation, 'BTN');
      if (vs3betAction === '4bet') {
        const raiseAction = available.find(a => a.type === 'raise');
        return raiseAction || findAction(available, 'allin', 'call');
      }
      if (vs3betAction === 'call') {
        return findAction(available, 'call', 'check');
      }
      return findAction(available, 'fold', 'check');
    }
  }

  // Phase 2: Bot faces 4bet (as 3bettor)
  if (!botIsButton && botActions.length >= 1) {
    const lastHeroAction = heroActions[heroActions.length - 1];
    if (lastHeroAction && (lastHeroAction.action.type === 'raise' || lastHeroAction.action.type === 'allin')) {
      // Facing 4bet — only call with premium
      const premium = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'];
      if (premium.includes(notation)) {
        return findAction(available, 'allin', 'call');
      }
      const medium = ['TT', '99', 'AQs', 'AJs'];
      if (medium.includes(notation)) {
        return findAction(available, 'call', 'fold');
      }
      return findAction(available, 'fold', 'check');
    }
  }

  // Default: check or fold
  return findAction(available, 'check', 'fold');
}

function decidePostflopAction(state: GameState, available: GameAction[]): GameAction {
  const board = state.communityCards;
  const texture = analyzeBoardTexture(board.slice(0, 3)); // use flop texture
  const strength = evaluateHandStrength(state.botHand, board, texture);

  const canCheck = available.some(a => a.type === 'check');
  const canBet = available.some(a => a.type === 'bet');
  const facingBet = available.some(a => a.type === 'call');

  const rand = Math.random();

  // Strong hand (value >= 60): bet/raise aggressively
  if (strength.value >= 60) {
    if (facingBet) {
      // Raise sometimes (40%), call rest
      if (rand < 0.4) {
        const raiseAction = available.find(a => a.type === 'raise');
        if (raiseAction) return raiseAction;
      }
      return findAction(available, 'call', 'check');
    }
    if (canBet) {
      // Bet 2/3 pot
      const betAction = available.find(a => a.type === 'bet' && a.amount >= Math.round(state.bets.pot * 0.5));
      return betAction || available.find(a => a.type === 'bet') || findAction(available, 'check', 'fold');
    }
    return findAction(available, 'check', 'fold');
  }

  // Medium hand (30~59): check/call, sometimes bet
  if (strength.value >= 30) {
    if (facingBet) {
      // Call most of the time (75%), fold sometimes
      if (rand < 0.75) return findAction(available, 'call', 'check');
      return findAction(available, 'fold', 'check');
    }
    if (canBet && rand < 0.3) {
      // Occasional bet (30%)
      const smallBet = available.find(a => a.type === 'bet');
      if (smallBet) return smallBet;
    }
    return findAction(available, 'check', 'fold');
  }

  // Draw hands: semi-bluff
  if (strength.hasDraws && strength.draws.length > 0) {
    if (facingBet) {
      // Call with draws (60%)
      if (rand < 0.6) return findAction(available, 'call', 'check');
      // Raise as semi-bluff (15%)
      if (rand < 0.75) {
        const raiseAction = available.find(a => a.type === 'raise');
        if (raiseAction) return raiseAction;
        return findAction(available, 'call', 'fold');
      }
      return findAction(available, 'fold', 'check');
    }
    if (canBet && rand < 0.35) {
      // Semi-bluff bet (35%)
      const betAction = available.find(a => a.type === 'bet');
      if (betAction) return betAction;
    }
    return findAction(available, 'check', 'fold');
  }

  // Air: occasional bluff
  if (facingBet) {
    // Fold most of the time (85%)
    if (rand < 0.85) return findAction(available, 'fold', 'check');
    return findAction(available, 'call', 'fold');
  }
  if (canBet && rand < 0.2) {
    // Bluff 20%
    const betAction = available.find(a => a.type === 'bet');
    if (betAction) return betAction;
  }
  return findAction(available, 'check', 'fold');
}

function findAction(available: GameAction[], preferred: GameAction['type'], fallback: GameAction['type']): GameAction {
  return available.find(a => a.type === preferred) || available.find(a => a.type === fallback) || available[0];
}
