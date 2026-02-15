'use client';

import { useEffect, useRef, useState } from 'react';
import { DAILY_GOAL } from '@/data/constants';

type Props = {
  todayCount: number;
  isComplete: boolean;
  percentage: number;
  streak?: number;
};

export default function DailyGoal({ todayCount, isComplete, percentage, streak }: Props) {
  const [justCompleted, setJustCompleted] = useState(false);
  const prevComplete = useRef(isComplete);

  useEffect(() => {
    if (isComplete && !prevComplete.current) {
      setJustCompleted(true);
      const timer = setTimeout(() => setJustCompleted(false), 2000);
      prevComplete.current = true;
      return () => clearTimeout(timer);
    }
    prevComplete.current = isComplete;
  }, [isComplete]);

  const barColor = isComplete
    ? 'bg-amber-400'
    : percentage >= 50
      ? 'bg-green-500'
      : 'bg-amber-500';

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
      {isComplete && (
        <div className={`text-center py-2 bg-green-400/10 border border-green-400/20 rounded-lg mb-2.5 text-sm text-green-400 ${justCompleted ? 'animate-confetti-pop' : ''}`}>
          {justCompleted ? '🎉 ' : '✅ '}오늘 목표 달성! 대단해요!
        </div>
      )}
    </>
  );
}
