'use client';

import { useState, useEffect, useRef } from 'react';
import { type MatchState } from '@/hooks/useGameSession';
import { type GameAction } from '@/engine/pot-manager';
import { type ActionRecord, getNextToAct, getHeroActions } from '@/engine/game-state';
import { STARTING_STACK } from '@/data/game-config';
import CommunityCards, { HoleCards } from './CommunityCards';
import GameActions from './GameActions';
import ShowdownResult from './ShowdownResult';

type Props = {
  match: MatchState;
  showResult: boolean;
  onHeroAction: (action: GameAction) => void;
  onShowResult: () => void;
  onNextHand: () => void;
  onQuit: () => void;
};

function fmt(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(1)}`;
}

// ─── Flat oval chip for vertical tower ───
function ChipOval({ color }: { color: 'gold' | 'red' | 'blue' }) {
  const c = {
    gold: 'from-yellow-400 to-yellow-600 border-yellow-300/60',
    red: 'from-red-400 to-red-600 border-red-300/60',
    blue: 'from-blue-400 to-blue-600 border-blue-300/60',
  }[color];
  return (
    <div className={`w-6 h-2.5 rounded-full bg-gradient-to-b ${c} border border-dashed shadow-sm`} />
  );
}

// ─── Small round chip ───
function Chip({ size = 'sm', color = 'gold' }: {
  size?: 'xs' | 'sm';
  color?: 'gold' | 'red' | 'blue' | 'white';
}) {
  const s = { xs: 'w-3.5 h-3.5', sm: 'w-5 h-5' }[size];
  const c = {
    gold: 'from-yellow-400 to-yellow-600 border-yellow-300/80',
    red: 'from-red-400 to-red-600 border-red-300/80',
    blue: 'from-blue-400 to-blue-600 border-blue-300/80',
    white: 'from-gray-100 to-gray-300 border-white',
  }[color];
  return (
    <div className={`${s} rounded-full bg-gradient-to-b ${c} border-2 border-dashed shadow-md shrink-0`} />
  );
}

// ─── Pot with vertical chip tower ───
function PotDisplay({ amount }: { amount: number }) {
  const chipCount = amount <= 0 ? 0 : amount <= 5 ? 2 : amount <= 15 ? 3 : amount <= 30 ? 4 : amount <= 60 ? 5 : 6;
  const colors: ('gold' | 'red' | 'blue')[] = ['gold', 'red', 'blue', 'gold', 'red', 'blue'];

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center">
        {Array.from({ length: chipCount }).map((_, i) => (
          <div key={i} className={i > 0 ? '-mt-1' : ''}>
            <ChipOval color={colors[i % 3]} />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start">
        <div className="text-[9px] text-emerald-300/50 uppercase tracking-[0.15em] font-medium">Pot</div>
        <div className="text-xl font-black text-yellow-300 drop-shadow-[0_1px_6px_rgba(250,204,21,0.4)]">
          {fmt(amount)}
        </div>
      </div>
    </div>
  );
}

// ─── Bet chips with directional animation ───
function BetChips({ amount, side }: { amount: number; side: 'top' | 'bottom' }) {
  if (amount <= 0) return null;
  const chipCount = Math.min(Math.max(Math.ceil(amount / 20), 1), 4);
  const chipColor: 'red' | 'blue' = side === 'top' ? 'red' : 'blue';
  const animClass = side === 'top' ? 'animate-bet-from-bot' : 'animate-bet-from-hero';

  return (
    <div className={`absolute ${
      side === 'top' ? 'top-[12%]' : 'bottom-[12%]'
    } left-1/2 -translate-x-1/2 flex items-center gap-1 ${animClass} z-10`}>
      <div className="flex -space-x-1">
        {Array.from({ length: chipCount }).map((_, i) => (
          <Chip key={i} size="xs" color={chipColor} />
        ))}
      </div>
      <span className="text-[11px] font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        {fmt(amount)}
      </span>
    </div>
  );
}

// ─── Player Info Bar ───
function PlayerInfo({ label, emoji, position, stack, isBtn }: {
  label: string;
  emoji: string;
  position: string;
  stack: number;
  isBtn: boolean;
}) {
  const stackColor = stack > STARTING_STACK
    ? 'text-green-400'
    : stack < STARTING_STACK
    ? 'text-red-400'
    : 'text-white';

  return (
    <div className="w-full max-w-[400px] bg-white/5 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-sm text-gray-300 font-medium">{label}</span>
        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 rounded-full px-2 py-0.5 font-bold">
          {position}
        </span>
        {isBtn && (
          <div className="relative">
            <Chip size="xs" color="white" />
            <span className="absolute inset-0 flex items-center justify-center text-[6px] font-black text-gray-700">D</span>
          </div>
        )}
      </div>
      <span className={`text-base font-bold ${stackColor}`}>{fmt(stack)}</span>
    </div>
  );
}

// ─── Seat (simplified — stack moved to PlayerInfo) ───
function Seat({ pos, heroPos, botPos, isActive }: {
  pos: string;
  heroPos: string;
  botPos: string;
  isActive: boolean;
}) {
  const isHero = pos === heroPos;
  const isBot = pos === botPos;
  const isEmpty = !isHero && !isBot;

  return (
    <div className="flex flex-col items-center w-[50px] relative">
      {isActive && !isEmpty && (
        <div className="absolute -inset-1 rounded-full border-2 border-yellow-400/50 animate-active-pulse pointer-events-none" />
      )}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
        isHero
          ? 'bg-gradient-to-b from-yellow-500/30 to-yellow-700/20 border-yellow-400 shadow-[0_0_14px_rgba(234,179,8,0.3)]'
          : isBot
          ? 'bg-gradient-to-b from-red-500/30 to-red-700/20 border-red-400 shadow-[0_0_14px_rgba(239,68,68,0.3)]'
          : 'bg-transparent border-dashed border-gray-700/40'
      }`}>
        {isHero ? (
          <span className="text-yellow-300 text-[12px] font-bold">나</span>
        ) : isBot ? (
          <span className="text-[14px]">🤖</span>
        ) : null}
      </div>
      <div className={`text-[9px] font-bold mt-0.5 ${
        isHero ? 'text-yellow-400' : isBot ? 'text-red-400' : 'text-gray-700'
      }`}>
        {pos}
      </div>
    </div>
  );
}

