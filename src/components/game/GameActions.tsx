'use client';

import { type GameAction } from '@/engine/pot-manager';

type Props = {
  actions: GameAction[];
  pot: number;
  heroStack: number;
  callAmount: number;
  onAction: (action: GameAction) => void;
  disabled: boolean;
};

function fmt(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(1)}`;
}

function actionLabel(action: GameAction, pot: number, heroStack: number, callAmount: number): string {
  switch (action.type) {
    case 'fold': return '폴드';
    case 'check': return '체크';
    case 'call': return `콜 ${fmt(callAmount)}`;
    case 'allin': return `올인 ${fmt(heroStack)}`;
    case 'bet': {
      if (action.amount <= pot / 3 + 0.5) return `1/3팟 · ${fmt(action.amount)}`;
      if (action.amount <= pot * 2 / 3 + 0.5) return `2/3팟 · ${fmt(action.amount)}`;
      return `팟 · ${fmt(action.amount)}`;
    }
    case 'raise':
      return `레이즈 ${fmt(action.amount)}`;
  }
}

function actionStyle(type: GameAction['type']): string {
  switch (type) {
    case 'fold':
      return 'bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 text-xs';
    case 'check':
      return 'bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white';
    case 'call':
      return 'bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white';
    case 'bet':
    case 'raise':
      return 'bg-gradient-to-b from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white';
    case 'allin':
      return 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse-subtle';
  }
}

export default function GameActions({ actions, pot, heroStack, callAmount, onAction, disabled }: Props) {
  if (disabled || actions.length === 0) {
    return (
      <div className="flex items-center justify-center h-12">
        <div className="text-gray-600 text-sm animate-pulse">🤖 상대가 생각 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {actions.map((action, i) => (
        <button
          key={`${action.type}-${i}`}
          onClick={() => onAction(action)}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-lg active:scale-95 ${actionStyle(action.type)}`}
        >
          {actionLabel(action, pot, heroStack, callAmount)}
        </button>
      ))}
    </div>
  );
}
