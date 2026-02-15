'use client';

import { useEffect, useRef, useState } from 'react';
import { DAILY_GOAL } from '@/data/constants';

type Props = {
  todayCount: number;
  isComplete: boolean;
  percentage: number;
  streak?: number;
  justCheckedIn?: boolean;
};

export default function DailyGoal({ todayCount, isComplete, percentage, streak, justCheckedIn }: Props) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
  const prevComplete = useRef(isComplete);
  const prevCount = useRef(todayCount);

  // 일일 목표 달성 축하
  useEffect(() => {
    if (isComplete && !prevComplete.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 2000);
      prevComplete.current = true;
      return () => clearTimeout(timer);
    }
    prevComplete.current = isComplete;
  }, [isComplete]);

  // 오늘 첫 출석 축하 (todayCount가 0→1로 변하는 순간)
  useEffect(() => {
    if (todayCount === 1 && prevCount.current === 0) {
      setShowCheckin(true);
      const timer = setTimeout(() => setShowCheckin(false), 4000);
      prevCount.current = todayCount;
      return () => clearTimeout(timer);
    }
    prevCount.current = todayCount;
  }, [todayCount]);

  const barColor = isComplete
    ? 'bg-amber-400'
    : percentage >= 50
      ? 'bg-green-500'
      : 'bg-amber-500';

  const streakMsg = streak && streak >= 2
    ? `🔥 ${streak}일 연속! 내일도 이어가요!`
    : '🔥 오늘 출석 완료! 내일도 와서 연속 기록을 만들어요!';

  return (
    <>
      <div className="flex items-center gap-3 mb-2 px-1">
        <span className="text-xs text-gray-400">오늘</span>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <span className={`text-sm font-bold whitespace-nowrap transition-colors ${isComplete ? 'text-amber-400' : 'text-amber-500'}`}>
          {todayCount}/{DAILY_GOAL}
        </span>
        {streak !== undefined && streak >= 2 && (
          <span className="text-xs font-bold text-orange-400 whitespace-nowrap">
            🔥 {streak}일
          </span>
        )}
      </div>

      {/* 오늘 첫 출석 축하 */}
      {showCheckin && !isComplete && (
        <div className="text-center py-2 bg-orange-400/10 border border-orange-400/20 rounded-lg mb-2.5 text-sm text-orange-400 animate-confetti-pop">
          {streakMsg}
        </div>
      )}

      {/* 일일 목표 달성 */}
      {isComplete && (
        <div className={`text-center py-2 bg-green-400/10 border border-green-400/20 rounded-lg mb-2.5 text-sm text-green-400 ${justCompleted ? 'animate-confetti-pop' : ''}`}>
          {justCompleted ? '🎉 ' : '✅ '}오늘 목표 달성! 대단해요!
        </div>
      )}
    </>
  );
}
