import { type GameState, getBotActions } from './game-state';
import { type GameAction } from './pot-manager';
import { getHandNotation } from '@/utils/hand';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from '@/utils/correct-action';
import { evaluateHandStrength, analyzeBoardTexture } from '@/utils/board';

const PREFLOP_ORDER = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

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
  const { heroPosition, botPosition } = state;

  const botIdx = PREFLOP_ORDER.indexOf(botPosition);
  const heroIdx = PREFLOP_ORDER.indexOf(heroPosition);
  const botIsOpener = botIdx < heroIdx;

  const preflopActions = state.actionHistory.filter(a => a.street === 'preflop');
  const heroActions = preflopActions.filter(a => a.actor === 'hero');
  const botActions = preflopActions.filter(a => a.actor === 'bot');

  // Case 1: Bot is opener (earlier position), first action
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

  // Case 2: Bot is defender, facing hero's action
  if (!botIsOpener && botActions.length === 0 && heroActions.length > 0) {
    const lastHeroAction = heroActions[heroActions.length - 1];

    if (lastHeroAction.action.type === 'raise' || lastHeroAction.action.type === 'bet' || lastHeroAction.action.type === 'allin') {
      // Facing RFI — use position-specific range
      const facingAction = getCorrectAction_Facing(notation, botPosition, heroPosition);
      if (facingAction === '3bet') {
        const raiseAction = available.find(a => a.type === 'raise');
        return raiseAction || findAction(available, 'call', 'check');
      }
      if (facingAction === 'call') {
        return findAction(available, 'call', 'check');
      }
      return findAction(available, 'fold', 'check');
    }

    // Hero limped (called without raising)
    if (botPosition === 'BB') {
      // BB can check or raise after a limp
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
      const medium = ['TT', '99', 'AQs', 'AJs'];
      if (medium.includes(notation)) {
        return findAction(available, 'call', 'fold');
      }
      return findAction(available, 'fold', 'check');
    }
  }

  return findAction(available, 'check', 'fold');
}

function decidePostflopAction(state: GameState, available: GameAction[]): GameAction {
  const board = state.communityCards;
  const texture = analyzeBoardTexture(board.slice(0, 3));
  const strength = evaluateHandStrength(state.botHand, board, texture);

  const canBet = available.some(a => a.type === 'bet');
  const facingBet = available.some(a => a.type === 'call');

  const rand = Math.random();

  // Strong hand (value >= 60): bet/raise aggressively
  if (strength.value >= 60) {
    if (facingBet) {
      if (rand < 0.4) {
        const raiseAction = available.find(a => a.type === 'raise');
        if (raiseAction) return raiseAction;
      }
      return findAction(available, 'call', 'check');
    }
    if (canBet) {
      const betAction = available.find(a => a.type === 'bet' && a.amount >= Math.round(state.bets.pot * 0.5));
      return betAction || available.find(a => a.type === 'bet') || findAction(available, 'check', 'fold');
    }
    return findAction(available, 'check', 'fold');
  }

  // Medium hand (30~59): check/call, sometimes bet
  if (strength.value >= 30) {
    if (facingBet) {
      if (rand < 0.75) return findAction(available, 'call', 'check');
      return findAction(available, 'fold', 'check');
    }
    if (canBet && rand < 0.3) {
      const smallBet = available.find(a => a.type === 'bet');
      if (smallBet) return smallBet;
    }
    return findAction(available, 'check', 'fold');
  }

  // Draw hands: semi-bluff
  if (strength.hasDraws && strength.draws.length > 0) {
    if (facingBet) {
      if (rand < 0.6) return findAction(available, 'call', 'check');
      if (rand < 0.75) {
        const raiseAction = available.find(a => a.type === 'raise');
        if (raiseAction) return raiseAction;
        return findAction(available, 'call', 'fold');
      }
      return findAction(available, 'fold', 'check');
    }
    if (canBet && rand < 0.35) {
      const betAction = available.find(a => a.type === 'bet');
      if (betAction) return betAction;
    }
    return findAction(available, 'check', 'fold');
  }

  // Air: occasional bluff
  if (facingBet) {
    if (rand < 0.85) return findAction(available, 'fold', 'check');
    return findAction(available, 'call', 'fold');
  }
  if (canBet && rand < 0.2) {
    const betAction = available.find(a => a.type === 'bet');
    if (betAction) return betAction;
  }
  return findAction(available, 'check', 'fold');
}

function findAction(available: GameAction[], preferred: GameAction['type'], fallback: GameAction['type']): GameAction {
  return available.find(a => a.type === preferred) || available.find(a => a.type === fallback) || available[0];
}
