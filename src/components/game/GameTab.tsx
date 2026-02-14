'use client';

import { GAME_TIERS, type GameTier } from '@/data/game-config';

type GameStats = {
  tier: string;
  wins: number;
  losses: number;
  ties: number;
  totalBbWon: number;
};

type Props = {
  getUnitStatus: (unitId: number) => 'locked' | 'current' | 'completed';
  onStartMatch: (tier: GameTier) => void;
  gameStats: GameStats[];
};

export default function GameTab({ getUnitStatus, onStartMatch, gameStats }: Props) {
  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-400">1v1 봇 대전으로 실전 감각을 키우세요</p>
      </div>

      {GAME_TIERS.map(tier => {
        const unlocked = getUnitStatus(tier.unlockUnitId) === 'completed';
        const stats = gameStats.find(s => s.tier === tier.id);
        const totalGames = stats ? stats.wins + stats.losses + stats.ties : 0;

        return (
          <div
            key={tier.id}
            className={`rounded-xl p-4 border transition-all ${
              unlocked
                ? 'bg-white/5 border-white/10 hover:border-indigo-400/50'
                : 'bg-white/[0.02] border-white/5 opacity-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tier.emoji}</span>
                <div>
                  <div className="font-bold text-gray-200 text-sm">{tier.name}</div>
                  <div className="text-xs text-gray-500">{tier.description}</div>
                </div>
              </div>
              {!unlocked && (
                <div className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded">
                  🔒 유닛 {tier.unlockUnitId} 완료 필요
                </div>
              )}
            </div>

            {unlocked && (
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-3 text-xs text-gray-400">
                  {totalGames > 0 ? (
                    <>
                      <span className="text-green-400">{stats!.wins}승</span>
                      <span className="text-red-400">{stats!.losses}패</span>
                      {stats!.ties > 0 && <span className="text-gray-400">{stats!.ties}무</span>}
                      <span className={stats!.totalBbWon >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {stats!.totalBbWon >= 0 ? '+' : '-'}${Math.abs(stats!.totalBbWon).toFixed(0)}
                      </span>
                    </>
                  ) : (
                    <span>전적 없음</span>
                  )}
                </div>
                <button
                  onClick={() => onStartMatch(tier)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white text-sm font-bold transition active:scale-95"
                >
                  대전 시작
                </button>
              </div>
            )}
          </div>
        );
      })}

      <div className="text-center text-xs text-gray-600 mt-4 pt-3 border-t border-white/5">
        매치당 10핸드 · $100 딥스택 · 승리 시 XP 보너스
      </div>
    </div>
  );
}