// ─── Action Toast ───
function ActionToast({ record, side }: { record: ActionRecord; side: 'top' | 'bottom' }) {
  const actor = record.actor === 'hero' ? '나' : '봇';
  let label = '';
  switch (record.action.type) {
    case 'fold': label = '폴드'; break;
    case 'check': label = '체크'; break;
    case 'call': label = '콜'; break;
    case 'bet': label = `벳 ${fmt(record.action.amount)}`; break;
    case 'raise': label = `레이즈 ${fmt(record.action.amount)}`; break;
    case 'allin': label = '올인'; break;
  }

  return (
    <div className={`absolute ${
      side === 'top' ? 'top-[3%]' : 'bottom-[3%]'
    } left-1/2 -translate-x-1/2 z-20 animate-action-toast`}>
      <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-[11px] font-bold text-white/90 whitespace-nowrap">
        {actor}: {label}
      </div>
    </div>
  );
}

// ─── Blind Post Overlay ───
function BlindPostOverlay({ heroPos, botPos }: { heroPos: string; botPos: string }) {
  const sbPlayer = heroPos === 'SB' ? '나' : botPos === 'SB' ? '봇' : null;
  const bbPlayer = heroPos === 'BB' ? '나' : botPos === 'BB' ? '봇' : null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-30 pointer-events-none">
      {sbPlayer && (
        <div className="animate-blind-post flex items-center gap-1.5">
          <Chip size="xs" color="blue" />
          <span className="text-xs font-bold text-blue-300">{sbPlayer} SB $0.5</span>
        </div>
      )}
      {bbPlayer && (
        <div className="animate-blind-post flex items-center gap-1.5" style={{ animationDelay: '200ms' }}>
          <Chip size="xs" color="blue" />
          <span className="text-xs font-bold text-blue-300">{bbPlayer} BB $1</span>
        </div>
      )}
    </div>
  );
}

// ─── Seat layout ───
const SEATS_TOP = ['BB', 'UTG', 'HJ'];
const SEATS_BOTTOM = ['SB', 'BTN', 'CO'];

