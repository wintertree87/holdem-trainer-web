'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type QuizResult = {
  lessonId: string;
  correctCount: number;
  wrongCount: number;
  timestamp: number;
};

type Props = {
  onComplete: (startLessonId?: string) => void;
  addXP: (amount: number) => Promise<void>;
  updateLesson: (lessonId: string, data: { crown: number; bestAccuracy: number; attempts: number; lastAttempt: string }) => Promise<void>;
  markOnboardingCompleted: () => Promise<void>;
};

const FEATURES = [
  {
    emoji: '🎯',
    title: '학습',
    desc: '스킬 트리를 따라\n단계별로 배워요',
    sub: '12유닛 · 41레슨',
  },
  {
    emoji: '🔥',
    title: '자유연습',
    desc: '원하는 상황을 골라\n무한 연습해요',
    sub: 'RFI · 3bet · C-bet 등',
  },
  {
    emoji: '🎮',
    title: '게임',
    desc: '봇과 1:1 대전\n실전 감각을 키워요',
    sub: '3단계 티어',
  },
];

export default function PostLoginOnboarding({ onComplete, addXP, updateLesson, markOnboardingCompleted }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [featureIndex, setFeatureIndex] = useState(0);
  const [xpApplied, setXpApplied] = useState(false);
  const touchStartX = useRef(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Step 1: localStorage에서 온보딩 퀴즈 결과 읽기 + XP/크라운 적용
  useEffect(() => {
    const raw = localStorage.getItem('onboarding_quiz_result');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as QuizResult;
        // 24시간 이내 결과만 유효
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setQuizResult(parsed);
        }
      } catch {
        // 파싱 실패 무시
      }
    }
  }, []);

  // XP + 크라운 DB 반영 (한 번만)
  useEffect(() => {
    if (!quizResult || xpApplied) return;
    setXpApplied(true);

    const { wrongCount, correctCount } = quizResult;
    const total = correctCount + wrongCount;

    // 크라운 계산 (useLessonFlow와 동일)
    let crown = 0;
    if (wrongCount === 0) crown = 3;
    else if (wrongCount === 1) crown = 2;
    else if (wrongCount <= 3) crown = 1;

    // XP 계산
    const xp = crown === 3 ? 30 : crown === 2 ? 20 : crown === 1 ? 10 : 0;

    if (crown > 0) {
      const accuracy = Math.round((correctCount / total) * 100);
      updateLesson(quizResult.lessonId, {
        crown,
        bestAccuracy: accuracy,
        attempts: 1,
        lastAttempt: new Date().toISOString().slice(0, 10),
      });
    }
    if (xp > 0) {
      addXP(xp);
    }

    localStorage.removeItem('onboarding_quiz_result');
  }, [quizResult, xpApplied, addXP, updateLesson]);

  // 캐러셀 스와이프
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && featureIndex < FEATURES.length - 1) {
        setFeatureIndex(i => i + 1);
      } else if (diff < 0 && featureIndex > 0) {
        setFeatureIndex(i => i - 1);
      }
    }
  }, [featureIndex]);

  // 완료 처리
  const handleFinish = useCallback(async (startLessonId?: string) => {
    await markOnboardingCompleted();
    onComplete(startLessonId);
  }, [markOnboardingCompleted, onComplete]);

  // 건너뛰기
  const handleSkip = useCallback(async () => {
    await markOnboardingCompleted();
    onComplete();
  }, [markOnboardingCompleted, onComplete]);

  const nextLessonId = quizResult ? '0-2' : '0-1';
  const nextLessonName = quizResult ? '패의 서열' : '홀덤 한 판의 흐름';

  // --- Step 1: 환영 + XP ---
  if (step === 1) {
    const xpEarned = quizResult
      ? (quizResult.wrongCount === 0 ? 30 : quizResult.wrongCount === 1 ? 20 : quizResult.wrongCount <= 3 ? 10 : 0)
      : 0;
    const total = quizResult ? quizResult.correctCount + quizResult.wrongCount : 0;

    return (
      <div className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center px-4">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-300 transition"
        >
          건너뛰기
        </button>
        <div className="text-center max-w-sm w-full">
          {quizResult ? (
            <>
              <div className="text-7xl mb-5 animate-emoji-bounce">🎉</div>
              <h1 className="text-2xl font-black text-white mb-2">환영합니다!</h1>
              <p className="text-gray-400 text-base mb-4">
                온보딩 {total}문제 중 {quizResult.correctCount}문제 정답!
              </p>
              {xpEarned > 0 && (
                <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-400 px-5 py-2.5 rounded-full text-lg font-bold mb-8">
                  +{xpEarned} XP 획득
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-7xl mb-5 animate-emoji-bounce">🃏</div>
              <h1 className="text-2xl font-black text-white mb-2">환영합니다!</h1>
              <p className="text-gray-400 text-base mb-8">
                홀덤 실력, 여기서 키워볼까요?
              </p>
            </>
          )}
          <button
            onClick={() => setStep(2)}
            className="w-full py-3.5 px-6 bg-indigo-500 text-white rounded-xl font-semibold text-base hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {quizResult ? '계속하기' : '시작하기'}
          </button>
        </div>
      </div>
    );
  }

  // --- Step 2: 기능 소개 캐러셀 ---
  if (step === 2) {
    const feature = FEATURES[featureIndex];
    const isLast = featureIndex === FEATURES.length - 1;

    return (
      <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col items-center justify-center px-4">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-sm text-gray-500 hover:text-gray-300 transition"
        >
          건너뛰기
        </button>

        <div
          ref={carouselRef}
          className="text-center max-w-sm w-full flex-1 flex flex-col justify-center"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="text-7xl mb-4">{feature.emoji}</div>
          <h2 className="text-2xl font-black text-white mb-3">{feature.title}</h2>
          <p className="text-gray-300 text-base whitespace-pre-line leading-relaxed mb-2">
            {feature.desc}
          </p>
          <p className="text-gray-500 text-sm mb-8">{feature.sub}</p>

          {/* 도트 인디케이터 */}
          <div className="flex justify-center gap-2 mb-8">
            {FEATURES.map((_, i) => (
              <button
                key={i}
                onClick={() => setFeatureIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === featureIndex ? 'bg-indigo-500 scale-110' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={() => setStep(3)}
              className="w-full py-3.5 px-6 bg-indigo-500 text-white rounded-xl font-semibold text-base hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              다음
            </button>
          ) : (
            <button
              onClick={() => setFeatureIndex(i => i + 1)}
              className="w-full py-3.5 px-6 bg-white/10 text-white rounded-xl font-semibold text-base hover:bg-white/15 active:scale-[0.98] transition-all"
            >
              다음
            </button>
          )}
        </div>
      </div>
    );
  }

  // --- Step 3: 첫 레슨 CTA ---
  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-5">✨</div>
        <h1 className="text-2xl font-black text-white mb-8">준비 완료!</h1>

        <button
          onClick={() => handleFinish(nextLessonId)}
          className="w-full py-3.5 px-6 bg-indigo-500 text-white rounded-xl font-semibold text-base hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all mb-3"
        >
          {nextLessonId} {nextLessonName} 시작하기
        </button>
        <button
          onClick={() => handleFinish()}
          className="text-gray-500 text-sm hover:text-gray-300 transition"
        >
          스킬 트리 둘러보기
        </button>
      </div>
    </div>
  );
}
