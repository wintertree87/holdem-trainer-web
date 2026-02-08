'use client';

import { RANKS } from '@/data/constants';
import { RFI_RANGES, FACING_RFI_RANGES, VS_3BET_RANGES } from '@/data/ranges';

type Props = {
  mode: 'rfi' | 'facing' | 'vs3bet';
  position: string;
  vsPosition?: string | null;
  currentHand?: string;
};

export default function RangeChart({ mode, position, vsPosition, currentHand }: Props) {
  let range: any;
  let title: string;

  if (mode === 'rfi') {
    range = RFI_RANGES[position];
    title = `${position} RFI 레인지 (${range?.percent || ''})`;
  } else if (mode === 'facing') {
    const key = `${position}_vs_${vsPosition}`;
    range = FACING_RFI_RANGES[key];
    title = `${position} vs ${vsPosition} (${range?.percent || ''})`;
  } else {
    const key = position === 'SB' ? 'SB_vs_BB_3bet' : `${position}_vs_3bet`;
    range = VS_3BET_RANGES[key];
    title = `${position} vs 3bet (${range?.percent || ''})`;
  }

  if (!range) return null;

  const getColor = (notation: string): string => {
    if (mode === 'rfi') {
      if (position === 'SB') {
        if (range.raiseValue?.includes(notation)) return 'bg-green-500 text-white';
        if (range.raiseBluff?.includes(notation)) return 'bg-red-500 text-white';
        if (range.limp?.includes(notation)) return 'bg-blue-500 text-white';
      } else {
        if (range.raise?.includes(notation)) return 'bg-green-500 text-white';
      }
    } else if (mode === 'facing') {
      if (range.value?.includes(notation)) return 'bg-green-500 text-white';
      if (range.bluff?.includes(notation)) return 'bg-red-500 text-white';
      if (range.call?.includes(notation)) return 'bg-blue-500 text-white';
    } else {
      if (range.fourBetValue?.includes(notation)) return 'bg-green-500 text-white';
      if (range.fourBetBluff?.includes(notation)) return 'bg-red-500 text-white';
      if (range.call?.includes(notation)) return 'bg-blue-500 text-white';
    }
    return 'bg-gray-700 text-gray-500';
  };

  const getLegend = () => {
    if (mode === 'rfi' && position === 'SB') {
      return [
        { color: 'bg-green-500', label: '밸류 레이즈' },
        { color: 'bg-red-500', label: '블러프 레이즈' },
        { color: 'bg-blue-500', label: '림프' },
        { color: 'bg-gray-700', label: '폴드' },
      ];
    }
    if (mode === 'rfi') {
      return [
        { color: 'bg-green-500', label: '레이즈' },
        { color: 'bg-gray-700', label: '폴드' },
      ];
    }
    if (mode === 'facing') {
      return [
        { color: 'bg-green-500', label: '밸류 3bet' },
        { color: 'bg-red-500', label: '블러프 3bet' },
        { color: 'bg-blue-500', label: '콜' },
        { color: 'bg-gray-700', label: '폴드' },
      ];
    }
    return [
      { color: 'bg-green-500', label: '밸류 4bet' },
      { color: 'bg-red-500', label: '블러프 4bet' },
      { color: 'bg-blue-500', label: '콜' },
      { color: 'bg-gray-700', label: '폴드' },
    ];
  };

  return (
    <div className="bg-white/5 rounded-xl p-3 mt-3 animate-slide-up">
      <div className="text-center text-sm font-bold text-amber-400 mb-2">{title}</div>
      <div className="grid grid-cols-13 gap-[2px] max-w-[400px] mx-auto">
        {RANKS.map((r1, i) =>
          RANKS.map((r2, j) => {
            let notation: string;
            if (i === j) notation = r1 + r2;
            else if (i < j) notation = r1 + r2 + 's';
            else notation = r2 + r1 + 'o';

            const isCurrent = notation === currentHand;
            return (
              <div
                key={`${i}-${j}`}
                className={`aspect-square flex items-center justify-center text-[8px] sm:text-[9px] font-bold rounded-[2px] ${getColor(notation)} ${isCurrent ? 'ring-2 ring-amber-400 z-10' : ''}`}
              >
                {notation}
              </div>
            );
          })
        )}
      </div>
      <div className="flex justify-center gap-3 mt-2 flex-wrap">
        {getLegend().map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-[2px] ${l.color}`} />
            <span className="text-[10px] text-gray-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
