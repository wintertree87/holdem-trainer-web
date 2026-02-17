'use client';

import { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SKILL_TREE, CHAPTERS } from '@/data/skill-tree';
import { getPracticeGameConfig } from '@/data/practice-game-config';
import { useSound } from '@/hooks/useSound';
import ShareButton from '@/components/ShareButton';

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
  onStartPracticeGame?: (unitId: number) => void;
  isLessonUnlocked: (unitId: number, lessonId: string) => boolean;
  isTestOut?: boolean;
  levelTitle?: string;
  levelNumber?: number;
};

export default function LessonResult({ passed, correct, total, wrong, xp, lessonId, unitId, onStartLesson, onBackToTree, onStartPracticeGame, isLessonUnlocked, isTestOut, levelTitle, levelNumber }: Props) {
  const unit = SKILL_TREE.find(u => u.id === unitId);
  const isBossResult = unit?.isBoss ?? false;
  const chapter = isBossResult ? CHAPTERS.find(c => c.bossUnitId === unitId) : null;
  const lessonIdx = unit?.lessons.findIndex(l => l.id === lessonId) ?? -1;
  const nextLesson = unit?.lessons[lessonIdx + 1];
  // For boss: next unit is first unit of next chapter
  const unitIndex = SKILL_TREE.findIndex(u => u.id === unitId);
  const nextUnit = unitIndex >= 0 && unitIndex < SKILL_TREE.length - 1 ? SKILL_TREE[unitIndex + 1] : null;
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
          particleCount: isUnitClear ? 150 : isPerfect ? 120 : 60,
          spread: isUnitClear ? 100 : isPerfect ? 80 : 60,
          origin: { y: 0.6 },
          colors: isUnitClear ? ['#a855f7', '#6366f1', '#ffd700', '#fff'] : isPerfect ? ['#ffd700', '#ffaa00', '#fff'] : undefined,
          shapes: isUnitClear || isPerfect ? ['star', 'circle'] : undefined,
        });
        if (isUnitClear || isPerfect) {
          setTimeout(() => {
            confetti({
              particleCount: isUnitClear ? 100 : 80,
              spread: 100,
              origin: { y: 0.5 },
              colors: isUnitClear ? ['#a855f7', '#6366f1', '#ffd700'] : ['#ffd700', '#ffaa00', '#fff'],
              shapes: ['star'],
            });
          }, 400);
        }
      }, 500);
    }

    setTimeout(() => setShowXP(true), 300);
    setTimeout(() => setShowButtons(true), 800);
  }, [passed, wrong, playConfettiSound]);

  const shareUrl = 'https://holdem-trainer-web-yy8p.vercel.app?utm_source=share&utm_medium=lesson_result';
  const accuracy = Math.round((correct / total) * 100);
  const levelTag = levelTitle && levelNumber ? ` | Lv.${levelNumber} ${levelTitle}` : '';
  const unitName = unit?.title ?? '';
  const shareText = isTestOut
    ? `\uD83C\uDFC6 승급 성공! "${unitName}" 유닛 정복! 정답률 ${accuracy}%${levelTag}`
    : wrong === 0
      ? `\uD83C\uDF1F 퍼펙트! "${unitName}" 레슨 만점 클리어!${levelTag}`
      : `\uD83C\uDFAF 홀덤 트레이너에서 "${unitName}" 레슨 클리어! 정답률 ${accuracy}%${levelTag}`;

  // Detect unit completion (last lesson of non-boss unit, passed)
  const isUnitClear = passed && !isBossResult && !isTestOut && !nextLesson && unit && unit.lessons.length > 1;
  // Detect all-course completion (last unit, no next unit, passed)
  const isAllComplete = passed && !nextUnit && !nextLesson && !isBossResult && !isTestOut;

  const emoji = isAllComplete
    ? '👑'
    : isBossResult
    ? (passed ? '🏆' : '📚')
    : isTestOut
    ? (passed ? '🏆' : '📚')
    : isUnitClear
    ? '🎊'
    : (passed ? (wrong === 0 ? '🌟' : '🎉') : '💔');

  const title = isAllComplete
    ? '전 코스 클리어!'
    : isBossResult
    ? (passed ? `${chapter?.title || '챕터'} 클리어!` : '아쉽지만 다음에...')
    : isTestOut
    ? (passed ? '승급 성공!' : '아쉽지만 다음에...')
    : isUnitClear
    ? '유닛 클리어!'
    : (passed ? (wrong === 0 ? '퍼펙트!' : '레슨 완료!') : '이번엔 아쉬웠어요');

  const subtitle = isAllComplete
    ? '축하합니다! 모든 챕터를 정복했습니다. 당신은 진정한 홀덤 고수!'
    : isBossResult
    ? (passed ? `${chapter?.title || ''} 챕터를 정복했습니다!` : '한 판 한 판 경험을 쌓으면 돼요!')
    : isTestOut
    ? (passed ? '유닛의 모든 레슨이 완료되었습니다' : '한 판 한 판 경험을 쌓으면 돼요!')
    : isUnitClear
    ? `"${unit?.title}" 유닛을 정복했습니다!`
    : (!passed ? '아쉬운 판이었지만, 다음엔 더 잘할 수 있어요!' : null);

  return (
    <div className="max-w-[400px] mx-auto mt-10 text-center">
      {/* Emoji */}
      <div className={`text-6xl mb-4 ${passed ? 'animate-emoji-bounce' : 'animate-shake'}`}>
        {emoji}
      </div>

      {/* Title */}
      <div className={`text-2xl font-bold mb-2 animate-slide-up ${passed ? (isTestOut ? 'text-amber-400' : 'text-green-400') : 'text-red-400'}`}>
        {title}
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

      {/* Subtitle / encouragement */}
      {subtitle && (
        <div className="text-sm text-gray-500 mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {subtitle}
        </div>
      )}

      {/* Buttons with delayed entrance */}
      {showButtons && (
        <div className="flex flex-col gap-2.5 animate-slide-up">
          {isTestOut ? (
            <>
              {passed && nextUnit && nextUnit.lessons.length > 0 && (
                <button onClick={() => onStartLesson(nextUnit.lessons[0].id)} className="py-3.5 px-5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition">
                  다음 유닛: {nextUnit.title}
                </button>
              )}
              {passed && <ShareButton text={shareText} url={shareUrl} />}
              <button onClick={onBackToTree} className="py-3.5 px-5 bg-gray-700 rounded-xl text-gray-200 text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition">
                스킬 트리로
              </button>
            </>
          ) : (
            <>
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
              {passed && !nextLesson && onStartPracticeGame && getPracticeGameConfig(unitId) && (
                <button onClick={() => onStartPracticeGame(unitId)} className="py-3.5 px-5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition">
                  🎯 실전 연습 (3핸드)
                </button>
              )}
              {passed && <ShareButton text={shareText} url={shareUrl} />}
              {!passed && (
                <button onClick={() => onStartLesson(lessonId)} className="py-3.5 px-5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition animate-pulse-button">
                  다시 도전
                </button>
              )}
              <button onClick={onBackToTree} className="py-3.5 px-5 bg-gray-700 rounded-xl text-gray-200 text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition">
                스킬 트리로
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
