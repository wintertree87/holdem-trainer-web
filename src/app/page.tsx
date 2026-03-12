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
import { useHearts } from '@/hooks/useHearts';
import { useMultiplayerSession, type MPMatchResult } from '@/hooks/useMultiplayerSession';
import { usePracticeGame } from '@/hooks/usePracticeGame';
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
import HeartDisplay from '@/components/HeartDisplay';
import NoHeartsOverlay from '@/components/learn/NoHeartsOverlay';
import PracticeTab from '@/components/practice/PracticeTab';
import GuideOverlay from '@/components/GuideOverlay';
import WrongNotesModal from '@/components/modals/WrongNotesModal';
import GlossaryModal from '@/components/modals/GlossaryModal';
import FeedbackModal from '@/components/modals/FeedbackModal';
import LevelUpOverlay from '@/components/LevelUpOverlay';
import ProfileOverlay from '@/components/ProfileOverlay';
import DeleteAccountDialog from '@/components/modals/DeleteAccountDialog';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import GameTab from '@/components/game/GameTab';
import GameTable from '@/components/game/GameTable';
import MatchSummary from '@/components/game/MatchSummary';
import MPGameTable from '@/components/game/MPGameTable';
import MPMatchSummary from '@/components/game/MPMatchSummary';
import PracticeGameResult from '@/components/learn/PracticeGameResult';
import DailyHand from '@/components/DailyHand';

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
  const { currentStreak, bestStreak, weekDays, justCheckedIn } = useStreak(todayCount);

  const heartsHook = useHearts();
  const lesson = useLessonFlow({ progress, updateLesson, addXP, consumeHeart: heartsHook.consumeHeart, canStartLesson: heartsHook.canStartLesson });
  const game = useMultiplayerSession();
  const practiceGame = usePracticeGame();
  const [practiceXpEarned, setPracticeXpEarned] = useState(0);

  // Post-login onboarding state
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [joinDate, setJoinDate] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setOnboardingCompleted(null);
      setJoinDate(null);
      return () => {
        mounted = false;
      };
    }

    const supabase = createClient();
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, created_at')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;
        if (error) {
          console.error('Failed to load profile onboarding data:', error);
          // 실패 시 앱 진입을 막지 않도록 온보딩 완료로 간주한다.
          setOnboardingCompleted(true);
          setJoinDate(null);
          return;
        }
        setOnboardingCompleted(data?.onboarding_completed ?? false);
        setJoinDate(data?.created_at ?? null);
      } catch (error) {
        if (!mounted) return;
        console.error('Unexpected profile onboarding error:', error);
        setOnboardingCompleted(true);
        setJoinDate(null);
      }
    })();

    return () => {
      mounted = false;
    };
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
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

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
  const saveMatchResult = useCallback(async (result: MPMatchResult, xp: number) => {
    if (!user) return;
    const supabase = createClient();
    const winner = result.bbWon > 0 ? 'hero' : result.bbWon < 0 ? 'bot' : 'tie';
    await supabase.from('game_stats').insert({
      user_id: user.id,
      tier: result.tier.id,
      result: winner,
      hero_final_stack: result.heroFinalStack,
      bot_final_stack: 100, // legacy field, not meaningful for 6-max
      hands_played: result.handsPlayed,
      xp_earned: xp,
    });
  }, [user]);

  // Handle practice game completion
  useEffect(() => {
    if (!practiceGame.matchResult || practiceXpEarned > 0) return;
    const xp = 5;
    setPracticeXpEarned(xp);
    addXP(xp);
  }, [practiceGame.matchResult, practiceXpEarned, addXP]);

  const handleStartPracticeGame = useCallback((unitId: number) => {
    setPracticeXpEarned(0);
    practiceGame.startPracticeMatch(unitId);
  }, [practiceGame]);

  const handleEndPracticeGame = useCallback(() => {
    practiceGame.endPractice();
    setPracticeXpEarned(0);
  }, [practiceGame]);

  // Handle match completion
  useEffect(() => {
    if (!game.matchResult || matchXpEarned > 0) return;
    const result = game.matchResult;
    const heroWon = result.bbWon > 0;
    const xp = result.tier.xpBase + (heroWon ? result.tier.xpWin : 0);
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
      if (practiceGame.match && !practiceGame.matchResult) {
        practiceGame.endPractice();
      } else if (practiceGame.matchResult) {
        handleEndPracticeGame();
      } else if (game.match && !game.matchResult) {
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
  }, [user, lesson.learnScreen, lesson.backToTree, game.match, game.matchResult, game.endMatch, handleEndMatch, practiceGame.match, practiceGame.matchResult, practiceGame.endPractice, handleEndPracticeGame]);

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

  // Practice game in progress — full-screen game UI
  if (practiceGame.match && !practiceGame.matchResult) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-4 min-h-screen">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-400">
            🎯 실전 연습 — 핸드 {practiceGame.match.handNumber}/{practiceGame.match.config.handsCount}
          </div>
          <button onClick={practiceGame.endPractice} className="text-xs text-gray-500 hover:text-gray-300 transition">
            나가기
          </button>
        </div>
        <GameTable
          match={{
            tier: { id: 'practice', name: '실전 연습', emoji: '🎯', description: '', unlockUnitId: 0, botLevel: '', xpBase: 0, xpWin: 0 },
            handNumber: practiceGame.match.handNumber,
            heroStack: practiceGame.match.heroStack,
            botStack: practiceGame.match.botStack,
            currentHand: practiceGame.match.currentHand,
            matchHistory: [],
            matchComplete: false,
            heroPosition: practiceGame.match.heroPosition,
            botPosition: practiceGame.match.botPosition,
          }}
          showResult={practiceGame.showResult}
          onHeroAction={practiceGame.handleHeroAction}
          onShowResult={practiceGame.handleShowResult}
          onNextHand={practiceGame.nextHand}
          onQuit={practiceGame.endPractice}
        />
      </div>
    );
  }

  // Practice game complete — show results with coach comments
  if (practiceGame.matchResult) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-4 min-h-screen">
        <PracticeGameResult
          result={practiceGame.matchResult}
          xpEarned={practiceXpEarned}
          onClose={handleEndPracticeGame}
        />
      </div>
    );
  }

  // Game in progress — full-screen 6-max game UI
  if (game.match && !game.matchResult) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-4 min-h-screen">
        <MPGameTable
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

  // Match complete — show 6-max summary
  if (game.matchResult) {
    return (
      <div className="max-w-[500px] mx-auto px-4 py-4 min-h-screen">
        <MPMatchSummary
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
          <button onClick={() => setShowGuide(true)} className="text-lg" title="공략집">📚</button>
          <button onClick={() => setShowGlossary(true)} className="text-lg" title="용어사전">📖</button>
          {user && (
            <button onClick={() => setShowProfile(true)} className="text-lg" title="마이페이지">👤</button>
          )}
        </div>
      </div>

      {/* XP Bar + Hearts */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <XPBar currentLevel={currentLevel} nextLevel={nextLevel} totalXP={totalXP} progressPct={progressPct} />
        </div>
        {!heartsHook.loading && (
          <HeartDisplay hearts={heartsHook.hearts} maxHearts={heartsHook.maxHearts} nextRecoveryMs={heartsHook.nextRecoveryMs} size="sm" />
        )}
      </div>

      {/* Daily Goal */}
      <DailyGoal todayCount={todayCount} isComplete={isComplete} percentage={percentage} streak={currentStreak} justCheckedIn={justCheckedIn} />

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onSwitch={setActiveTab} />

      {/* Learn Tab */}
      {activeTab === 'learn' && (
        <>
          {lesson.learnScreen === 'tree' && (
            <>
              <DailyHand userId={user?.id} />
              <SkillTree
                progress={progress}
                openUnitId={lesson.openUnitId}
                onToggleUnit={lesson.toggleUnit}
                onStartLesson={lesson.startLesson}
                onStartTestOut={lesson.startTestOut}
                onStartPracticeGame={handleStartPracticeGame}
                getUnitStatus={lesson.getUnitStatus}
                isLessonUnlocked={lesson.isLessonUnlocked}
              />
            </>
          )}

          {lesson.learnScreen === 'guide' && lesson.testOutUnitId !== null && lesson.activeUnit && (
            <div className="max-w-[400px] mx-auto mt-10 text-center">
              <div className="text-5xl mb-4 animate-emoji-bounce">🏆</div>
              <div className="text-2xl font-bold text-amber-400 mb-2 animate-slide-up">승급전</div>
              <div className="text-base font-bold text-gray-200 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {lesson.activeUnit.emoji} {lesson.activeUnit.title}
              </div>
              <div className="bg-white/5 rounded-xl p-5 mb-6 text-left animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-sm text-gray-300 space-y-2">
                  <p>승급전을 통과하면 유닛의 <span className="text-amber-400 font-bold">모든 레슨이 완료</span>됩니다.</p>
                  <p>• 총 <span className="font-bold text-white">10문제</span> 출제</p>
                  <p>• <span className="font-bold text-white">80% 이상</span> 정답 시 승급 (오답 2개까지 허용)</p>
                  <p>• 유닛의 모든 레슨에서 혼합 출제됩니다</p>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button
                  onClick={lesson.beginQuiz}
                  className="py-3.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] active:scale-[0.98] transition"
                >
                  승급전 시작
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
              isFirstAttempt={!progress[lesson.activeLessonId || '']?.attempts}
            />
          )}

          {lesson.learnScreen === 'quiz' && lesson.lessonState && (
            heartsHook.hearts <= 0 ? (
              <NoHeartsOverlay nextRecoveryMs={heartsHook.nextRecoveryMs} onBack={lesson.backToTree} />
            ) : (
              <LessonQuiz
                lessonState={lesson.lessonState}
                onAnswer={(isCorrect) => {
                  lesson.handleAnswer(isCorrect);
                  increment();
                }}
                onNext={lesson.handleNext}
                onAbort={lesson.abortLesson}
                hearts={heartsHook.hearts}
                maxHearts={heartsHook.maxHearts}
                nextRecoveryMs={heartsHook.nextRecoveryMs}
              />
            )
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
              onStartPracticeGame={handleStartPracticeGame}
              isLessonUnlocked={lesson.isLessonUnlocked}
              isTestOut={lesson.testOutUnitId !== null}
              levelTitle={currentLevel.title}
              levelNumber={currentLevel.level}
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
          nextLevel={nextLevel}
          progressPct={progressPct}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          weekDays={weekDays}
          progress={progress}
          practiceStats={stats}
          gameStatsByTier={gameStats}
          todayCount={todayCount}
          joinDate={joinDate}
          muted={muted}
          onToggleMute={toggleMute}
          onDeleteAccount={() => { setShowProfile(false); setShowDeleteAccount(true); }}
          hearts={heartsHook.hearts}
          maxHearts={heartsHook.maxHearts}
          nextRecoveryMs={heartsHook.nextRecoveryMs}
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

      {/* Delete Account Dialog */}
      {showDeleteAccount && (
        <DeleteAccountDialog
          onClose={() => setShowDeleteAccount(false)}
          onDeleted={() => { window.location.href = '/onboarding'; }}
        />
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
