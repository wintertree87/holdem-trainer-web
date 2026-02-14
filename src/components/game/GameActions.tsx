'use client';

import { type GameAction } from '@/engine/pot-manager';

type Props = {
  actions: GameAction[];
  pot: number;
  onAction: (action: GameAction) => void;
  disabled: boolean;
};

function actionLabel(action: GameAction, pot: number): string {
  switch (action.type) {
    case 'fold': return '폴드';
    case 'check': return '체크';
    case 'call': return '콜';
    case 'allin': return '올인';
    case 'bet':
      if (action.amount <= pot / 3 + 0.5) return '1/3';
      if (action.amount <= pot * 2 / 3 + 0.5) return '2/3';
      return '팟';
    case 'raise':
      return `$${action.amount}`;
  }
}

function actionStyle(type: GameAction['type']): string {
  switch (type) {
    case 'fold':
      return 'bg-gray-700 hover:bg-gray-600 text-gray-200';
    case 'check':
      return 'bg-green-700 hover:bg-green-600 text-white';
    case 'call':
      return 'bg-blue-600 hover:bg-blue-500 text-white';
    case 'bet':
    case 'raise':
      return 'bg-orange-600 hover:bg-orange-500 text-white';
    case 'allin':
      return 'bg-red-600 hover:bg-red-500 text-white';
  }
}

export default function GameActions({ actions, pot, onAction, disabled }: Props) {
  if (disabled || actions.length === 0) {
    return (
      <div className="flex items-center justify-center h-12">
        <div className="text-gray-600 text-sm animate-pulse">상대 턴...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {actions.map((action, i) => (
        <button
          key={`${action.type}-${i}`}
          onClick={() => onAction(action)}
          className={`px-4 py-2.5 rounded-lg text-sm font-bold transition active:scale-95 ${actionStyle(action.type)}`}
        >
          {actionLabel(action, pot)}
        </button>
      ))}
    </div>
  );
}
