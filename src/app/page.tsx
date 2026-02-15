'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { useProgress } from '@/hooks/useProgress';
import { useXP } from '@/hooks/useXP';
import { useStats } from '@/hooks/useStats';
import { useDailyGoal } from '@/hooks/useDailyGoal';
import { useWrongNotes } from '@/hooks/useWrongNotes';
import { useSound } from '@/hooks/useSound';
import { useStreak } from '@/hooks/useStreak';
import { useLessonFlow } from '@/hooks/useLessonFlow';
import { useGameSession, type MatchResult } from '@/hooks/useGameSession';
import { type GameTier } from '@/data/game-config';
import { createClient } from '@/lib/supabase-browser';

import PostLoginOnboarding from '@/components/PostLoginOnboarding';
import TabBar, { type Tab } from '@/components/TabBar';
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
import FeedbackModal from '@/components/modals/FeedbackModal';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import ProfileOverlay from '@/components/ProfileOverlay';
import GameTab from '@/components/game/GameTab';
import GameTable from '@/components/game/GameTable';
import MatchSummary from '@/components/game/MatchSummary';

type GameStats = {
  tier: string;
  wins: number;
  losses: number;
  ties: number;
  totalBbWon: number;
};

export default function Home() {
  const { user, loading: userLoading, signOut } = useUser();
  const { progress, loading: progressLoading, updateLesson } = useProgress();
  const { totalXP, addXP, currentLevel, nextLevel, progressPct, levelUpInfo, dismissLevelUp } = useXP();
  const { stats, recordResult, total, accuracy } = useStats();
  const { todayCount, increment, isComplete, percentage } = useDailyGoal();
  const { notes, addNote, clearNotes } = useWrongNotes();
  const { muted, toggleMute, playLevelUp } = useSound();
  const { currentStreak, bestStreak, weekDays } = useStreak();

  const lesson = useLessonFlow({ progress, updateLesson, addXP });
  const game = useGameSession();

  // Post-login onboarding state
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setOnboardingCompleted(null); return; }
    const supabase = createClient();
    supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single()
      .then(({ data }) => {
        setOnboardingCompleted(data?.onboarding_completed ?? false);
      });
  }, [user]);

  const markOnboardingCompleted = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
    setOnboardingCompleted(true);
  }, [user]);

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('learn');

  // Game stats from Supabase
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [matchXpEarned, setMatchXpEarned] = useState(0);

  // Modals
  const [showGuide, setShowGuide] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showWrongNotes, setShowWrongNotes] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // Load game stats
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from('game_stats')
      .select('tier, result, hero_final_stack')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) return;
        const statsMap: Record<string, GameStats> = {};
        for (const row of data) {
          if (!statsMap[row.tier]) {
            statsMap[row.tier] = { tier: row.tier, wins: 0, losses: 0, ties: 0, totalBbWon: 0 };
          }
          const s = statsMap[row.tier];
          if (row.result === 'hero') s.wins++;
          else if (row.result === 'bot') s.losses++;
          else s.ties++;
          s.totalBbWon += row.hero_final_stack - 100; // 100 = starting stack
        }
        setGameStats(Object.values(statsMap));
      });
  }, [user, game.matchResult]);

  // Save match result to Supabase
  const saveMatchResult = useCallback(async (result: MatchResult, xp: number) => {
    if (!user) return;
    const supabase = createClient();
    await supabase.from('game_stats').insert({
      user_id: user.id,
      tier: result.tier.id,
      result: result.winner,
      hero_final_stack: result.heroFinalStack,
      bot_final_stack: result.botFinalStack,
      hands_played: result.handsPlayed,
      xp_earned: xp,
    });
  }, [user]);

  // Handle match completion
  useEffect(() => {
    if (!game.matchResult || matchXpEarned > 0) return;
    const result = game.matchResult;
    const xp = result.tier.xpBase + (result.winner === 'hero' ? result.tier.xpWin : 0);
    setMatchXpEarned(xp);
    addXP(xp);
    saveMatchResult(result, xp);
  }, [game.matchResult, matchXpEarned, addXP, saveMatchResult]);

  // Start match handler
  const handleStartMatch = useCallback((tier: GameTier) => {
    setMatchXpEarned(0);
    game.startMatch(tier);
  }, [game]);

  // End match handler
  const handleEndMatch = useCallback(() => {
    game.endMatch();
    setMatchXpEarned(0);
  }, [game]);

  // Back button handling
  useEffect(() => {
    if (!user) return;
    window.history.replaceState({ holdemApp: true }, '', '/');

    const handlePopState = (e: PopStateEvent) => {
      if (game.match && !game.matchResult) {
        // In game — quit match
        game.endMatch();
      } else if (game.matchResult) {
        handleEndMatch();
      } else if (lesson.learnScreen !== 'tree') {
        lesson.backToTree();
      }
      if (!e.state?.holdemApp) {
        window.history.pushState({ holdemApp: true }, '', '/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, lesson.learnScreen, lesson.backToTree, game.match, game.matchResult, game.endMatch, handleEndMatch]);

  // Loading
  if (userLoading || progressLoading || (user && onboardingCompleted === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">로딩 중...</div>
      </div>
    );
  }

  // Post-login onboarding (신규 유저)
  if (user && onboardingCompleted === false) {
    return (
      <PostLoginOnboarding
        onComplete={(startLessonId) => {
          if (startLessonId) {
            lesson.startLesson(startLessonId);
          }
        }}
        addXP={addXP}
        updateLesson={(lessonId, data) => updateLesson(lessonId, data)}
        markOnboardingCompleted={markOnboardingCompleted}
      />
    );
  }

  // Game in progress — full-screen game UI
  if (game.match && !game.matchResult) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-4 min-h-screen">
        <GameTable
          match={game.match}
          showResult={game.showResult}
          onHeroAction={game.handleHeroAction}
          onShowResult={game.handleShowResult}
          onNextHand={game.nextHand}
          onQuit={game.endMatch}
        />
      </div>
    );
  }

  // Match complete — show summary
  if (game.matchResult) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-4 min-h-screen">
        <MatchSummary
          result={game.matchResult}
          xpEarned={matchXpEarned}
          onClose={handleEndMatch}
        />
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
            <button onClick={() => setShowProfile(true)} className="text-lg" title="마이페이지">👤</button>
          )}
        </div>
      </div>

      {/* XP Bar */}
      <XPBar currentLevel={currentLevel} nextLevel={nextLevel} totalXP={totalXP} progressPct={progressPct} />

      {/* Daily Goal */}
      <DailyGoal todayCount={todayCount} isComplete={isComplete} percentage={percentage} streak={currentStreak} />

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

          {lesson.learnScreen === 'guide' && lesson.testOutUnitId !== null && lesson.activeUnit && (
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

          {lesson.learnScreen === 'guide' && lesson.testOutUnitId === null && lesson.activeLesson && lesson.activeUnit && (
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

          {lesson.learnScreen === 'result' && lesson.lessonResult && (lesson.activeLessonId || lesson.testOutUnitId !== null) && (
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
              isTestOut={lesson.testOutUnitId !== null}
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

      {/* Game Tab */}
      {activeTab === 'game' && (
        <GameTab
          getUnitStatus={lesson.getUnitStatus}
          onStartMatch={handleStartMatch}
          gameStats={gameStats}
        />
      )}

      {/* Feedback */}
      <div className="flex justify-center mt-8 mb-4">
        <button
          onClick={() => setShowFeedback(true)}
          className="text-xs text-gray-500 hover:text-gray-300 transition cursor-pointer"
        >
          💬 피드백 보내기
        </button>
      </div>

      {/* Level Up Overlay */}
      {levelUpInfo && (
        <LevelUpOverlay
          newLevel={levelUpInfo.newLevel}
          onDismiss={dismissLevelUp}
          playLevelUp={playLevelUp}
        />
      )}

      {/* Profile Overlay */}
      {showProfile && user && (
        <ProfileOverlay
          onClose={() => setShowProfile(false)}
          onSignOut={signOut}
          email={user.email || ''}
          nickname={user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '유저'}
          totalXP={totalXP}
          currentLevel={currentLevel}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          weekDays={weekDays}
          progress={progress}
          gameStats={gameStats.reduce(
            (acc, s) => ({
              wins: acc.wins + s.wins,
              losses: acc.losses + s.losses,
              ties: acc.ties + s.ties,
              totalBbWon: acc.totalBbWon + s.totalBbWon,
            }),
            { wins: 0, losses: 0, ties: 0, totalBbWon: 0 }
          )}
        />
      )}

      {/* Guide Overlay */}
      {showGuide && <GuideOverlay onClose={() => setShowGuide(false)} getUnitStatus={lesson.getUnitStatus} />}

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

      {/* Feedback Modal */}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
}
