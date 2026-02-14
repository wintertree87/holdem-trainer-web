'use client';

import { type Card } from '@/data/constants';
import { type GameResult } from '@/engine/game-state';
import { HAND_NAMES } from '@/engine/hand-evaluator';
import { HoleCards } from './CommunityCards';

type Props = {
  result: GameResult;
  botHand: Card[];
  heroHand: Card[];
  onNext: () => void;
};

export default function ShowdownResult({ result, botHand, heroHand, onNext }: Props) {
  const isWin = result.winner === 'hero';
  const isTie = result.winner === 'tie';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={onNext}>
      <div className="bg-gray-900 rounded-2xl p-6 max-w-[340px] w-full mx-4 text-center" onClick={e => e.stopPropagation()}>
        {/* Result */}
        <div className={`text-3xl font-black mb-2 ${
          isWin ? 'text-green-400' : isTie ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {isWin ? 'WIN!' : isTie ? 'SPLIT' : 'LOSE'}
        </div>

        {/* Pot */}
        <div className="text-sm text-gray-400 mb-4">
          {result.wonByFold
            ? '상대 폴드'
            : `팟 ${result.potWon.toFixed(1)}bb`
          }
        </div>

        {/* Hands comparison */}
        {!result.wonByFold && (
          <div className="space-y-3 mb-4">
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
              result.winner === 'hero' || isTie ? 'bg-green-900/20 border border-green-700/30' : 'bg-white/5'
            }`}>
              <span className="text-xs text-gray-400">나</span>
              <HoleCards cards={heroHand} />
              <span className="text-xs text-gray-300">{result.heroHand?.name}</span>
            </div>
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
              result.winner === 'bot' || isTie ? 'bg-red-900/20 border border-red-700/30' : 'bg-white/5'
            }`}>
              <span className="text-xs text-gray-400">봇</span>
              <HoleCards cards={botHand} />
              <span className="text-xs text-gray-300">{result.botHand?.name}</span>
            </div>
          </div>
        )}

        <button
          onClick={onNext}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white text-sm font-bold transition active:scale-95"
        >
          다음 핸드
        </button>
      </div>
    </div>
  );
}
