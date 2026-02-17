'use client';

import { useState, useEffect, useRef } from 'react';
import { type MPMatchState } from '@/hooks/useMultiplayerSession';
import { type GameAction } from '@/engine/pot-manager';
import { type PlayerId } from '@/engine/mp-pot-manager';
import { type MPActionRecord, getNextToAct, getHeroMPActions, getPlayerBet } from '@/engine/mp-game-state';
import { STARTING_STACK } from '@/data/game-config';
import CommunityCards, { HoleCards } from './CommunityCards';
import GameActions from './GameActions';
import MPShowdownResult from './MPShowdownResult';

type Props = {
  match: MPMatchState;
  showResult: boolean;
  onHeroAction: (action: GameAction) => void;
  onShowResult: () => void;
  onNextHand: () => void;
  onQuit: () => void;
};

function fmt(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(1)}`;
}

const BOT_AVATARS: Record<string, { emoji: string; name: string }> = {
  hero: { emoji: '👤', name: '나' },
  bot1: { emoji: '🤖', name: 'Bot 1' },
  bot2: { emoji: '🦊', name: 'Bot 2' },
  bot3: { emoji: '🐺', name: 'Bot 3' },
  bot4: { emoji: '🦅', name: 'Bot 4' },
  bot5: { emoji: '🐙', name: 'Bot 5' },
};

// Seat positions around the table (mobile layout)
// Top row: 3 seats, Bottom row: 3 seats (hero always center bottom)
// We arrange by position order, hero is always at seat index 0 (bottom center)
function getSeatLayout(players: { id: PlayerId; position: string }[]) {
  const hero = players.find(p => p.id === 'hero')!;

  // Sort other players by POSTFLOP_ORDER relative to hero
  const POSITION_ORDER = ['SB', 'BB', 'UTG', 'HJ', 'CO', 'BTN'];
  const heroIdx = POSITION_ORDER.indexOf(hero.position);

  // Get players in clockwise order starting from hero's left
  const others = players
    .filter(p => p.id !== 'hero')
    .sort((a, b) => {
      const ai = (POSITION_ORDER.indexOf(a.position) - heroIdx + 6) % 6;
      const bi = (POSITION_ORDER.indexOf(b.position) - heroIdx + 6) % 6;
      return ai - bi;
    });

  // Layout: bottom = [left, hero, right], top = [left, center, right]
  return {
    bottomLeft: others[0],
    bottomCenter: hero,
    bottomRight: others[4],
    topLeft: others[1],
    topCenter: others[2],
    topRight: others[3],
  };
}

// Small chip for dealer button
function DealerChip() {
  return (
    <div className="w-4 h-4 rounded-full bg-gradient-to-b from-gray-100 to-gray-300 border-2 border-dashed border-white shadow-md flex items-center justify-center">
      <span className="text-[6px] font-black text-gray-700">D</span>
    </div>
  );
}

// Individual seat component
function PlayerSeat({
  playerId,
  position,
  stack,
  isActive,
  isFolded,
  isAllIn,
  isHero,
  isBtn,
  lastAction,
  streetBet,
}: {
  playerId: PlayerId;
  position: string;
  stack: number;
  isActive: boolean;
  isFolded: boolean;
  isAllIn: boolean;
  isHero: boolean;
  isBtn: boolean;
  lastAction: MPActionRecord | null;
  streetBet: number;
}) {
  const avatar = BOT_AVATARS[playerId] || { emoji: '?', name: playerId };
  const stackColor = stack > STARTING_STACK ? 'text-green-400' : stack < STARTING_STACK ? 'text-red-400' : 'text-white';

  return (
    <div className={`flex flex-col items-center w-[68px] relative ${isFolded ? 'opacity-40' : ''}`}>
      {/* Active indicator */}
      {isActive && !isFolded && (
        <div className="absolute -inset-1 rounded-xl border-2 border-yellow-400/50 animate-active-pulse pointer-events-none z-10" />
      )}

      {/* Avatar circle */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
        isHero
          ? 'bg-gradient-to-b from-yellow-500/30 to-yellow-700/20 border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
          : isFolded
          ? 'bg-gray-800/50 border-gray-700/30'
          : 'bg-gradient-to-b from-gray-600/30 to-gray-800/20 border-gray-500/50'
      }`}>
        <span className="text-[14px]">{isHero ? '👤' : avatar.emoji}</span>
      </div>

      {/* Position + BTN + Name */}
      <div className="flex items-center gap-0.5 mt-0.5">
        <span className={`text-[8px] font-bold px-1 py-0 rounded ${
          isHero ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-gray-400'
        }`}>
          {position}
        </span>
        {isBtn && <DealerChip />}
      </div>

      {/* Stack */}
      <div className={`text-[10px] font-bold ${stackColor}`}>
        {fmt(stack)}
      </div>

      {/* All-in badge */}
      {isAllIn && !isFolded && (
        <div className="text-[8px] font-bold text-red-400 bg-red-900/30 px-1 rounded animate-pulse">
          ALL-IN
        </div>
      )}

      {/* Street bet */}
      {streetBet > 0 && !isFolded && (
        <div className="text-[9px] font-bold text-yellow-300 mt-0.5">
          {fmt(streetBet)}
        </div>
      )}

      {/* Last action toast */}
      {lastAction && !isFolded && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 animate-action-toast">
          <div className="bg-black/80 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white/90 whitespace-nowrap">
            {formatAction(lastAction.action)}
          </div>
        </div>
      )}
    </div>
  );
}

