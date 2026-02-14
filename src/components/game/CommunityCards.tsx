'use client';

import { type Card } from '@/data/constants';

type Props = {
  cards: Card[];
  street: string;
};

function CardDisplay({ card, delay = 0 }: { card: Card; delay?: number }) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      className="w-11 h-16 bg-white rounded-lg flex flex-col items-center justify-center shadow-md animate-card-deal"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`text-base font-bold leading-none ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        {card.rank}
      </span>
      <span className={`text-sm leading-none ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
        {card.suit}
      </span>
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
        <div key={`empty-${i}`} className="w-11 h-16 bg-white/5 rounded-lg border border-white/10" />
      ))}
    </div>
  );
}

export function HoleCards({ cards, faceDown = false }: { cards: Card[]; faceDown?: boolean }) {
  if (faceDown) {
    return (
      <div className="flex gap-1">
        <div className="w-10 h-14 bg-indigo-900 rounded-lg border border-indigo-700 flex items-center justify-center">
          <span className="text-indigo-500 text-xs">?</span>
        </div>
        <div className="w-10 h-14 bg-indigo-900 rounded-lg border border-indigo-700 flex items-center justify-center">
          <span className="text-indigo-500 text-xs">?</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {cards.map(card => {
        const isRed = card.suit === '♥' || card.suit === '♦';
        return (
          <div key={`${card.rank}${card.suit}`} className="w-10 h-14 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm">
            <span className={`text-sm font-bold leading-none ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
              {card.rank}
            </span>
            <span className={`text-xs leading-none ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
              {card.suit}
            </span>
          </div>
        );
      })}
    </div>
  );
}
