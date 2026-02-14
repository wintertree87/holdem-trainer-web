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

export default function GameTable({ match, showResult, onHeroAction, onShowResult, onNextHand, onQuit }: Props) {
  const hand = match.currentHand;
  if (!hand) return null;

  const nextActor = getNextToAct(hand);
  const heroActions = nextActor === 'hero' ? getHeroActions(hand) : [];
  const isHeroTurn = nextActor === 'hero';
  const handIsOver = hand.result !== null;

  // Show result overlay after hand ends
  if (handIsOver && !showResult) {
    // Auto-trigger show result after a short delay
    setTimeout(onShowResult, 300);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      {/* Top bar: hand counter + stacks */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onQuit}
          className="text-xs text-gray-500 hover:text-gray-300 transition"
        >
          나가기
        </button>
        <div className="text-xs text-gray-400">
          <span className="font-bold text-gray-300">핸드 {match.handNumber}</span>/10
          <span className="ml-2">
            {match.tier.emoji} {match.tier.name}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {hand.street === 'preflop' ? 'PRE' : hand.street.toUpperCase()}
        </div>
      </div>

      {/* Bot area */}
      <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-900/30 rounded-full flex items-center justify-center text-sm">
            🤖
          </div>
          <div>
            <div className="text-xs text-gray-400">BOT</div>
            <div className="text-sm font-bold text-gray-200">
              {hand.bets.botStack.toFixed(1)}bb
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HoleCards cards={hand.botHand} faceDown={!handIsOver} />
          {!match.heroIsButton && (
            <span className="text-[10px] bg-yellow-600/30 text-yellow-400 px-1.5 py-0.5 rounded font-bold">BB</span>
          )}
          {match.heroIsButton && (
            <span className="text-[10px] bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded font-bold">SB</span>
          )}
        </div>
      </div>

      {/* Community cards + pot */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">POT</div>
          <div className="text-xl font-black text-yellow-400">
            {hand.bets.pot.toFixed(1)}bb
          </div>
        </div>
        <CommunityCards cards={hand.communityCards} street={hand.street} />
      </div>

      {/* Hero area */}
      <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 mb-3">
        <div className="flex items-center gap-2">
          <HoleCards cards={hand.heroHand} />
          {match.heroIsButton && (
            <span className="text-[10px] bg-yellow-600/30 text-yellow-400 px-1.5 py-0.5 rounded font-bold">BTN</span>
          )}
          {!match.heroIsButton && (
            <span className="text-[10px] bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded font-bold">BB</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">나</div>
          <div className="text-sm font-bold text-gray-200">
            {hand.bets.heroStack.toFixed(1)}bb
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <GameActions
        actions={heroActions}
        pot={hand.bets.pot}
        onAction={onHeroAction}
        disabled={!isHeroTurn || handIsOver}
      />

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
