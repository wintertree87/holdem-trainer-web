'use client';

import { type MPMatchResult } from '@/hooks/useMultiplayerSession';
import { type PlayerId } from '@/engine/mp-pot-manager';
import MPSpotReplay from './MPSpotReplay';

const BOT_NAMES: Record<string, string> = {
  hero: '나',
  bot1: '🤖 Bot 1',
  bot2: '🦊 Bot 2',
  bot3: '🐺 Bot 3',
  bot4: '🦅 Bot 4',
  bot5: '🐙 Bot 5',
};

type Props = {
  result: MPMatchResult;
  xpEarned: number;
  onClose: () => void;
};

function fmt(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(1)}`;
}

export default function MPMatchSummary({ result, xpEarned, onClose }: Props) {
  const heroRank = result.ranking.findIndex(p => p.id === 'hero') + 1;
  const isWin = heroRank === 1;
  const isTop3 = heroRank <= 3;

  const rankEmoji = heroRank === 1 ? '🏆' : heroRank === 2 ? '🥈' : heroRank === 3 ? '🥉' : heroRank <= 5 ? '📉' : '💀';
  const rankLabel = heroRank === 1 ? '1등!' : `${heroRank}등`;

  return (
    <div className="max-w-[400px] mx-auto mt-6 animate-slide-up">
      {/* Result banner */}
      <div className={`text-center py-6 rounded-t-2xl ${
        isWin ? 'bg-gradient-to-b from-green-900/40 to-transparent' :
        isTop3 ? 'bg-gradient-to-b from-yellow-900/40 to-transparent' :
        'bg-gradient-to-b from-red-900/40 to-transparent'
      }`}>
        <div className="text-4xl mb-2">{rankEmoji}</div>
        <div className={`text-2xl font-black ${
          isWin ? 'text-green-400' : isTop3 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {rankLabel}
        </div>
        <div className="text-sm text-gray-400 mt-1">
          {result.tier.emoji} {result.tier.name} · 6-max
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white/5 rounded-b-2xl p-5 space-y-4">
        {/* Stack result */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">BB 수익</span>
          <span className={`text-lg font-bold ${result.bbWon >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {result.bbWon >= 0 ? '+' : ''}{fmt(result.bbWon)}
          </span>
        </div>

        {/* Hand stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-green-400">{result.wins}</div>
            <div className="text-xs text-gray-500">팟 승리</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-red-400">{result.losses}</div>
            <div className="text-xs text-gray-500">팟 패배</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-400">{result.handsPlayed}</div>
            <div className="text-xs text-gray-500">핸드</div>
          </div>
        </div>

        {/* Ranking */}
        <div>
          <div className="text-sm font-bold text-gray-300 mb-2">최종 순위</div>
          <div className="space-y-1">
            {result.ranking.map((p, i) => {
              const isHero = p.id === 'hero';
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}위`;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
                    isHero ? 'bg-yellow-900/20 border border-yellow-700/20' : 'bg-white/3'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-6">{medal}</span>
                    <span className={`font-medium ${isHero ? 'text-yellow-300' : 'text-gray-300'}`}>
                      {BOT_NAMES[p.id] || p.id}
                    </span>
                  </div>
                  <span className={`font-bold ${
                    p.stack > 100 ? 'text-green-400' : p.stack < 100 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {fmt(p.stack)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* XP earned */}
        <div className="flex items-center justify-between bg-indigo-900/20 rounded-lg px-4 py-3 border border-indigo-700/20">
          <span className="text-sm text-indigo-300">XP 획득</span>
          <span className="text-lg font-bold text-indigo-400">+{xpEarned}</span>
        </div>

        {/* Spot Replay */}
        {result.history && result.history.length > 0 && (
          <MPSpotReplay history={result.history} />
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
