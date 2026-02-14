'use client';

import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useProgress } from '@/hooks/useProgress';
import { useXP } from '@/hooks/useXP';
import { useStats } from '@/hooks/useStats';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import { useWrongNotes } from '@/hooks/useWrongNotes';
import { useSound } from '@/hooks/useSound';
import { useLessonFlow } from '@/hooks/useLessonFlow';
import { useState } from 'react';

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
import LevelUpOverlay from '@/components/LevelUpOverlay';

type Tab = 'learn' | 'practice';

export default function Home() {
  const { user, loading: userLoading, signOut } = useUser();
  const { progress, loading: progressLoading, updateLesson } = useProgress();
  const { totalXP, addXP, currentLevel, nextLevel, progressPct, levelUpInfo, dismissLevelUp } = useXP();
  const { stats, recordResult, total, accuracy } = useStats();
  const { todayCount, increment, isComplete, percentage } = useDailyGoal();
  const { notes, addNote, clearNotes } = useWrongNotes();
  const { muted, toggleMute, playLevelUp } = useSound();

  const lesson = useLessonFlow({ progress, updateLesson, addXP });

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('learn');

  // Modals
  const [showGuide, setShowGuide] = useState(false);
  const [showWrongNotes, setShowWrongNotes] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  // Back button handling
  useEffect(() => {
    if (!user) return;
    window.history.replaceState({ holdemApp: true }, '', '/');

    const handlePopState = (e: PopStateEvent) => {
      if (lesson.learnScreen !== 'tree') {
        lesson.backToTree();
      }
      if (!e.state?.holdemApp) {
        window.history.pushState({ holdemApp: true }, '', '/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, lesson.learnScreen, lesson.backToTree]);

  // Loading
  if (userLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[500px] mx-auto px-4 py-4 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h1
          className="text-lg font-bold text-gray-200 cursor-pointer hover:text-white transition"
          onClick={() => { lesson.backToTree(); setActiveTab('learn'); }}
        >Holdem Trainer</h1>
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
          {lesson.learnScreen === 'tree' && (
            <SkillTree
              progress={progress}
              openUnitId={lesson.openUnitId}
              onToggleUnit={lesson.toggleUnit}
              onStartLesson={lesson.startLesson}
              onStartTestOut={lesson.startTestOut}
              getUnitStatus={lesson.getUnitStatus}
              isLessonUnlocked={lesson.isLessonUnlocked}
            />
          )}

          {lesson.learnScreen === 'guide' && lesson.testOutUnitId && lesson.activeUnit && (
            <div className="max-w-[400px] mx-auto mt-10 text-center">
              <div className="text-5xl mb-4 animate-emoji-bounce">🏆</div>
              <div className="text-2xl font-bold text-amber-400 mb-2 animate-slide-up">승단 시험</div>
              <div className="text-base font-bold text-gray-200 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {lesson.activeUnit.emoji} {lesson.activeUnit.title}
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
                  onClick={lesson.beginQuiz}
                  className="py-3.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition"
                >
                  시험 시작
                </button>
                <button
                  onClick={lesson.abortLesson}
                  className="py-3.5 px-5 bg-gray-700 rounded-xl text-gray-200 text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition"
                >
                  돌아가기
                </button>
              </div>
            </div>
          )}

          {lesson.learnScreen === 'guide' && !lesson.testOutUnitId && lesson.activeLesson && lesson.activeUnit && (
            <GuideCard
              lesson={lesson.activeLesson}
              unitEmoji={lesson.activeUnit.emoji}
              onStart={lesson.beginQuiz}
            />
          )}

          {lesson.learnScreen === 'quiz' && lesson.lessonState && (
            <LessonQuiz
              lessonState={lesson.lessonState}
              onAnswer={lesson.handleAnswer}
              onNext={lesson.handleNext}
              onAbort={lesson.abortLesson}
            />
          )}

          {lesson.learnScreen === 'result' && lesson.lessonResult && (lesson.activeLessonId || lesson.testOutUnitId) && (
            <LessonResult
              passed={lesson.lessonResult.passed}
              correct={lesson.lessonResult.correct}
              total={lesson.lessonResult.total}
              wrong={lesson.lessonResult.wrong}
              xp={lesson.lessonResult.xp}
              lessonId={lesson.activeLessonId || ''}
              unitId={lesson.activeUnitId}
              onStartLesson={lesson.startLesson}
              onBackToTree={lesson.backToTree}
              isLessonUnlocked={lesson.isLessonUnlocked}
              isTestOut={!!lesson.testOutUnitId}
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
