'use client';

import { useState, useCallback, useEffect } from 'react';
import { SKILL_TREE } from '@/data/skill-tree';
import LessonQuiz from '@/components/learn/LessonQuiz';
import { isInAppBrowser, loginWithKakao, loginWithGoogle } from '@/lib/auth-helpers';

type Step = 'welcome' | 'quiz' | 'result';

// Unit 0, Lesson 0-1 ("홀덤 한 판의 흐름") 시나리오 재사용
const ONBOARDING_LESSON = SKILL_TREE[0].lessons[0];
const SCENARIOS = ONBOARDING_LESSON.scenarios!.map((s) => ({
  ...s,
  quizType: 'identify' as const,
}));

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [inApp, setInApp] = useState(false);
  const [loading, setLoading] = useState<'kakao' | 'google' | null>(null);

  // 퀴즈 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

  const lessonState = {
    scenarios: SCENARIOS,
    currentIndex,
    correctCount,
    wrongCount,
    maxErrors: 4,
    totalHands: SCENARIOS.length,
  };

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    } else {
      setWrongCount((c) => c + 1);
    }
  }, []);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= SCENARIOS.length) {
      // 로그인 후 온보딩에서 사용할 퀴즈 결과 저장
      const finalCorrect = correctCount;
      const finalWrong = wrongCount;
      localStorage.setItem('onboarding_quiz_result', JSON.stringify({
        lessonId: '0-1',
        correctCount: finalCorrect,
        wrongCount: finalWrong,
        timestamp: Date.now(),
      }));
      setStep('result');
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, correctCount, wrongCount]);

  const handleAbort = useCallback(() => {
    setStep('welcome');
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
  }, []);

  const handleKakao = () => {
    setLoading('kakao');
    try {
      loginWithKakao();
    } catch (error) {
      console.error('Kakao signup init failed:', error);
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading('google');
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google signup init failed:', error);
      setLoading(null);
    }
  };

  // (A) 환영 화면
  if (step === 'welcome') {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-sm w-full">
          <div className="text-7xl mb-5 animate-emoji-bounce">🃏</div>
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
            홀덤, 해본 적 있나요?
          </h1>
          <p className="text-gray-400 text-[15px] leading-relaxed mb-10">
            4문제만 풀어보세요. 30초면 끝나요.
          </p>

          <button
            onClick={() => setStep('quiz')}
            className="w-full py-3.5 px-6 bg-indigo-500 text-white rounded-xl font-semibold text-base cursor-pointer hover:bg-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            시작하기
          </button>

          <a
            href="/login"
            className="inline-block text-gray-500 text-sm mt-4 hover:text-gray-400 transition-colors"
          >
            이미 계정이 있어요 →
          </a>
        </div>
      </div>
    );
  }

  // (B) 퀴즈 화면
  if (step === 'quiz') {
    return (
      <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
        <LessonQuiz
          lessonState={lessonState}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onAbort={handleAbort}
        />
      </div>
    );
  }

  // (C) 결과 화면
  const accuracy = SCENARIOS.length > 0 ? Math.round((correctCount / SCENARIOS.length) * 100) : 0;
  const earnedXP = correctCount * 10;

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-black text-white mb-2">잘하셨어요!</h1>
        <p className="text-gray-400 text-base mb-6">
          {SCENARIOS.length}문제 중 {correctCount}문제 정답 ({accuracy}%)
        </p>

        <div className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-400 px-5 py-2.5 rounded-full text-lg font-bold mb-8">
          +{earnedXP} XP
        </div>

        <div className="space-y-3">
          <button
            onClick={handleKakao}
            disabled={loading !== null}
            className="w-full py-3.5 px-6 bg-[#FEE500] text-[#191919] rounded-xl font-semibold text-base flex items-center justify-center gap-3 cursor-pointer hover:bg-[#FDD800] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading === 'kakao' ? (
              <span className="inline-block w-5 h-5 border-2 border-[#191919]/30 border-t-[#191919] rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#191919" d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.16c-.1.36.31.65.63.44l4.94-3.26c.38.04.77.06 1.17.06 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
              </svg>
            )}
            {loading === 'kakao' ? '연결 중...' : '카카오로 가입하고 계속하기'}
          </button>

          {!inApp && (
            <button
              onClick={handleGoogle}
              disabled={loading !== null}
              className="w-full py-3.5 px-6 bg-white text-gray-900 rounded-xl font-semibold text-base flex items-center justify-center gap-3 cursor-pointer hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading === 'google' ? (
                <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {loading === 'google' ? '연결 중...' : 'Google로 가입하고 계속하기'}
            </button>
          )}

          <a
            href="/login"
            className="inline-block text-gray-500 text-sm mt-2 hover:text-gray-400 transition-colors"
          >
            나중에 하기 →
          </a>
        </div>
      </div>
    </div>
  );
}