function formatAction(action: GameAction): string {
  switch (action.type) {
    case 'fold': return '폴드';
    case 'check': return '체크';
    case 'call': return '콜';
    case 'bet': return `벳 ${fmt(action.amount)}`;
    case 'raise': return `레이즈 ${fmt(action.amount)}`;
    case 'allin': return '올인';
  }
}

// Pot display
function PotDisplay({ amount }: { amount: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="text-[9px] text-emerald-300/50 uppercase tracking-wider font-medium">Pot</div>
      <div className="text-lg font-black text-yellow-300 drop-shadow-[0_1px_6px_rgba(250,204,21,0.4)]">
        {fmt(amount)}
      </div>
    </div>
  );
}

export default function MPGameTable({ match, showResult, onHeroAction, onShowResult, onNextHand, onQuit }: Props) {
  const hand = match.currentHand;
  const [dealPhase, setDealPhase] = useState<'blinds' | 'deal' | 'ready'>('blinds');
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [lastActions, setLastActions] = useState<Map<PlayerId, MPActionRecord>>(new Map());

  // Blind posting animation
  useEffect(() => {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current = [];

    if (!hand) return;

    setDealPhase('blinds');
    setLastActions(new Map());
    const t1 = setTimeout(() => setDealPhase('deal'), 800);
    const t2 = setTimeout(() => setDealPhase('ready'), 1500);
    timerRefs.current = [t1, t2];

    return () => {
      timerRefs.current.forEach(t => clearTimeout(t));
    };
  }, [match.handNumber]);

  // Track last action per player
  useEffect(() => {
    if (!hand) return;
    const history = hand.actionHistory;
    if (history.length === 0) return;

    const newActions = new Map<PlayerId, MPActionRecord>();
    for (const record of history) {
      newActions.set(record.playerId, record);
    }
    setLastActions(newActions);
  }, [hand, hand?.actionHistory.length]);

  if (!hand) return null;

  const nextActor = getNextToAct(hand);
  const heroActions = nextActor === 'hero' ? getHeroMPActions(hand) : [];
  const isHeroTurn = nextActor === 'hero';
  const handIsOver = hand.result !== null;
  const actionsEnabled = isHeroTurn && !handIsOver && dealPhase === 'ready';

  if (handIsOver && !showResult) {
    setTimeout(onShowResult, 300);
  }

  const heroBet = getPlayerBet(hand, 'hero');
  const callAmount = heroBet ? Math.max(hand.bets.currentBet - heroBet.streetBet, 0) : 0;
  const heroStack = heroBet?.stack ?? 0;

  // Layout seats
  const layout = getSeatLayout(hand.players.map(p => ({ id: p.id, position: p.position })));
  const topSeats = [layout.topLeft, layout.topCenter, layout.topRight];
  const bottomSeats = [layout.bottomLeft, layout.bottomCenter, layout.bottomRight];

  function renderSeat(player: { id: PlayerId; position: string } | undefined) {
    if (!player) return <div className="w-[68px]" />;

    const bet = getPlayerBet(hand!, player.id);
    const matchPlayer = match.players.find(p => p.id === player.id);
    const currentStack = bet?.stack ?? matchPlayer?.stack ?? 0;

    return (
      <PlayerSeat
        key={player.id}
        playerId={player.id}
        position={player.position}
        stack={currentStack}
        isActive={nextActor === player.id && !handIsOver}
        isFolded={bet?.folded ?? false}
        isAllIn={bet?.isAllIn ?? false}
        isHero={player.id === 'hero'}
        isBtn={player.position === 'BTN'}
        lastAction={dealPhase === 'ready' ? (lastActions.get(player.id) ?? null) : null}
        streetBet={bet?.streetBet ?? 0}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-32px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between py-2 px-1">
        <button onClick={onQuit} className="text-xs text-gray-500 hover:text-gray-300 transition">
          ← 나가기
        </button>
        <div className="text-xs text-gray-400 text-center">
          <div>
            <span className="font-bold text-gray-300">핸드 {match.handNumber}</span>
            <span className="text-gray-600"> / 10</span>
          </div>
          <div className="text-[10px] text-gray-500">6-max</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{match.tier.emoji}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
            {hand.street === 'preflop' ? 'PRE' : hand.street}
          </span>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-2">

        {/* Top seats */}
        <div className="flex justify-around w-full max-w-[340px] mb-2">
          {topSeats.map(p => renderSeat(p))}
        </div>

        {/* Table oval */}
        <div className="w-full max-w-[340px] relative aspect-[5/3] rounded-[50%] bg-gradient-to-b from-emerald-800 to-emerald-900 border-[6px] border-amber-900/80 shadow-[inset_0_4px_30px_rgba(0,0,0,0.5),0_6px_24px_rgba(0,0,0,0.4)] overflow-visible">
          <div className="absolute inset-[4px] rounded-[50%] border border-emerald-600/15 pointer-events-none" />
          <div className="absolute inset-[6px] rounded-[50%] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.12)_100%)] pointer-events-none" />

          {/* Center: Pot + Community */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <PotDisplay amount={hand.bets.pot} />
            <CommunityCards cards={hand.communityCards} street={hand.street} />
          </div>
        </div>

        {/* Bottom seats */}
        <div className="flex justify-around w-full max-w-[340px] mt-2">
          {bottomSeats.map(p => renderSeat(p))}
        </div>

        {/* Hero's cards (larger, below the table) */}
        <div className="my-3 flex flex-col items-center">
          <HoleCards cards={hand.players.find(p => p.id === 'hero')!.hand} />
        </div>
      </div>

      {/* Action buttons */}
      <div className={`pb-4 pt-2 ${actionsEnabled ? 'bg-yellow-500/5 rounded-t-2xl' : ''}`}>
        {actionsEnabled && (
          <div className="text-center text-[11px] text-yellow-400/70 font-medium mb-1">내 차례</div>
        )}
        <GameActions
          actions={heroActions}
          pot={hand.bets.pot}
          heroStack={heroStack}
          callAmount={callAmount}
          onAction={onHeroAction}
          disabled={!actionsEnabled}
        />
      </div>

      {/* Showdown overlay */}
      {handIsOver && showResult && hand.result && (
        <MPShowdownResult
          result={hand.result}
          players={hand.players}
          communityCards={hand.communityCards}
          onNext={onNextHand}
        />
      )}
    </div>
  );
}
