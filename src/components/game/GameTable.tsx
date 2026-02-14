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

const SEATS_TOP = ['UTG', 'HJ', 'CO'];
const SEATS_BOTTOM = ['BTN', 'SB', 'BB'];

function SeatBadge({ position, heroPosition, botPosition }: {
  position: string;
  heroPosition: string;
  botPosition: string;
}) {
  const isHero = position === heroPosition;
  const isBot = position === botPosition;

  return (
    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
      isHero
        ? 'bg-yellow-500/25 text-yellow-300 border-yellow-500/50 shadow-[0_0_8px_rgba(234,179,8,0.15)]'
        : isBot
        ? 'bg-red-500/25 text-red-300 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.15)]'
        : 'bg-white/5 text-gray-600 border-white/10'
    }`}>
      {isHero ? `${position} 나` : isBot ? `${position} 🤖` : position}
    </div>
  );
}

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
      {/* Top bar */}
      <div className="flex items-center justify-between py-2 px-1">
        <button onClick={onQuit} className="text-xs text-gray-500 hover:text-gray-300 transition">
          나가기
        </button>
        <div className="text-xs text-gray-400">
          <span className="font-bold text-gray-300">핸드 {match.handNumber}</span>
          <span className="text-gray-600">/10</span>
          <span className="ml-2 text-gray-500">{match.tier.emoji} {match.tier.name}</span>
        </div>
        <div className="text-[10px] text-gray-600 uppercase tracking-wider">
          {hand.street === 'preflop' ? 'PRE' : hand.street}
        </div>
      </div>

      {/* === Main Game Area === */}
      <div className="flex-1 flex flex-col items-center justify-center py-2">

        {/* Bot seat — above table */}
        <div className="flex flex-col items-center mb-2 animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 bg-gradient-to-b from-red-800/40 to-red-900/60 rounded-full flex items-center justify-center text-base border border-red-700/30 shadow-lg shadow-red-900/20">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-medium">BOT</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-red-600/30 text-red-400">
                  {botPosition}
                </span>
              </div>
              <div className="text-sm font-bold text-gray-200">{fmt(hand.bets.botStack)}</div>
            </div>
          </div>
          <HoleCards cards={hand.botHand} faceDown={!handIsOver} />
        </div>

        {/* Green felt table with 6 position seats */}
        <div className="w-full max-w-[420px]">
          {/* Top seats row */}
          <div className="flex justify-around px-6 mb-1.5">
            {SEATS_TOP.map(pos => (
              <SeatBadge key={pos} position={pos} heroPosition={heroPosition} botPosition={botPosition} />
            ))}
          </div>

          {/* Table oval */}
          <div className="relative aspect-[5/3] rounded-[50%] bg-gradient-to-b from-emerald-800 to-emerald-900 border-[6px] border-amber-900/80 shadow-[inset_0_2px_20px_rgba(0,0,0,0.4),0_4px_20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center">
            {/* Table edge highlight */}
            <div className="absolute inset-[3px] rounded-[50%] border border-emerald-600/20 pointer-events-none" />

            {/* Pot */}
            <div className="text-center mb-2">
              <div className="text-[10px] text-emerald-300/60 uppercase tracking-widest font-medium">Pot</div>
              <div className="text-2xl font-black text-yellow-300 drop-shadow-[0_1px_4px_rgba(250,204,21,0.4)]">
                {fmt(hand.bets.pot)}
              </div>
            </div>

            {/* Community cards */}
            <CommunityCards cards={hand.communityCards} street={hand.street} />
          </div>

          {/* Bottom seats row */}
          <div className="flex justify-around px-6 mt-1.5">
            {SEATS_BOTTOM.map(pos => (
              <SeatBadge key={pos} position={pos} heroPosition={heroPosition} botPosition={botPosition} />
            ))}
          </div>
        </div>

        {/* Hero seat — below table */}
        <div className="flex flex-col items-center mt-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <HoleCards cards={hand.heroHand} />
          <div className="flex items-center gap-2 mt-1">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400 font-medium">나</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-yellow-600/30 text-yellow-400">
                  {heroPosition}
                </span>
              </div>
              <div className="text-sm font-bold text-gray-200">{fmt(hand.bets.heroStack)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — pinned bottom */}
      <div className="pb-4 pt-2">
        <GameActions
          actions={heroActions}
          pot={hand.bets.pot}
          onAction={onHeroAction}
          disabled={!isHeroTurn || handIsOver}
        />
      </div>

      {/* Showdown result overlay */}
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
