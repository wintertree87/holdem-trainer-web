'use client';

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

type Props = {
  hearts: number;
  maxHearts: number;
  nextRecoveryMs: number | null;
  size?: 'sm' | 'md';
};

export default function HeartDisplay({ hearts, maxHearts, nextRecoveryMs, size = 'sm' }: Props) {
  const isFull = hearts >= maxHearts;
  const isEmpty = hearts <= 0;

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-1">
        <span className={`text-base ${isEmpty ? 'grayscale' : ''}`}>❤️</span>
        <span className={`text-sm font-bold ${isEmpty ? 'text-red-400' : 'text-gray-200'}`}>{hearts}</span>
        {!isFull && nextRecoveryMs !== null && (
          <span className="text-[10px] text-gray-500 ml-0.5">{formatTime(nextRecoveryMs)}</span>
        )}
      </div>
    );
  }

  // size === 'md'
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: maxHearts }, (_, i) => (
          <span key={i} className={`text-lg ${i < hearts ? '' : 'opacity-30'}`}>
            {i < hearts ? '❤️' : '🖤'}
          </span>
        ))}
      </div>
      {!isFull && nextRecoveryMs !== null && (
        <span className="text-xs text-gray-400 ml-1">{formatTime(nextRecoveryMs)}</span>
      )}
    </div>
  );
}
