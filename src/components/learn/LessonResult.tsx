'use client';

import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SKILL_TREE } from '@/data/skill-tree';
import { useSound } from '@/hooks/useSound';

type Props = {
  passed: boolean;
  correct: number;
  total: number;
  wrong: number;
  xp: number;
  lessonId: string;
  unitId: number;
  onStartLesson: (lessonId: string) => void;
  onBackToTree: () => void;
  isLessonUnlocked: (unitId: number, lessonId: string) => boolean;
};

export default function LessonResult({ passed, correct, total, wrong, xp, lessonId, unitId, onStartLesson, onBackToTree, isLessonUnlocked }: Props) {
  const unit = SKILL_TREE.find(u => u.id === unitId);
  const lessonIdx = unit?.lessons.findIndex(l => l.id === lessonId) ?? -1;
  const nextLesson = unit?.lessons[lessonIdx + 1];
  const nextUnit = SKILL_TREE.find(u => u.id === unitId + 1);
  const [showButtons, setShowButtons] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const firedRef = useRef(false);
  const { playConfetti: playConfettiSound } = useSound();

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    if (passed) {
      const isPerfect = wrong === 0;
      setTimeout(() => {
        playConfettiSound();
        confetti({
          particleCount: isPerfect ? 120 : 60,
          spread: isPerfect ? 80 : 60,
          origin: { y: 0.6 },
          colors: isPerfect ? ['#ffd700', '#ffaa00', '#fff'] : undefined,
          shapes: isPerfect ? ['star', 'circle'] : undefined,
        });
        if (isPerfect) {
          setTimeout(() => {
            confetti({
              particleCount: 80,
              spread: 100,
              origin: { y: 0.5 },
              colors: ['#ffd700', '#ffaa00', '#fff'],
              shapes: ['star'],
            });
          }, 400);
        }
      }, 500);
    }

    setTimeout(() => setShowXP(true), 300);
    setTimeout(() => setShowButtons(true), 800);
  }, [passed, wrong, playConfettiSound]);

  const emoji = passed ? (wrong === 0 ? '🌟' : '🎉') : '💔';

  return (
    <div className="max-w-[400px] mx-auto mt-10 text-center">
      {/* Emoji */}
      <div className={`text-6xl mb-4 ${passed ? 'animate-emoji-bounce' : 'animate-shake'}`}>
        {emoji}
      </div>

      {/* Title */}
      <div className={`text-2xl font-bold mb-2 animate-slide-up ${passed ? 'text-green-400' : 'text-red-400'}`}>
        {passed ? (wrong === 0 ? '퍼펙트!' : '레슨 완료!') : '다시 도전하세요!'}
      </div>

      {/* Accuracy */}
      <div className="text-sm text-gray-400 mb-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        정답 {correct}/{total} ({Math.round((correct / total) * 100)}%)
      </div>

      {/* XP with float animation */}
      {xp > 0 && showXP && (
        <div className="relative h-8 mb-6">
          <div className="text-lg font-bold text-indigo-300 animate-slide-up">+{xp} XP</div>
          <div className="absolute inset-0 flex justify-center">
            <span className="text-lg font-bold text-indigo-300/60 animate-xp-float">+{xp} XP</span>
          </div>
        </div>
      )}

      {/* Failure encouragement */}
      {!passed && (
        <div className="text-sm text-gray-500 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          괜찮아요! 실수에서 배우는 거예요. 다시 한번!
        </div>
      )}

      {/* Buttons with delayed entrance */}
      {showButtons && (
        <div className="flex flex-col gap-2.5 animate-slide-up">
          {passed && nextLesson && isLessonUnlocked(unitId, nextLesson.id) && (
            <button onClick={() => onStartLesson(nextLesson.id)} className="py-3.5 px-5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition">
              다음 레슨
            </button>
          )}
          {passed && !nextLesson && nextUnit && nextUnit.lessons.length > 0 && isLessonUnlocked(nextUnit.id, nextUnit.lessons[0].id) && (
            <button onClick={() => onStartLesson(nextUnit.lessons[0].id)} className="py-3.5 px-5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition">
              다음 유닛: {nextUnit.title}
            </button>
          )}
          {!passed && (
            <button onClick={() => onStartLesson(lessonId)} className="py-3.5 px-5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition animate-pulse-button">
              다시 도전
            </button>
          )}
          <button onClick={onBackToTree} className="py-3.5 px-5 bg-gray-700 rounded-xl text-gray-200 text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition">
            스킬 트리로
          </button>
        </div>
      )}
    </div>
  );
}
