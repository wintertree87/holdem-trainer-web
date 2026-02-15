'use client';

import { useEffect } from 'react';
import { SKILL_TREE } from '@/data/skill-tree';
import type { LessonData } from '@/hooks/useProgress';

type Props = {
  onClose: () => void;
  onSignOut: () => void;
  email: string;
  nickname: string;
  // XP
  totalXP: number;
  currentLevel: { level: number; title: string };
  // Streak
  currentStreak: number;
  bestStreak: number;
  weekDays: boolean[]; // 최근 7일 (월→일)
  // 학습 진행
  progress: Record<string, LessonData>;
  // 모의게임
  gameStats: { wins: number; losses: number; ties: number; totalBbWon: number };
};

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export default function ProfileOverlay({
  onClose, onSignOut, email, nickname,
  totalXP, currentLevel,
  currentStreak, bestStreak, weekDays,
  progress, gameStats,
}: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 학습 현황 계산
  const totalUnits = SKILL_TREE.length;
  const totalLessons = SKILL_TREE.reduce((sum, u) => sum + u.lessons.length, 0);
  const completedLessons = Object.values(progress).filter(p => p.crown >= 1).length;
  const completedUnits = SKILL_TREE.filter(u =>
    u.lessons.length > 0 && u.lessons.every(l => (progress[l.id]?.crown || 0) >= 1)
  ).length;

  // 정답률 (lesson progress 기반)
  const totalAttempts = Object.values(progress).reduce((s, p) => s + p.attempts, 0);
  const avgAccuracy = totalAttempts > 0
    ? Math.round(Object.values(progress).filter(p => p.bestAccuracy > 0).reduce((s, p) => s + p.bestAccuracy, 0)
      / Object.values(progress).filter(p => p.bestAccuracy > 0).length)
    : 0;

  // 모의게임 전적
  const gTotal = gameStats.wins + gameStats.losses + gameStats.ties;
  const bbSign = gameStats.totalBbWon >= 0 ? '+' : '';

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm cursor-pointer">
          &larr; 돌아가기
        </button>
        <span className="font-bold text-gray-200 text-sm">마이페이지</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="max-w-[400px] mx-auto space-y-5">

          {/* 프로필 */}
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-3 flex items-center justify-center text-2xl">
              {nickname.charAt(0).toUpperCase()}
            </div>
            <div className="font-bold text-gray-200 text-lg">{nickname}</div>
            <div className="text-xs text-gray-500 mt-0.5">{email}</div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-sm font-bold text-indigo-400">Lv.{currentLevel.level} {currentLevel.title}</span>
              <span className="text-xs text-gray-500">{totalXP} XP</span>
            </div>
            {currentStreak >= 2 && (
              <div className="mt-1.5 text-sm font-bold text-orange-400">
                🔥 {currentStreak}일 연속 출석
                {bestStreak > currentStreak && (
                  <span className="text-xs text-gray-500 font-normal ml-2">최고 {bestStreak}일</span>
                )}
              </div>
            )}
          </div>

          {/* 학습 현황 */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-bold mb-3">📊 학습 현황</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-white">{completedUnits}<span className="text-xs text-gray-500 font-normal">/{totalUnits}</span></div>
                <div className="text-[10px] text-gray-500">유닛 완료</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{completedLessons}<span className="text-xs text-gray-500 font-normal">/{totalLessons}</span></div>
                <div className="text-[10px] text-gray-500">레슨 완료</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{avgAccuracy}<span className="text-xs text-gray-500 font-normal">%</span></div>
                <div className="text-[10px] text-gray-500">평균 정답률</div>
              </div>
            </div>
          </div>

          {/* 모의게임 전적 */}
          {gTotal > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-xs text-gray-400 font-bold mb-3">🎮 모의게임 전적</div>
              <div className="text-center">
                <span className="text-sm text-gray-200">
                  {gTotal}전 <span className="text-green-400">{gameStats.wins}승</span> <span className="text-red-400">{gameStats.losses}패</span> {gameStats.ties > 0 && <span className="text-gray-400">{gameStats.ties}무</span>}
                </span>
                <span className="text-xs text-gray-500 ml-2">{bbSign}{gameStats.totalBbWon}bb</span>
              </div>
            </div>
          )}

          {/* 이번 주 활동 */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-bold mb-3">📅 이번 주 활동</div>
            <div className="flex justify-center gap-3">
              {weekDays.map((done, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    done ? 'bg-green-500/30 text-green-400' : 'bg-white/5 text-gray-600'
                  }`}>
                    {done ? '●' : '○'}
                  </div>
                  <span className="text-[10px] text-gray-500">{DAY_LABELS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 로그아웃 */}
          <button
            onClick={onSignOut}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-300 transition cursor-pointer"
          >
            🚪 로그아웃
          </button>

        </div>
      </div>
    </div>
  );
}