export default function GameTable({ match, showResult, onHeroAction, onShowResult, onNextHand, onQuit }: Props) {
  const hand = match.currentHand;
  const [dealPhase, setDealPhase] = useState<'blinds' | 'deal' | 'ready'>('blinds');
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [lastToastAction, setLastToastAction] = useState<{ record: ActionRecord; idx: number } | null>(null);

  // Blind posting animation on new hand
  useEffect(() => {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current = [];

    if (!hand) return;

    setDealPhase('blinds');
    const t1 = setTimeout(() => setDealPhase('deal'), 800);
    const t2 = setTimeout(() => setDealPhase('ready'), 1500);
    timerRefs.current = [t1, t2];

    return () => {
      timerRefs.current.forEach(t => clearTimeout(t));
    };
  }, [match.handNumber]);

  // Action toast
  useEffect(() => {
    if (!hand) {
      setLastToastAction(null);
      return;
    }
    const history = hand.actionHistory;
    if (history.length === 0) {
      setLastToastAction(null);
      return;
    }
    const last = history[history.length - 1];
    setLastToastAction({ record: last, idx: history.length });
  }, [hand, hand?.actionHistory.length]);

  if (!hand) return null;

  const nextActor = getNextToAct(hand);
  const heroActions = nextActor === 'hero' ? getHeroActions(hand) : [];
  const isHeroTurn = nextActor === 'hero';
  const handIsOver = hand.result !== null;
  const actionsEnabled = isHeroTurn && !handIsOver && dealPhase === 'ready';

  if (handIsOver && !showResult) {
    setTimeout(onShowResult, 300);
  }

  const heroPosition = match.heroPosition;
  const botPosition = match.botPosition;
  const callAmount = Math.max(hand.bets.currentBet - hand.bets.heroStreetBet, 0);

  return (
    <div className="flex flex-col min-h-[calc(100vh-32px)]">
      {/* ─── Top bar ─── */}
      <div className="flex items-center justify-between py-2 px-1">
        <button onClick={onQuit} className="text-xs text-gray-500 hover:text-gray-300 transition">
          ← 나가기
        </button>
        <div className="text-xs text-gray-400">
          <span className="font-bold text-gray-300">핸드 {match.handNumber}</span>
          <span className="text-gray-600"> / 10</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{match.tier.emoji}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            {hand.street === 'preflop' ? 'PRE' : hand.street}
          </span>
        </div>
      </div>

      {/* ─── Main Game Area ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-3">

        {/* Bot Player Info */}
        <PlayerInfo
          label="Bot"
          emoji="🤖"
          position={botPosition}
          stack={hand.bets.botStack}
          isBtn={botPosition === 'BTN'}
        />

        {/* Bot's cards */}
        <div className="my-2 flex flex-col items-center animate-slide-up">
          <HoleCards cards={hand.botHand} faceDown={!handIsOver} />
        </div>

        {/* ─── 6-max Poker Table ─── */}
        <div className="w-full max-w-[400px]">

          {/* Top seats */}
          <div className="flex justify-around px-1 mb-1.5">
            {SEATS_TOP.map(pos => (
              <Seat
                key={pos}
                pos={pos}
                heroPos={heroPosition}
                botPos={botPosition}
                isActive={
                  (pos === heroPosition && isHeroTurn && !handIsOver) ||
                  (pos === botPosition && nextActor === 'bot' && !handIsOver)
                }
              />
            ))}
          </div>

          {/* Table oval */}
          <div className="relative aspect-[5/3] rounded-[50%] bg-gradient-to-b from-emerald-800 to-emerald-900 border-[6px] border-amber-900/80 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5),0_6px_24px_rgba(0,0,0,0.4)] overflow-visible">
            <div className="absolute inset-[4px] rounded-[50%] border border-emerald-600/15 pointer-events-none" />
            <div className="absolute inset-[6px] rounded-[50%] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.12)_100%)] pointer-events-none" />

            {/* Blind posting overlay */}
            {dealPhase === 'blinds' && (
              <BlindPostOverlay heroPos={heroPosition} botPos={botPosition} />
            )}

            {/* Bot's street bet */}
            <BetChips amount={hand.bets.botStreetBet} side="top" />

            {/* Center: Pot + Community */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <PotDisplay amount={hand.bets.pot} />
              <CommunityCards cards={hand.communityCards} street={hand.street} />
            </div>

            {/* Hero's street bet */}
            <BetChips amount={hand.bets.heroStreetBet} side="bottom" />

            {/* Action toast */}
            {lastToastAction && !handIsOver && dealPhase === 'ready' && (
              <ActionToast
                key={lastToastAction.idx}
                record={lastToastAction.record}
                side={lastToastAction.record.actor === 'bot' ? 'top' : 'bottom'}
              />
            )}
          </div>

          {/* Bottom seats */}
          <div className="flex justify-around px-1 mt-1.5">
            {SEATS_BOTTOM.map(pos => (
              <Seat
                key={pos}
                pos={pos}
                heroPos={heroPosition}
                botPos={botPosition}
                isActive={
                  (pos === heroPosition && isHeroTurn && !handIsOver) ||
                  (pos === botPosition && nextActor === 'bot' && !handIsOver)
                }
              />
            ))}
          </div>
        </div>

        {/* Hero's cards */}
        <div className="my-2 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <HoleCards cards={hand.heroHand} />
        </div>

        {/* Hero Player Info */}
        <PlayerInfo
          label="나"
          emoji="👤"
          position={heroPosition}
          stack={hand.bets.heroStack}
          isBtn={heroPosition === 'BTN'}
        />
      </div>

      {/* ─── Action buttons ─── */}
      <div className="pb-4 pt-2">
        <GameActions
          actions={heroActions}
          pot={hand.bets.pot}
          heroStack={hand.bets.heroStack}
          callAmount={callAmount}
          onAction={onHeroAction}
          disabled={!actionsEnabled}
        />
      </div>

      {/* Showdown overlay */}
      {handIsOver && showResult && (
        <ShowdownResult
          result={hand.result!}
          botHand={hand.botHand}
          heroHand={hand.heroHand}
          onNext={onNextHand}
        />
      )}
    </div>
  );
}
