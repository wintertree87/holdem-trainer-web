'use client';

import { Progress } from '@/components/ui/progress';
import { DAILY_GOAL } from '@/data/constants';

type Props = {
  todayCount: number;
  isComplete: boolean;
  percentage: number;
};

export default function DailyGoal({ todayCount, isComplete, percentage }: Props) {
  return (
    <>
      <div className="flex items-center gap-3 mb-2 px-1">
        <span className="text-xs text-gray-400">오늘</span>
        <div className="flex-1">
          <Progress value={percentage} className="h-2" />
        </div>
        <span className={`text-sm font-bold whitespace-nowrap ${isComplete ? 'text-green-400' : 'text-amber-400'}`}>
          {todayCount}/{DAILY_GOAL}
        </span>
      </div>
      {isComplete && (
        <div className="text-center py-2 bg-green-400/10 border border-green-400/20 rounded-lg mb-2.5 text-sm text-green-400">
          오늘 목표 달성! 대단해요!
        </div>
      )}
    </>
  );
}
