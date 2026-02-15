'use client';

import { useEffect } from 'react';
import { SKILL_TREE } from '@/data/skill-tree';
import { DAILY_GOAL } from '@/data/constants';
import type { LessonData } from '@/hooks/useProgress';
import type { WeekDay } from '@/hooks/useStreak';

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
  weekDays: WeekDay[];
  // 학습 진행
  progress: Record<string, LessonData>;
  // 모의게임
  gameStats: { wins: number; losses: number; ties: number; totalBbWon: number };
  // 오늘의 성과
  todayCount: number;
  // 가입일
  joinDate: string | null;
  // 효과음
  muted: boolean;
  onToggleMute: () => void;
  // 회원탈퇴
  onDeleteAccount?: () => void;
  // 하트
  hearts?: number;
  maxHearts?: number;
  nextRecoveryMs?: number | null;
};

export default function ProfileOverlay({
  onClose, onSignOut, email, nickname,
  totalXP, currentLevel,
  currentStreak, bestStreak, weekDays,
  progress, gameStats,
  todayCount, joinDate,
  muted, onToggleMute,
  onDeleteAccount,
  hearts, maxHearts = 5, nextRecoveryMs,
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

  // 정답률
  const withAccuracy = Object.values(progress).filter(p => p.bestAccuracy > 0);
  const avgAccuracy = withAccuracy.length > 0
    ? Math.round(withAccuracy.reduce((s, p) => s + p.bestAccuracy, 0) / withAccuracy.length)
    : 0;

  // 모의게임 전적
  const gTotal = gameStats.wins + gameStats.losses + gameStats.ties;
  const bbSign = gameStats.totalBbWon >= 0 ? '+' : '';

  // 오늘의 성과
  const dailyPercentage = Math.min(100, Math.round((todayCount / DAILY_GOAL) * 100));
  const isDailyComplete = todayCount >= DAILY_GOAL;

  // 가입일 포맷
  const joinDateText = joinDate
    ? new Date(joinDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

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

          {/* 프로필 카드 */}
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
            {joinDateText && (
              <div className="text-xs text-gray-600 mt-1">{joinDateText} 가입</div>
            )}
            {currentStreak >= 2 && (
              <div className="mt-1.5 text-sm font-bold text-orange-400">
                🔥 {currentStreak}일 연속 출석
                {bestStreak > currentStreak && (
                  <span className="text-xs text-gray-500 font-normal ml-2">최고 {bestStreak}일</span>
                )}
              </div>
            )}
          </div>

          {/* 오늘의 성과 */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-bold mb-3">🎯 오늘의 성과</div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-300">
                    오늘 학습 <span className="font-bold text-white">{todayCount}</span>/{DAILY_GOAL} 핸드
                  </span>
                  {isDailyComplete && <span className="text-xs text-green-400 font-bold">달성!</span>}
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isDailyComplete ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${dailyPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            {hearts !== undefined && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className="text-sm text-gray-300">❤️ 하트</span>
                <span className="text-sm font-bold text-white">{hearts}/{maxHearts}</span>
                {hearts < maxHearts && nextRecoveryMs != null && (
                  <span className="text-xs text-gray-500">
                    (다음 회복 {Math.ceil(nextRecoveryMs / 60000)}분)
                  </span>
                )}
              </div>
            )}
            {currentStreak >= 1 && (
              <div className="mt-2.5 text-sm text-orange-400">
                🔥 연속 출석 <span className="font-bold">{currentStreak}일</span>
                {bestStreak > currentStreak && (
                  <span className="text-xs text-gray-500 ml-2">최고 {bestStreak}일</span>
                )}
              </div>
            )}
          </div>

          {/* 누적 성과 */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-bold mb-3">📊 누적 성과</div>
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
            {gTotal > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-700/50 text-center">
                <div className="text-xs text-gray-400 font-bold mb-1.5">🎮 모의게임</div>
                <span className="text-sm text-gray-200">
                  {gTotal}전 <span className="text-green-400">{gameStats.wins}승</span> <span className="text-red-400">{gameStats.losses}패</span> {gameStats.ties > 0 && <span className="text-gray-400">{gameStats.ties}무</span>}
                </span>
                <span className="text-xs text-gray-500 ml-2">{bbSign}{gameStats.totalBbWon}bb</span>
              </div>
            )}
          </div>

          {/* 최근 7일 활동 */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-bold mb-3">📅 최근 7일 활동</div>
            <div className="flex justify-center gap-3">
              {weekDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                    day.done ? 'bg-green-500/30 text-green-400' : 'bg-white/5 text-gray-600'
                  }`}>
                    {day.done ? '●' : '○'}
                  </div>
                  <span className="text-[10px] text-gray-500">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 설정 */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-bold mb-3">⚙️ 설정</div>
            <div className="space-y-1">
              {/* 효과음 토글 */}
              <button
                onClick={onToggleMute}
                className="w-full flex items-center justify-between py-2.5 px-1 text-sm text-gray-300 hover:text-white transition cursor-pointer"
              >
                <span>{muted ? '🔇' : '🔊'} 효과음</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${muted ? 'bg-gray-700 text-gray-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  {muted ? 'OFF' : 'ON'}
                </span>
              </button>

              {/* 로그아웃 */}
              <button
                onClick={onSignOut}
                className="w-full flex items-center py-2.5 px-1 text-sm text-gray-500 hover:text-gray-300 transition cursor-pointer"
              >
                🚪 로그아웃
              </button>

              {/* 회원탈퇴 */}
              {onDeleteAccount && (
                <button
                  onClick={onDeleteAccount}
                  className="w-full flex items-center py-2.5 px-1 text-sm text-red-500/60 hover:text-red-400 transition cursor-pointer"
                >
                  ⚠️ 회원탈퇴
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
