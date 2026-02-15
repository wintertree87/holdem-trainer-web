'use client';

import { useEffect, useRef, useState } from 'react';
import { Progress } from '@/components/ui/progress';

type Props = {
  currentLevel: { level: number; title: string };
  nextLevel?: { level: number; title: string; xpRequired: number };
  totalXP: number;
  progressPct: number;
};

export default function XPBar({ currentLevel, totalXP, progressPct }: Props) {
  const [glowing, setGlowing] = useState(false);
  const prevXP = useRef(totalXP);

  useEffect(() => {
    if (totalXP > prevXP.current) {
      setGlowing(true);
      const timer = setTimeout(() => setGlowing(false), 800);
      prevXP.current = totalXP;
      return () => clearTimeout(timer);
    }
    prevXP.current = totalXP;
  }, [totalXP]);

  return (
    <div className="flex items-center gap-3 px-1">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/20 text-xs font-black text-indigo-400">
          {currentLevel.level}
        </span>
        <span className="text-sm font-bold text-indigo-400 whitespace-nowrap">
          {currentLevel.title}
        </span>
      </div>
      <div className={`flex-1 relative ${glowing ? 'drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]' : ''} transition-all duration-300`}>
        <Progress value={progressPct} className="h-2" />
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div className="w-full h-full animate-shimmer" />
        </div>
      </div>
      <div className={`text-xs font-bold whitespace-nowrap transition-colors duration-300 ${glowing ? 'text-indigo-300' : 'text-gray-500'}`}>
        {totalXP} XP
      </div>
    </div>
  );
}
