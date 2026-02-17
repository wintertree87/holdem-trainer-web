'use client';

import { type Card } from '@/data/constants';
import { type MPGameResult, type PlayerState } from '@/engine/mp-game-state';
import { type PlayerId } from '@/engine/mp-pot-manager';
import { HAND_NAMES } from '@/engine/hand-evaluator';
import { HoleCards } from './CommunityCards';

const BOT_NAMES: Record<string, string> = {
  hero: '나',
  bot1: '🤖 Bot 1',
  bot2: '🦊 Bot 2',
  bot3: '🐺 Bot 3',
  bot4: '🦅 Bot 4',
  bot5: '🐙 Bot 5',
};

type Props = {
  result: MPGameResult;
  players: PlayerState[];
  communityCards: Card[];
  heroBusted: boolean;
  isLastHand: boolean;
  onNext: () => void;
};

function fmt(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(1)}`;
}

export default function MPShowdownResult({ result, players, communityCards, heroBusted, isLastHand, onNext }: Props) {
  const heroWon = result.pots.some(p => p.winners.includes('hero'));
  const isFoldWin = !!result.wonByFold;
  const matchEnding = heroBusted || isLastHand;

  // Calculate total won per player
  const winnings = new Map<PlayerId, number>();
  for (const pot of result.pots) {
    const share = pot.amount / pot.winners.length;
    for (const winner of pot.winners) {
      winnings.set(winner, (winnings.get(winner) ?? 0) + share);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onNext}>
      <div className="bg-gray-900 rounded-2xl p-5 max-w-[360px] w-full mx-4 text-center max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Result */}
        {heroBusted && (
          <div className="text-4xl mb-1">💀</div>
        )}
        <div className={`text-3xl font-black mb-2 ${
          heroBusted ? 'text-red-400' : heroWon ? 'text-green-400' : 'text-red-400'
        }`}>
          {heroBusted ? '파산!' : heroWon ? 'WIN!' : 'LOSE'}
        </div>
        {heroBusted && (
          <div className="text-sm text-red-300/70 mb-1">스택이 바닥났습니다. 매치가 종료됩니다.</div>
        )}

        {/* Summary */}
        <div className="text-sm text-gray-400 mb-3">
          {isFoldWin
            ? `${BOT_NAMES[result.wonByFold!] || result.wonByFold} 승리 (폴드)`
            : result.pots.length === 1
            ? `팟 ${fmt(result.pots[0].amount)}`
            : `${result.pots.length}개 팟`
          }
        </div>

        {/* Pots breakdown */}
        {!isFoldWin && result.pots.length > 1 && (
          <div className="space-y-1 mb-3">
            {result.pots.map((pot, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1 bg-white/5 rounded-lg text-xs">
                <span className="text-gray-500">{i === 0 ? '메인팟' : `사이드팟 ${i}`}</span>
                <span className="text-yellow-300 font-bold">{fmt(pot.amount)}</span>
                <span className={`font-bold ${pot.winners.includes('hero') ? 'text-green-400' : 'text-gray-400'}`}>
                  → {pot.winners.map(w => BOT_NAMES[w] || w).join(', ')}
                  {pot.split && ' (스플릿)'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Showdown hands */}
        {!isFoldWin && result.showdownHands.length > 0 && (
          <div className="space-y-2 mb-4">
            {result.showdownHands.map(sh => {
              const isHero = sh.playerId === 'hero';
              const isWinner = result.pots.some(p => p.winners.includes(sh.playerId));
              const won = winnings.get(sh.playerId) ?? 0;

              return (
                <div
                  key={sh.playerId}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    isWinner
                      ? isHero
                        ? 'bg-green-900/20 border border-green-700/30'
                        : 'bg-yellow-900/10 border border-yellow-700/20'
                      : 'bg-white/5'
                  }`}
                >
                  <span className="text-xs text-gray-400 w-16 text-left">
                    {BOT_NAMES[sh.playerId] || sh.playerId}
                  </span>
                  <HoleCards cards={sh.hand} />
                  <div className="text-right">
                    <div className="text-xs text-gray-300">{sh.rank.name}</div>
                    {isWinner && (
                      <div className="text-xs font-bold text-green-400">+{fmt(won)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onNext}
          className={`w-full py-3 rounded-xl text-white text-sm font-bold transition active:scale-95 ${
            matchEnding ? 'bg-gray-600 hover:bg-gray-500' : 'bg-indigo-500 hover:bg-indigo-600'
          }`}
        >
          {matchEnding ? '결과 보기' : '다음 핸드'}
        </button>
      </div>
    </div>
  );
}
