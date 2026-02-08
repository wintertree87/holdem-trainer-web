'use client';

import { Progress } from '@/components/ui/progress';

type Props = {
  currentLevel: { level: number; title: string };
  nextLevel?: { level: number; title: string; xpRequired: number };
  totalXP: number;
  progressPct: number;
};

export default function XPBar({ currentLevel, totalXP, progressPct }: Props) {
  return (
    <div className="flex items-center gap-3 mb-3 px-1">
      <div className="text-sm font-bold text-indigo-400 whitespace-nowrap">
        Lv.{currentLevel.level} {currentLevel.title}
      </div>
      <div className="flex-1">
        <Progress value={progressPct} className="h-2" />
      </div>
      <div className="text-xs text-gray-500 whitespace-nowrap">{totalXP} XP</div>
    </div>
  );
}
