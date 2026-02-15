'use client';

import { type MatchState } from '@/hooks/useGameSession';
import { type GameAction } from '@/engine/pot-manager';
import { getNextToAct, getHeroActions } from '@/engine/game-state';
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

// ─── Poker Chip ───
function Chip({ size = 'sm', color = 'gold' }: {
  size?: 'xs' | 'sm' | 'md';
  color?: 'gold' | 'red' | 'blue' | 'white';
}) {
  const s = { xs: 'w-3.5 h-3.5', sm: 'w-5 h-5', md: 'w-6 h-6' }[size];
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

// ─── Pot with chip stack ───
function PotDisplay({ amount }: { amount: number }) {
  const chipCount = Math.min(Math.max(Math.ceil(amount / 15), 1), 6);
  const colors: ('gold' | 'red' | 'blue')[] = ['gold', 'red', 'blue', 'gold', 'red', 'blue'];
  return (
    <div className="flex flex-col items-center">
      <div className="flex -space-x-1 mb-0.5">
        {Array.from({ length: chipCount }).map((_, i) => (
          <Chip key={i} size="sm" color={colors[i % 3]} />
        ))}
      </div>
      <div className="text-[9px] text-emerald-300/50 uppercase tracking-[0.15em] font-medium">Pot</div>
      <div className="text-xl font-black text-yellow-300 drop-shadow-[0_1px_6px_rgba(250,204,21,0.4)]">
        {fmt(amount)}
      </div>
    </div>
  );
}

// ─── Bet indicator (inside table, near player) ───
function BetChips({ amount, side }: { amount: number; side: 'top' | 'bottom' }) {
  if (amount <= 0) return null;
  const chipCount = Math.min(Math.max(Math.ceil(amount / 20), 1), 4);
  const chipColor = side === 'top' ? 'red' : 'blue';
  return (
    <div className={`absolute ${
      side === 'top' ? 'top-[12%]' : 'bottom-[12%]'
    } left-1/2 -translate-x-1/2 flex items-center gap-1 animate-chip-in z-10`}>
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

// ─── Seat around the table ───
function Seat({
  pos, heroPos, botPos, isActive, heroStack, botStack,
}: {
  pos: string; heroPos: string; botPos: string;
  isActive: boolean; heroStack: number; botStack: number;
}) {
  const isHero = pos === heroPos;
  const isBot = pos === botPos;
  const isEmpty = !isHero && !isBot;
  const isBTN = pos === 'BTN';
  const isSB = pos === 'SB';
  const isBB = pos === 'BB';
  const stack = isHero ? heroStack : isBot ? botStack : 0;

  return (
    <div className="flex flex-col items-center w-[60px] relative">
      {/* Dealer button */}
      {isBTN && (
        <div className="absolute -top-0.5 -right-0.5 z-20">
          <Chip size="xs" color="white" />
          <span className="absolute inset-0 flex items-center justify-center text-[6px] font-black text-gray-700">D</span>
        </div>
      )}

      {/* Active turn indicator */}
      {isActive && !isEmpty && (
        <div className="absolute -inset-1 rounded-full border-2 border-yellow-400/50 animate-active-pulse pointer-events-none" />
      )}

      {/* Avatar circle */}
      <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
        isHero
          ? 'bg-gradient-to-b from-yellow-500/30 to-yellow-700/20 border-yellow-400 shadow-[0_0_14px_rgba(234,179,8,0.3)]'
          : isBot
          ? 'bg-gradient-to-b from-red-500/30 to-red-700/20 border-red-400 shadow-[0_0_14px_rgba(239,68,68,0.3)]'
          : 'bg-gray-800/40 border-gray-700/40'
      }`}>
        {isHero ? (
          <span className="text-yellow-300 text-[13px] font-bold">나</span>
        ) : isBot ? (
          <span className="text-[15px]">🤖</span>
        ) : (
          <span className="text-gray-700 text-[9px]">fold</span>
        )}
      </div>

      {/* Position label */}
      <div className={`text-[9px] font-bold mt-0.5 ${
        isHero ? 'text-yellow-400' : isBot ? 'text-red-400' : 'text-gray-600'
      }`}>
        {pos}
      </div>

      {/* Blind indicator */}
      {isSB && (
        <div className="text-[7px] text-blue-400/70 font-medium">SB $0.5</div>
      )}
      {isBB && (
        <div className="text-[7px] text-blue-400/70 font-medium">BB $1</div>
      )}

      {/* Stack for active players */}
      {!isEmpty && !isSB && !isBB && (
        <div className="text-[10px] font-semibold text-gray-300">{fmt(stack)}</div>
      )}
      {!isEmpty && (isSB || isBB) && (
        <div className="text-[10px] font-semibold text-gray-300">{fmt(stack)}</div>
      )}
    </div>
  );
}

// ─── Seat layout (clockwise: BTN→SB→BB→UTG→HJ→CO) ───
const SEATS_TOP = ['BB', 'UTG', 'HJ'];
const SEATS_BOTTOM = ['SB', 'BTN', 'CO'];

export default function GameTable({ match, showResult, onHeroAction, onShowResult, onNextHand, onQuit }: Props) {
  const hand = match.currentHand;
  if (!hand) return null;

  const nextActor = getNextToAct(hand);
  const heroActions = nextActor === 'hero' ? getHeroActions(hand) : [];
  const isHeroTurn = nextActor === 'hero';
  const handIsOver = hand.result !== null;

  if (handIsOver && !showResult) {
    setTimeout(onShowResult, 300);
  }

  const heroPosition = match.heroPosition;
  const botPosition = match.botPosition;

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

        {/* Bot's cards */}
        <div className="mb-2 flex flex-col items-center animate-slide-up">
          <div className="text-[10px] text-red-400/70 font-bold mb-1 flex items-center gap-1">
            🤖 <span className="text-red-400">{botPosition}</span>
          </div>
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
                heroStack={hand.bets.heroStack}
                botStack={hand.bets.botStack}
              />
            ))}
          </div>

          {/* Table oval */}
          <div className="relative aspect-[5/3] rounded-[50%] bg-gradient-to-b from-emerald-800 to-emerald-900 border-[6px] border-amber-900/80 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5),0_6px_24px_rgba(0,0,0,0.4)] overflow-visible">
            {/* Inner rim */}
            <div className="absolute inset-[4px] rounded-[50%] border border-emerald-600/15 pointer-events-none" />
            {/* Felt texture */}
            <div className="absolute inset-[6px] rounded-[50%] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.12)_100%)] pointer-events-none" />

            {/* Bot's street bet */}
            <BetChips amount={hand.bets.botStreetBet} side="top" />

            {/* Center: Pot + Community */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <PotDisplay amount={hand.bets.pot} />
              <CommunityCards cards={hand.communityCards} street={hand.street} />
            </div>

            {/* Hero's street bet */}
            <BetChips amount={hand.bets.heroStreetBet} side="bottom" />
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
                heroStack={hand.bets.heroStack}
                botStack={hand.bets.botStack}
              />
            ))}
          </div>
        </div>

        {/* Hero's cards */}
        <div className="mt-2 flex flex-col items-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <HoleCards cards={hand.heroHand} />
          <div className="text-[10px] text-yellow-400/70 font-bold mt-1 flex items-center gap-1">
            <span className="text-yellow-300">나</span>
            <span className="text-yellow-400">{heroPosition}</span>
          </div>
        </div>
      </div>

      {/* ─── Action buttons ─── */}
      <div className="pb-4 pt-2">
        <GameActions
          actions={heroActions}
          pot={hand.bets.pot}
          onAction={onHeroAction}
          disabled={!isHeroTurn || handIsOver}
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
