'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SKILL_TREE } from '@/data/skill-tree';
import type { PracticeMatchResult } from '@/hooks/usePracticeGame';

type Props = {
  result: PracticeMatchResult;
  xpEarned: number;
  onClose: () => void;
};

export default function PracticeGameResult({ result, xpEarned, onClose }: Props) {
  const unit = SKILL_TREE.find(u => u.id === result.unitId);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    if (result.totalStackChange >= 0) {
      setTimeout(() => {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      }, 300);
    }
  }, [result.totalStackChange]);

  const totalBB = result.totalStackChange;
  const isPositive = totalBB >= 0;

  return (
    <div className="max-w-[450px] mx-auto mt-6 animate-slide-up">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{isPositive ? '🎯' : '📚'}</div>
        <div className="text-xl font-bold text-gray-200">실전 연습 완료!</div>
        <div className="text-sm text-gray-400 mt-1">
          {unit?.emoji} {unit?.title}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white/5 rounded-xl p-4 mb-4 text-center">
        <div className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{totalBB.toFixed(1)} BB
        </div>
        <div className="text-xs text-gray-500 mt-1">3핸드 합계</div>
        {xpEarned > 0 && (
          <div className="text-sm text-indigo-300 font-bold mt-2">+{xpEarned} XP</div>
        )}
      </div>

      {/* Hand Records */}
      <div className="space-y-3 mb-6">
        {result.hands.map((hand, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4 animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
            {/* Hand header */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-500">
                핸드 {hand.number} — {hand.heroPosition} vs {hand.botPosition}
              </div>
              <div className={`text-sm font-bold ${hand.heroStackChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {hand.heroStackChange >= 0 ? '+' : ''}{hand.heroStackChange.toFixed(1)} BB
              </div>
            </div>

            {/* Cards */}
            <div className="flex items-center gap-4 mb-3">
              {/* Hero hand */}
              <div>
                <div className="text-[10px] text-gray-500 mb-1">내 패</div>
                <div className="flex gap-1">
                  {hand.heroHand.map((card, j) => (
                    <div key={j} className={`w-10 h-14 bg-white rounded flex flex-col items-center justify-center text-xs font-bold ${
                      card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      <div>{card.rank}</div>
                      <div className="text-sm">{card.suit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community cards */}
              {hand.communityCards.length > 0 && (
                <div className="flex-1">
                  <div className="text-[10px] text-gray-500 mb-1">커뮤니티</div>
                  <div className="flex gap-0.5">
                    {hand.communityCards.map((card, j) => (
                      <div key={j} className={`w-8 h-11 bg-white/90 rounded flex flex-col items-center justify-center text-[10px] font-bold ${
                        card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-gray-800'
                      }`}>
                        <div>{card.rank}</div>
                        <div className="text-xs">{card.suit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bot hand */}
              <div>
                <div className="text-[10px] text-gray-500 mb-1">상대 패</div>
                <div className="flex gap-1">
                  {hand.botHand.map((card, j) => (
                    <div key={j} className={`w-10 h-14 bg-white rounded flex flex-col items-center justify-center text-xs font-bold ${
                      card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      <div>{card.rank}</div>
                      <div className="text-sm">{card.suit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Result */}
            {hand.result && (
              <div className="text-xs text-gray-500 mb-2">
                {hand.result.wonByFold
                  ? (hand.result.winner === 'hero' ? '상대 폴드로 승리' : '폴드')
                  : (hand.result.winner === 'hero'
                    ? `승리 — ${hand.result.heroHand?.name || ''}`
                    : hand.result.winner === 'bot'
                      ? `패배 — 상대: ${hand.result.botHand?.name || ''}`
                      : '무승부'
                  )
                }
              </div>
            )}

            {/* Coach comment */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
              <div className="text-[10px] text-indigo-400 font-bold mb-1">코치 해설</div>
              <div className="text-xs text-gray-300 leading-5 whitespace-pre-line">
                {hand.coachComment}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={onClose}
        className="w-full py-3.5 bg-indigo-500 rounded-xl text-white font-bold hover:bg-indigo-600 active:scale-[0.98] transition"
      >
        스킬 트리로
      </button>
    </div>
  );
}
