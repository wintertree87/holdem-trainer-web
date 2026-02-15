'use client';

import { useState, useCallback } from 'react';
import { SKILL_TREE } from '@/data/skill-tree';
import { generateRfiScenarios, generateFacingScenarios, generateVs3betScenarios, generateTestOutScenarios } from '@/utils/scenario';
import type { Scenario } from '@/data/skill-tree';
import type { LessonData } from '@/hooks/useProgress';

type LearnScreen = 'tree' | 'guide' | 'quiz' | 'result';

type LessonState = {
  scenarios: (Scenario & { quizType?: string; position?: string; hand?: string; vsPosition?: string })[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  maxErrors: number;
  totalHands: number;
};

type LessonResult = {
  passed: boolean;
  correct: number;
  total: number;
  wrong: number;
  xp: number;
};

type UseLessonFlowParams = {
  progress: Record<string, LessonData>;
  updateLesson: (lessonId: string, data: Partial<LessonData>) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  consumeHeart?: () => Promise<number>;
  canStartLesson?: boolean;
};

export function useLessonFlow({ progress, updateLesson, addXP, consumeHeart, canStartLesson = true }: UseLessonFlowParams) {
  const [learnScreen, setLearnScreen] = useState<LearnScreen>('tree');
  const [openUnitId, setOpenUnitId] = useState<number | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<number>(1);
  const [lessonState, setLessonState] = useState<LessonState | null>(null);
  const [lessonResult, setLessonResult] = useState<LessonResult | null>(null);
  const [testOutUnitId, setTestOutUnitId] = useState<number | null>(null);

  // Unit/lesson unlock logic
  const getUnitStatus = useCallback((unitId: number): 'locked' | 'current' | 'completed' => {
    const unit = SKILL_TREE.find(u => u.id === unitId)!;
    if (!unit) return 'locked';

    if (unitId === 0) {
      const allCompleted = unit.lessons.length > 0 && unit.lessons.every(l => (progress[l.id]?.crown || 0) >= 1);
      if (allCompleted) return 'completed';
      const hasLaterProgress = SKILL_TREE.some(u => u.id > 0 && u.lessons.some(l => (progress[l.id]?.crown || 0) >= 1));
      if (hasLaterProgress) return 'completed';
      return 'current';
    }

    const unitIndex = SKILL_TREE.findIndex(u => u.id === unitId);
    const prevUnit = unitIndex > 0 ? SKILL_TREE[unitIndex - 1] : null;
    if (!prevUnit) return 'locked';
    if (prevUnit.lessons.length === 0) return 'locked';

    const prevStatus = getUnitStatus(prevUnit.id);
    if (prevStatus !== 'completed') return 'locked';

    if (unit.lessons.length === 0) return 'current';
    const allCompleted = unit.lessons.every(l => (progress[l.id]?.crown || 0) >= 1);
    return allCompleted ? 'completed' : 'current';
  }, [progress]);

  const isLessonUnlocked = useCallback((unitId: number, lessonId: string): boolean => {
    const status = getUnitStatus(unitId);
    if (status === 'locked') return false;
    const unit = SKILL_TREE.find(u => u.id === unitId);
    if (!unit) return false;
    const lessonIdx = unit.lessons.findIndex(l => l.id === lessonId);
    if (lessonIdx === 0) return true;
    const prevLesson = unit.lessons[lessonIdx - 1];
    return (progress[prevLesson.id]?.crown || 0) >= 1;
  }, [getUnitStatus, progress]);

  const startLesson = useCallback((lessonId: string) => {
    const unit = SKILL_TREE.find(u => u.lessons.some(l => l.id === lessonId));
    if (!unit) return;
    const lesson = unit.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    setTestOutUnitId(null);
    setActiveLessonId(lessonId);
    setActiveUnitId(unit.id);
    setLearnScreen('guide');
  }, []);

  const startTestOut = useCallback((unitId: number) => {
    setTestOutUnitId(unitId);
    setActiveUnitId(unitId);
    setActiveLessonId(null);
    setLearnScreen('guide');
  }, []);

  const beginQuiz = useCallback(() => {
    if (!canStartLesson) return;
    if (testOutUnitId !== null) {
      const scenarios = generateTestOutScenarios(testOutUnitId);
      setLessonState({
        scenarios,
        currentIndex: 0,
        correctCount: 0,
        wrongCount: 0,
        maxErrors: 2,
        totalHands: 10,
      });
      setLearnScreen('quiz');
      return;
    }

    if (!activeLessonId) return;
    const unit = SKILL_TREE.find(u => u.lessons.some(l => l.id === activeLessonId));
    if (!unit) return;
    const lesson = unit.lessons.find(l => l.id === activeLessonId);
    if (!lesson) return;

    let scenarios: (Scenario & { quizType?: string; position?: string; hand?: string; vsPosition?: string })[];
    const warmup = (lesson.scenarios || []).map(s => ({ ...s, quizType: 'identify' as const }));

    if (lesson.quizType === 'rfi_dynamic' && lesson.positions) {
      const dynamicCount = Math.max(1, lesson.handCount - warmup.length);
      scenarios = [...warmup, ...generateRfiScenarios(lesson.positions, dynamicCount)];
    } else if (lesson.quizType === 'facing_dynamic' && lesson.positions) {
      const dynamicCount = Math.max(1, lesson.handCount - warmup.length);
      scenarios = [...warmup, ...generateFacingScenarios(lesson.positions, dynamicCount)];
    } else if (lesson.quizType === 'vs3bet_dynamic' && lesson.positions) {
      const dynamicCount = Math.max(1, lesson.handCount - warmup.length);
      scenarios = [...warmup, ...generateVs3betScenarios(lesson.positions, dynamicCount)];
    } else {
      scenarios = (lesson.scenarios || []).map(s => ({ ...s, quizType: lesson.quizType }));
    }

    setLessonState({
      scenarios,
      currentIndex: 0,
      correctCount: 0,
      wrongCount: 0,
      maxErrors: lesson.maxErrors,
      totalHands: scenarios.length,
    });
    setLearnScreen('quiz');
  }, [activeLessonId, testOutUnitId, canStartLesson]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (!isCorrect && consumeHeart) {
      consumeHeart();
    }
    setLessonState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        correctCount: prev.correctCount + (isCorrect ? 1 : 0),
        wrongCount: prev.wrongCount + (isCorrect ? 0 : 1),
      };
    });
  }, [consumeHeart]);

  const handleNext = useCallback(() => {
    setLessonState(prev => {
      if (!prev) return prev;
      const nextIndex = prev.currentIndex + 1;

      if (prev.wrongCount >= prev.maxErrors || nextIndex >= prev.totalHands) {
        const passed = prev.wrongCount < prev.maxErrors;
        const accuracy = Math.round((prev.correctCount / prev.totalHands) * 100);

        let xpEarned = 0;

        if (testOutUnitId !== null && passed) {
          const unit = SKILL_TREE.find(u => u.id === testOutUnitId);
          if (unit) {
            const today = new Date().toISOString().slice(0, 10);
            for (const lesson of unit.lessons) {
              const prevCrown = progress[lesson.id]?.crown || 0;
              if (prevCrown < 1) {
                updateLesson(lesson.id, {
                  crown: 1,
                  bestAccuracy: Math.max(progress[lesson.id]?.bestAccuracy || 0, accuracy),
                  attempts: (progress[lesson.id]?.attempts || 0) + 1,
                  lastAttempt: today,
                });
              }
            }
            xpEarned = unit.lessons.length * 10;
            addXP(xpEarned);
          }
        } else if (passed && activeLessonId) {
          const prevCrown = progress[activeLessonId]?.crown || 0;
          let newCrown = 1;
          if (prev.wrongCount === 0) newCrown = 3;
          else if (prev.wrongCount <= 1) newCrown = 2;

          if (newCrown > prevCrown) {
            xpEarned = newCrown === 3 ? 30 : newCrown === 2 ? 20 : 10;
          } else {
            xpEarned = 5;
          }

          updateLesson(activeLessonId, {
            crown: Math.max(prevCrown, newCrown),
            bestAccuracy: Math.max(progress[activeLessonId]?.bestAccuracy || 0, accuracy),
            attempts: (progress[activeLessonId]?.attempts || 0) + 1,
            lastAttempt: new Date().toISOString().slice(0, 10),
          });
          addXP(xpEarned);
        }

        setLessonResult({
          passed,
          correct: prev.correctCount,
          total: prev.totalHands,
          wrong: prev.wrongCount,
          xp: xpEarned,
        });
        setLearnScreen('result');
        return prev;
      }

      return { ...prev, currentIndex: nextIndex };
    });
  }, [activeLessonId, testOutUnitId, progress, updateLesson, addXP]);

  const abortLesson = useCallback(() => {
    setLearnScreen('tree');
    setActiveLessonId(null);
    setLessonState(null);
    setTestOutUnitId(null);
  }, []);

  const backToTree = useCallback(() => {
    setLearnScreen('tree');
    setActiveLessonId(null);
    setLessonState(null);
    setLessonResult(null);
    setTestOutUnitId(null);
  }, []);

  const toggleUnit = useCallback((id: number) => {
    setOpenUnitId(prev => prev === id ? null : id);
  }, []);

  // Derived values
  const activeUnit = SKILL_TREE.find(u => u.id === activeUnitId);
  const activeLesson = activeUnit?.lessons.find(l => l.id === activeLessonId);

  return {
    // Screen state
    learnScreen,
    // Unit/lesson state
    openUnitId,
    activeLessonId,
    activeUnitId,
    activeUnit,
    activeLesson,
    testOutUnitId,
    // Lesson progress
    lessonState,
    lessonResult,
    // Actions
    getUnitStatus,
    isLessonUnlocked,
    startLesson,
    startTestOut,
    beginQuiz,
    handleAnswer,
    handleNext,
    abortLesson,
    backToTree,
    toggleUnit,
  };
}
