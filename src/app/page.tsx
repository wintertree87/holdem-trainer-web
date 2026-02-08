'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useUser } from '@/hooks/useUser';
import { useProgress } from '@/hooks/useProgress';
import { useXP } from '@/hooks/useXP';
import { useStats } from '@/hooks/useStats';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import { useWrongNotes } from '@/hooks/useWrongNotes';
import { useSound } from '@/hooks/useSound';
import { SKILL_TREE } from '@/data/skill-tree';
import { generateRfiScenarios, generateFacingScenarios, generateVs3betScenarios, generateTestOutScenarios } from '@/utils/scenario';
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
  const { totalXP, addXP, currentLevel, nextLevel, progressPct, levelUpInfo, dismissLevelUp } = useXP();
  const { stats, recordResult, total, accuracy } = useStats();
  const { todayCount, increment, isComplete, percentage } = useDailyGoal();
  const { notes, addNote, clearNotes } = useWrongNotes();
  const { muted, toggleMute, playLevelUp } = useSound();

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('learn');

  // Learn tab state
  const [learnScreen, setLearnScreen] = useState<LearnScreen>('tree');
  const [openUnitId, setOpenUnitId] = useState<number | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<number>(1);
  const [lessonState, setLessonState] = useState<{
    scenarios: (Scenario & { quizType?: string; position?: string; hand?: string; vsPosition?: string })[];
    currentIndex: number;
    correctCount: number;
    wrongCount: number;
    maxErrors: number;
    totalHands: number;
  } | null>(null);
  const [lessonResult, setLessonResult] = useState<{ passed: boolean; correct: number; total: number; wrong: number; xp: number } | null>(null);
  const [testOutUnitId, setTestOutUnitId] = useState<number | null>(null);

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

    setTestOutUnitId(null);
    setActiveLessonId(lessonId);
    setActiveUnitId(unit.id);
    setLearnScreen('guide');
  }, []);

  // Start test-out flow
  const startTestOut = useCallback((unitId: number) => {
    setTestOutUnitId(unitId);
    setActiveUnitId(unitId);
    setActiveLessonId(null);
    setLearnScreen('guide');
  }, []);

  const beginQuiz = useCallback(() => {
    // Test-out mode
    if (testOutUnitId) {
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

    // Normal lesson mode
    if (!activeLessonId) return;
    const unit = SKILL_TREE.find(u => u.lessons.some(l => l.id === activeLessonId));
    if (!unit) return;
    const lesson = unit.lessons.find(l => l.id === activeLessonId);
    if (!lesson) return;

    let scenarios: (Scenario & { quizType?: string; position?: string; hand?: string; vsPosition?: string })[];
    if (lesson.quizType === 'rfi_dynamic' && lesson.positions) {
      scenarios = generateRfiScenarios(lesson.positions, lesson.handCount);
    } else if (lesson.quizType === 'facing_dynamic' && lesson.positions) {
      scenarios = generateFacingScenarios(lesson.positions, lesson.handCount);
    } else if (lesson.quizType === 'vs3bet_dynamic' && lesson.positions) {
      scenarios = generateVs3betScenarios(lesson.positions, lesson.handCount);
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
  }, [activeLessonId, testOutUnitId]);

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

        // Test-out mode: bulk update all lessons in unit
        if (testOutUnitId && passed) {
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
        }
        // Normal lesson mode
        else if (passed && activeLessonId) {
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
          <button onClick={toggleMute} className="text-lg" title={muted ? '소리 켜기' : '소리 끄기'}>
            {muted ? '🔇' : '🔊'}
          </button>
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
              onStartTestOut={startTestOut}
              getUnitStatus={getUnitStatus}
              isLessonUnlocked={isLessonUnlocked}
            />
          )}

          {learnScreen === 'guide' && testOutUnitId && activeUnit && (
            <div className="max-w-[400px] mx-auto mt-10 text-center">
              <div className="text-5xl mb-4 animate-emoji-bounce">🏆</div>
              <div className="text-2xl font-bold text-amber-400 mb-2 animate-slide-up">승단 시험</div>
              <div className="text-base font-bold text-gray-200 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {activeUnit.emoji} {activeUnit.title}
              </div>
              <div className="bg-white/5 rounded-xl p-5 mb-6 text-left animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-sm text-gray-300 space-y-2">
                  <p>이 시험을 통과하면 유닛의 <span className="text-amber-400 font-bold">모든 레슨이 완료</span>됩니다.</p>
                  <p>• 총 <span className="font-bold text-white">10문제</span> 출제</p>
                  <p>• <span className="font-bold text-white">80% 이상</span> 정답 시 통과 (오답 2개까지 허용)</p>
                  <p>• 유닛의 모든 레슨에서 혼합 출제됩니다</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button
                  onClick={beginQuiz}
                  className="py-3.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition"
                >
                  시험 시작
                </button>
                <button
                  onClick={abortLesson}
                  className="py-3.5 px-5 bg-gray-700 rounded-xl text-gray-200 text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition"
                >
                  돌아가기
                </button>
              </div>
            </div>
          )}

          {learnScreen === 'guide' && !testOutUnitId && activeLesson && activeUnit && (
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

          {learnScreen === 'result' && lessonResult && (activeLessonId || testOutUnitId) && (
            <LessonResult
              passed={lessonResult.passed}
              correct={lessonResult.correct}
              total={lessonResult.total}
              wrong={lessonResult.wrong}
              xp={lessonResult.xp}
              lessonId={activeLessonId || ''}
              unitId={activeUnitId}
              onStartLesson={startLesson}
              onBackToTree={backToTree}
              isLessonUnlocked={isLessonUnlocked}
              isTestOut={!!testOutUnitId}
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

      {/* Level Up Overlay */}
      {levelUpInfo && (
        <LevelUpOverlay
          newLevel={levelUpInfo.newLevel}
          onDismiss={dismissLevelUp}
          playLevelUp={playLevelUp}
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

// Level Up Overlay Component
function LevelUpOverlay({ newLevel, onDismiss, playLevelUp }: {
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
