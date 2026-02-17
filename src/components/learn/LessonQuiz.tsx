'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { generateHandFromNotation } from '@/utils/hand';
import { SUIT_NAMES } from '@/data/constants';
import { useSound } from '@/hooks/useSound';
import PokerTable from '@/components/PokerTable';
import GlossaryTip from '@/components/GlossaryTip';
import AutoGlossary from '@/components/AutoGlossary';
import RangeChart from '@/components/RangeChart';
import HeartDisplay from '@/components/HeartDisplay';
import type { Scenario } from '@/data/skill-tree';

type LessonState = {
  scenarios: (Scenario & { quizType?: string; position?: string; hand?: string; vsPosition?: string })[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  maxErrors: number;
  totalHands: number;
};

type Props = {
  lessonState: LessonState;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
  onAbort: () => void;
  // 글로벌 하트
  hearts?: number;
  maxHearts?: number;
  nextRecoveryMs?: number | null;
};

export default function LessonQuiz({ lessonState, onAnswer, onNext, onAbort, hearts: globalHearts, maxHearts: globalMaxHearts = 5, nextRecoveryMs: globalNextRecoveryMs }: Props) {
  const { scenarios, currentIndex, wrongCount, maxErrors, totalHands } = lessonState;
  const scenario = scenarios[currentIndex];
  const progressPct = Math.round((currentIndex / totalHands) * 100);
  const heartsRemaining = maxErrors - wrongCount;
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);
  const [combo, setCombo] = useState(0);
  const [shakeCard, setShakeCard] = useState(false);
  const [breakingHeart, setBreakingHeart] = useState(false);
  const [comboFlash, setComboFlash] = useState(false);
  const { playCorrect, playWrong, playCombo } = useSound();
  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (currentIndex !== prevIndexRef.current) {
      setAnswered(false);
      setSelectedAnswer('');
      setShakeCard(false);
      setBreakingHeart(false);
      setComboFlash(false);
      prevIndexRef.current = currentIndex;
    }
  }, [currentIndex]);

  const handleAnswer = useCallback((action: string) => {
    if (answered) return;
    const correct = action === scenario.answer;
    setAnswered(true);
    setSelectedAnswer(action);
    setIsCorrect(correct);
    onAnswer(correct);

    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo >= 3) {
        playCombo();
        setComboFlash(true);
        if (newCombo >= 5 && navigator.vibrate) navigator.vibrate(100);
      } else {
        playCorrect();
      }
    } else {
      setCombo(0);
      playWrong();
      setShakeCard(true);
      setBreakingHeart(true);
    }
  }, [answered, scenario, onAnswer, combo, playCorrect, playWrong, playCombo]);

  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (answered && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); handleNext(); }
      if (e.key === 'Escape') onAbort();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answered, handleNext, onAbort]);

  if (!scenario) return null;

  const isDynamic = scenario.quizType === 'rfi_dynamic' || scenario.quizType === 'facing_dynamic' || scenario.quizType === 'vs3bet_dynamic';
  const rangeMode = scenario.quizType === 'facing_dynamic' ? 'facing' : scenario.quizType === 'vs3bet_dynamic' ? 'vs3bet' : 'rfi';

  return (
    <div>
      {/* Progress + Hearts */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onAbort} className="text-gray-400 hover:text-white text-xl p-1">✕</button>
        <div className="flex-1 h-2.5 bg-gray-700 rounded overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        {globalHearts !== undefined ? (
          <HeartDisplay hearts={globalHearts} maxHearts={globalMaxHearts} nextRecoveryMs={globalNextRecoveryMs ?? null} size="sm" />
        ) : (
          <div className="text-lg whitespace-nowrap flex gap-0.5">
            {Array.from({ length: maxErrors }, (_, i) => {
              const isLast = i === heartsRemaining && breakingHeart;
              const isAlive = i < heartsRemaining;
              return (
                <span
                  key={i}
                  className={isLast ? 'animate-heart-break inline-block' : isAlive ? 'inline-block transition-transform' : 'inline-block opacity-40'}
                >
                  {isAlive || isLast ? '❤️' : '🖤'}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Combo Streak */}
      {combo >= 3 && (
        <div className="text-center mb-3 animate-slide-up">
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
            combo >= 5 ? 'bg-red-500/20 text-red-400 animate-combo-fire' : 'bg-amber-500/20 text-amber-400'
          }`}>
            🔥 {combo}연속 정답!
          </span>
        </div>
      )}

      {/* Combo ambient flash overlay */}
      {comboFlash && answered && isCorrect && combo >= 3 && (
        <div className={`fixed inset-0 pointer-events-none z-50 transition-opacity duration-500 ${
          combo >= 5 ? 'bg-gradient-to-b from-red-500/10 to-transparent' : 'bg-gradient-to-b from-amber-500/8 to-transparent'
        }`} style={{ animation: 'slide-up 0.5s ease-out both' }} />
      )}

      {/* Quiz Card */}
      <div className={`bg-white/5 rounded-2xl p-6 mb-4 min-h-[300px] ${shakeCard && !isCorrect ? 'animate-shake' : ''}`}>
        {isDynamic && scenario.hand ? (
          <DynamicScenario scenario={scenario} answered={answered} selectedAnswer={selectedAnswer} onAnswer={handleAnswer} />
        ) : (
          <IdentifyScenario scenario={scenario} answered={answered} selectedAnswer={selectedAnswer} onAnswer={handleAnswer} />
        )}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`animate-slide-up p-4 rounded-xl mt-4 ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className={`text-base font-bold mb-1.5 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? (combo >= 5 ? '🔥 완벽한 흐름!' : combo >= 3 ? '연속 정답!' : '좋은 판단이에요') : '이번엔 아쉽네요'}
          </div>
          <div className="text-sm text-gray-300 leading-7 whitespace-pre-line"><AutoGlossary text={scenario.explanation || ''} /></div>

          {/* Range Chart for dynamic quizzes */}
          {isDynamic && scenario.position && (
            <RangeChart
              mode={rangeMode as 'rfi' | 'facing' | 'vs3bet'}
              position={scenario.position}
              vsPosition={scenario.vsPosition}
              currentHand={scenario.hand}
            />
          )}

          <div className="text-center mt-3">
            <button onClick={handleNext} className="px-8 py-2.5 bg-indigo-500 rounded-lg text-white text-sm font-bold hover:bg-indigo-600 transition">
              {isCorrect ? '다음' : '계속'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DynamicScenario({ scenario, answered, selectedAnswer, onAnswer }: {
  scenario: { hand?: string; position?: string; vsPosition?: string; quizType?: string; options: string[]; answer: string };
  answered: boolean; selectedAnswer: string; onAnswer: (a: string) => void;
}) {
  const cards = generateHandFromNotation(scenario.hand!);
  const isFacing = scenario.quizType === 'facing_dynamic';
  const isVs3bet = scenario.quizType === 'vs3bet_dynamic';

  const getScenarioText = () => {
    if (isFacing) return <><GlossaryTip term={scenario.vsPosition!}>{scenario.vsPosition}</GlossaryTip>가 오픈. <GlossaryTip term={scenario.position!}>{scenario.position}</GlossaryTip>에서 어떻게?</>;
    if (isVs3bet) return <><GlossaryTip term={scenario.position!}>{scenario.position}</GlossaryTip>에서 오픈 후 <GlossaryTip term="3bet">3bet</GlossaryTip> 받음. 어떻게?</>;
    return <>{scenario.hand} — <GlossaryTip term={scenario.position!}>{scenario.position}</GlossaryTip>에서 어떻게?</>;
  };

  return (
    <>
      <div className="text-center mb-3">
        <GlossaryTip term={scenario.position!}>
          <span className="inline-block bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold">{scenario.position}</span>
        </GlossaryTip>
      </div>
      <PokerTable heroPosition={scenario.position!} villainPosition={isFacing || isVs3bet ? scenario.vsPosition : undefined} className="mb-3" />
      <div className="flex justify-center gap-2.5 mb-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`animate-card-deal w-[70px] h-[95px] bg-white rounded-lg flex flex-col items-center justify-center font-bold shadow-lg ${
              card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-gray-800'
            }`}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="text-2xl">{card.rank}</div>
            <div className="text-3xl">{card.suit}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-base font-bold text-gray-200 mb-5">
        {getScenarioText()}
      </div>
      <OptionButtons options={scenario.options} answer={scenario.answer} answered={answered} selectedAnswer={selectedAnswer} onAnswer={onAnswer} />
    </>
  );
}

function IdentifyScenario({ scenario, answered, selectedAnswer, onAnswer }: {
  scenario: { show?: string; question?: string; options: string[]; answer: string };
  answered: boolean; selectedAnswer: string; onAnswer: (a: string) => void;
}) {
  return (
    <>
      {scenario.show && <div className="text-center text-3xl font-bold text-amber-400 mb-4 tracking-wider animate-card-deal">{scenario.show}</div>}
      <div className="text-center text-base font-bold text-gray-200 mb-5 leading-6"><AutoGlossary text={scenario.question || ''} /></div>
      <OptionButtons options={scenario.options} answer={scenario.answer} answered={answered} selectedAnswer={selectedAnswer} onAnswer={onAnswer} />
    </>
  );
}

function OptionButtons({ options, answer, answered, selectedAnswer, onAnswer }: {
  options: string[]; answer: string; answered: boolean; selectedAnswer: string; onAnswer: (a: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 max-w-[400px] mx-auto">
      {options.map(opt => (
        <button
          key={opt}
          disabled={answered}
          onClick={() => onAnswer(opt)}
          className={`py-3.5 px-5 rounded-xl text-[15px] font-medium text-left border-2 transition-all duration-200 ${
            answered && opt === answer ? 'border-green-500 bg-green-500/15 text-green-400 scale-[1.02]' :
            answered && opt === selectedAnswer && opt !== answer ? 'border-red-500 bg-red-500/15 text-red-400' :
            answered ? 'border-gray-700 bg-gray-800 text-gray-500' :
            'border-gray-700 bg-gray-800 text-gray-200 hover:border-indigo-500 hover:bg-indigo-500/10 active:scale-[0.98]'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
