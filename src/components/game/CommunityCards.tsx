'use client';

import { type Card } from '@/data/constants';

type Props = {
  cards: Card[];
  street: string;
};

function CardDisplay({ card, delay = 0 }: { card: Card; delay?: number }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  const color = isRed ? 'text-red-500' : 'text-gray-900';
  return (
    <div
      className="w-12 h-[68px] bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] animate-card-deal relative"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top-left corner pip */}
      <div className={`absolute top-1 left-1.5 flex flex-col items-center leading-none ${color}`}>
        <span className="text-[10px] font-bold">{card.rank}</span>
        <span className="text-[9px] -mt-0.5">{card.suit}</span>
      </div>
      {/* Center suit */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl ${color}`}>{card.suit}</span>
      </div>
      {/* Bottom-right corner pip (180° rotated) */}
      <div className={`absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180 ${color}`}>
        <span className="text-[10px] font-bold">{card.rank}</span>
        <span className="text-[9px] -mt-0.5">{card.suit}</span>
      </div>
    </div>
  );
}

export default function CommunityCards({ cards, street }: Props) {
  return (
    <div className="flex items-center justify-center gap-1.5 min-h-[72px]">
      {cards.length === 0 && (
        <div className="text-gray-600 text-xs">프리플랍</div>
      )}
      {cards.map((card, i) => (
        <CardDisplay key={`${card.rank}${card.suit}`} card={card} delay={i < 3 ? i * 100 : 0} />
      ))}
      {/* Empty card slots */}
      {Array.from({ length: 5 - cards.length }).map((_, i) => (
        <div key={`empty-${i}`} className="w-12 h-[68px] bg-white/5 rounded-lg border border-white/10" />
      ))}
    </div>
  );
}

export function HoleCards({ cards, faceDown = false }: { cards: Card[]; faceDown?: boolean }) {
  if (faceDown) {
    return (
      <div className="flex">
        <div className="w-11 h-[62px] bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg border border-blue-500/30 shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex items-center justify-center -rotate-3">
          <div className="w-7 h-10 rounded border border-blue-400/20 flex items-center justify-center">
            <span className="text-blue-400/30 text-lg">♦</span>
          </div>
        </div>
        <div className="w-11 h-[62px] bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg border border-blue-500/30 shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex items-center justify-center rotate-3 -ml-1">
          <div className="w-7 h-10 rounded border border-blue-400/20 flex items-center justify-center">
            <span className="text-blue-400/30 text-lg">♦</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      {cards.map((card, i) => {
        const isRed = card.suit === '♥' || card.suit === '♦';
        const color = isRed ? 'text-red-500' : 'text-gray-900';
        return (
          <div
            key={`${card.rank}${card.suit}`}
            className={`w-11 h-[62px] bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] relative ${
              i === 0 ? '-rotate-3' : 'rotate-3 -ml-1'
            }`}
          >
            <div className={`absolute top-0.5 left-1 flex flex-col items-center leading-none ${color}`}>
              <span className="text-[9px] font-bold">{card.rank}</span>
              <span className="text-[8px] -mt-0.5">{card.suit}</span>
            </div>
            <div className={`absolute inset-0 flex items-center justify-center ${color}`}>
              <span className="text-lg">{card.suit}</span>
            </div>
            <div className={`absolute bottom-0.5 right-1 flex flex-col items-center leading-none rotate-180 ${color}`}>
              <span className="text-[9px] font-bold">{card.rank}</span>
              <span className="text-[8px] -mt-0.5">{card.suit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
