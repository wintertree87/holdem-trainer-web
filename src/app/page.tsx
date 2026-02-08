'use client';

import { useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { useProgress } from '@/hooks/useProgress';
import { useXP } from '@/hooks/useXP';
import { useStats } from '@/hooks/useStats';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import { useWrongNotes } from '@/hooks/useWrongNotes';
import { SKILL_TREE } from '@/data/skill-tree';
import { generateRfiScenarios } from '@/utils/scenario';
import type { Scenario } from '@/data/skill-tree';

import TabBar from '@/components/TabBar';
import XPBar from '@/components/XPBar';
import DailyGoal from '@/components/DailyGoal';
import SkillTree from '@/components/learn/SkillTree';
import GuideCard from '@/components/learn/GuideCard';
import LessonQuiz from '@/components/learn/LessonQuiz';
import LessonResult from '@/components/learn/LessonResult';
import PracticeTab from '@/components/practice/PracticeTab';
import GuideOverlay from '@/components/GuideOverlay';
import WrongNotesModal from '@/components/modals/WrongNotesModal';
import GlossaryModal from '@/components/modals/GlossaryModal';

type Tab = 'learn' | 'practice';
type LearnScreen = 'tree' | 'guide' | 'quiz' | 'result';

export default function Home() {
  const { user, loading: userLoading, signOut } = useUser();
  const { progress, loading: progressLoading, updateLesson } = useProgress();
  const { totalXP, addXP, currentLevel, nextLevel, progressPct } = useXP();
  const { stats, recordResult, total, accuracy } = useStats();
  const { todayCount, increment, isComplete, percentage } = useDailyGoal();
  const { notes, addNote, clearNotes } = useWrongNotes();

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('learn');

  // Learn tab state
  const [learnScreen, setLearnScreen] = useState<LearnScreen>('tree');
  const [openUnitId, setOpenUnitId] = useState<number | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<number>(1);
  const [lessonState, setLessonState] = useState<{
    scenarios: (Scenario & { quizType?: string; position?: string; hand?: string })[];
    currentIndex: number;
    correctCount: number;
    wrongCount: number;
    maxErrors: number;
    totalHands: number;
  } | null>(null);
  const [lessonResult, setLessonResult] = useState<{ passed: boolean; correct: number; total: number; wrong: number; xp: number } | null>(null);

  // Modals
  const [showGuide, setShowGuide] = useState(false);
  const [showWrongNotes, setShowWrongNotes] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  // Unit/lesson unlock logic
  const getUnitStatus = useCallback((unitId: number): 'locked' | 'current' | 'completed' => {
    if (unitId === 1) {
      const unit = SKILL_TREE.find(u => u.id === 1)!;
      const allCompleted = unit.lessons.length > 0 && unit.lessons.every(l => (progress[l.id]?.crown || 0) >= 1);
      return allCompleted ? 'completed' : 'current';
    }
    const prevUnit = SKILL_TREE.find(u => u.id === unitId - 1);
    if (!prevUnit) return 'locked';
    if (prevUnit.lessons.length === 0) return 'locked';
    const prevCompleted = prevUnit.lessons.every(l => (progress[l.id]?.crown || 0) >= 1);
    if (!prevCompleted) return 'locked';

    const unit = SKILL_TREE.find(u => u.id === unitId)!;
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

  // Start lesson flow
  const startLesson = useCallback((lessonId: string) => {
    const unit = SKILL_TREE.find(u => u.lessons.some(l => l.id === lessonId));
    if (!unit) return;
    const lesson = unit.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    setActiveLessonId(lessonId);
    setActiveUnitId(unit.id);
    setLearnScreen('guide');
  }, []);

  const beginQuiz = useCallback(() => {
    if (!activeLessonId) return;
    const unit = SKILL_TREE.find(u => u.lessons.some(l => l.id === activeLessonId));
    if (!unit) return;
    const lesson = unit.lessons.find(l => l.id === activeLessonId);
    if (!lesson) return;

    let scenarios: (Scenario & { quizType?: string; position?: string; hand?: string })[];
    if (lesson.quizType === 'rfi_dynamic' && lesson.positions) {
      scenarios = generateRfiScenarios(lesson.positions, lesson.handCount);
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
  }, [activeLessonId]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    setLessonState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        correctCount: prev.correctCount + (isCorrect ? 1 : 0),
        wrongCount: prev.wrongCount + (isCorrect ? 0 : 1),
      };
    });
  }, []);

  const handleNext = useCallback(() => {
    setLessonState(prev => {
      if (!prev) return prev;
      const nextIndex = prev.currentIndex + 1;

      // Check if lesson should end
      if (prev.wrongCount >= prev.maxErrors || nextIndex >= prev.totalHands) {
        const passed = prev.wrongCount < prev.maxErrors;
        const accuracy = Math.round((prev.correctCount / prev.totalHands) * 100);

        let xpEarned = 0;
        if (passed && activeLessonId) {
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
  }, [activeLessonId, progress, updateLesson, addXP]);

  const abortLesson = useCallback(() => {
    setLearnScreen('tree');
    setActiveLessonId(null);
    setLessonState(null);
  }, []);

  const backToTree = useCallback(() => {
    setLearnScreen('tree');
    setActiveLessonId(null);
    setLessonState(null);
    setLessonResult(null);
  }, []);

  // Loading
  if (userLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">로딩 중...</div>
      </div>
    );
  }

  // Get active lesson for GuideCard
  const activeUnit = SKILL_TREE.find(u => u.id === activeUnitId);
  const activeLesson = activeUnit?.lessons.find(l => l.id === activeLessonId);

  return (
    <div className="max-w-[500px] mx-auto px-4 py-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold text-gray-200">Holdem Trainer</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowGuide(true)} className="text-lg" title="공략집">📚</button>
          <button onClick={() => setShowGlossary(true)} className="text-lg" title="용어사전">📖</button>
          {user && (
            <button onClick={signOut} className="text-xs text-gray-500 hover:text-gray-300 ml-1">
              로그아웃
            </button>
          )}
        </div>
      </div>

      {/* XP Bar */}
      <XPBar currentLevel={currentLevel} nextLevel={nextLevel} totalXP={totalXP} progressPct={progressPct} />

      {/* Daily Goal */}
      <DailyGoal todayCount={todayCount} isComplete={isComplete} percentage={percentage} />

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onSwitch={setActiveTab} />

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <>
          {learnScreen === 'tree' && (
            <SkillTree
              progress={progress}
              openUnitId={openUnitId}
              onToggleUnit={(id) => setOpenUnitId(openUnitId === id ? null : id)}
              onStartLesson={startLesson}
              getUnitStatus={getUnitStatus}
              isLessonUnlocked={isLessonUnlocked}
            />
          )}

          {learnScreen === 'guide' && activeLesson && activeUnit && (
            <GuideCard
              lesson={activeLesson}
              unitEmoji={activeUnit.emoji}
              onStart={beginQuiz}
            />
          )}

          {learnScreen === 'quiz' && lessonState && (
            <LessonQuiz
              lessonState={lessonState}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onAbort={abortLesson}
            />
          )}

          {learnScreen === 'result' && lessonResult && activeLessonId && (
            <LessonResult
              passed={lessonResult.passed}
              correct={lessonResult.correct}
              total={lessonResult.total}
              wrong={lessonResult.wrong}
              xp={lessonResult.xp}
              lessonId={activeLessonId}
              unitId={activeUnitId}
              onStartLesson={startLesson}
              onBackToTree={backToTree}
              isLessonUnlocked={isLessonUnlocked}
            />
          )}
        </>
      )}

      {/* Practice Tab */}
      {activeTab === 'practice' && (
        <PracticeTab
          onRecordResult={recordResult}
          onAddWrongNote={addNote}
          onIncrementDaily={increment}
          stats={stats}
          total={total}
          accuracy={accuracy}
          onOpenWrongNotes={() => setShowWrongNotes(true)}
        />
      )}

      {/* Guide Overlay */}
      {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} />}

      {/* Wrong Notes Modal */}
      {showWrongNotes && (
        <WrongNotesModal
          notes={notes}
          onClose={() => setShowWrongNotes(false)}
          onClear={clearNotes}
          onStartDrill={() => {
            setShowWrongNotes(false);
            setActiveTab('practice');
          }}
        />
      )}

      {/* Glossary Modal */}
      {showGlossary && <GlossaryModal onClose={() => setShowGlossary(false)} />}
    </div>
  );
}
