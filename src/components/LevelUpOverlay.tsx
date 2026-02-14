'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export default function LevelUpOverlay({ newLevel, onDismiss, playLevelUp }: {
  newLevel: { level: number; title: string };
  onDismiss: () => void;
  playLevelUp: () => void;
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    playLevelUp();
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#ffd700', '#ffaa00', '#fff', '#6366f1'],
        shapes: ['star', 'circle'],
      });
    }, 300);

    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss, playLevelUp]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div className="text-center" onClick={e => e.stopPropagation()}>
        <div className="text-6xl mb-4 animate-emoji-bounce">🏆</div>
        <div className="text-3xl font-black text-amber-400 animate-level-up-text mb-2">
          LEVEL UP!
        </div>
        <div className="text-xl font-bold text-white animate-slide-up" style={{ animationDelay: '0.3s' }}>
          Lv.{newLevel.level} {newLevel.title}
        </div>
        <div className="text-sm text-gray-400 mt-4 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          탭하여 계속
        </div>
      </div>
    </div>
  );
}
