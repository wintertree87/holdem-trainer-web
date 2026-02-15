'use client';

import { type MatchResult } from '@/hooks/useGameSession';
import SpotReplay from './SpotReplay';

type Props = {
  result: MatchResult;
  xpEarned: number;
  onClose: () => void;
};

export default function MatchSummary({ result, xpEarned, onClose }: Props) {
  const isWin = result.winner === 'hero';
  const isTie = result.winner === 'tie';

  return (
    <div className="max-w-[400px] mx-auto mt-6 animate-slide-up">
      {/* Result banner */}
      <div className={`text-center py-6 rounded-t-2xl ${
        isWin ? 'bg-gradient-to-b from-green-900/40 to-transparent' :
        isTie ? 'bg-gradient-to-b from-yellow-900/40 to-transparent' :
        'bg-gradient-to-b from-red-900/40 to-transparent'
      }`}>
        <div className="text-4xl mb-2">{isWin ? '🏆' : isTie ? '🤝' : '💀'}</div>
        <div className={`text-2xl font-black ${
          isWin ? 'text-green-400' : isTie ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {isWin ? '승리!' : isTie ? '무승부' : '패배'}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          {result.tier.emoji} {result.tier.name}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white/5 rounded-b-2xl p-5 space-y-4">
        {/* Stack result */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">최종 스택</span>
          <span className={`text-lg font-bold ${result.bbWon >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {result.bbWon >= 0 ? '+' : '-'}${Math.abs(result.bbWon).toFixed(0)}
          </span>
        </div>

        {/* Hand stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-green-400">{result.wins}</div>
            <div className="text-xs text-gray-500">승리</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-red-400">{result.losses}</div>
            <div className="text-xs text-gray-500">패배</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-400">{result.handsPlayed}</div>
            <div className="text-xs text-gray-500">핸드</div>
          </div>
        </div>

        {/* XP earned */}
        <div className="flex items-center justify-between bg-indigo-900/20 rounded-lg px-4 py-3 border border-indigo-700/20">
          <span className="text-sm text-indigo-300">XP 획득</span>
          <span className="text-lg font-bold text-indigo-400">+{xpEarned}</span>
        </div>

        {/* Spot Replay */}
        {result.history && result.history.length > 0 && (
          <SpotReplay history={result.history} />
        )}

        {/* Back button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-bold transition active:scale-95"
        >
          로비로 돌아가기
        </button>
      </div>
    </div>
  );
}
