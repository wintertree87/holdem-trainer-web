'use client';

import { useState, useCallback, useEffect } from 'react';
import { generateHandFromNotation } from '@/utils/hand';
import { SUIT_NAMES } from '@/data/constants';
import type { Scenario } from '@/data/skill-tree';

type LessonState = {
  scenarios: (Scenario & { quizType?: string; position?: string; hand?: string })[];
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
};

export default function LessonQuiz({ lessonState, onAnswer, onNext, onAbort }: Props) {
  const { scenarios, currentIndex, wrongCount, maxErrors, totalHands } = lessonState;
  const scenario = scenarios[currentIndex];
  const progressPct = Math.round((currentIndex / totalHands) * 100);
  const heartsRemaining = maxErrors - wrongCount;
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setAnswered(false);
    setSelectedAnswer('');
  }, [currentIndex]);

  const handleAnswer = useCallback((action: string) => {
    if (answered) return;
    const correct = action === scenario.answer;
    setAnswered(true);
    setSelectedAnswer(action);
    setIsCorrect(correct);
    onAnswer(correct);
  }, [answered, scenario, onAnswer]);

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

  const isRfi = scenario.quizType === 'rfi_dynamic';

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onAbort} className="text-gray-400 hover:text-white text-xl p-1">✕</button>
        <div className="flex-1 h-2.5 bg-gray-700 rounded overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="text-lg whitespace-nowrap">
          {Array.from({ length: maxErrors }, (_, i) => i < heartsRemaining ? '❤️' : '🖤').join('')}
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-6 mb-4 min-h-[300px]">
        {isRfi && scenario.hand ? (
          <RfiScenario scenario={scenario} answered={answered} selectedAnswer={selectedAnswer} onAnswer={handleAnswer} />
        ) : (
          <IdentifyScenario scenario={scenario} answered={answered} selectedAnswer={selectedAnswer} onAnswer={handleAnswer} />
        )}
      </div>

      {answered && (
        <div className={`p-4 rounded-xl mt-4 ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
          <div className={`text-base font-bold mb-1.5 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
            {isCorrect ? '정답!' : '오답!'}
          </div>
          <div className="text-sm text-gray-300 leading-6">{scenario.explanation}</div>
          <button onClick={handleNext} className="mt-3 px-8 py-2.5 bg-indigo-500 rounded-lg text-white text-sm font-bold hover:bg-indigo-600">
            계속
          </button>
        </div>
      )}
    </div>
  );
}

function RfiScenario({ scenario, answered, selectedAnswer, onAnswer }: {
  scenario: { hand?: string; position?: string; options: string[]; answer: string };
  answered: boolean; selectedAnswer: string; onAnswer: (a: string) => void;
}) {
  const cards = generateHandFromNotation(scenario.hand!);

  return (
    <>
      <div className="text-center mb-4">
        <span className="inline-block bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-bold">{scenario.position}</span>
      </div>
      <div className="flex justify-center gap-2.5 mb-4">
        {cards.map((card, i) => (
          <div key={i} className={`w-[70px] h-[95px] bg-white rounded-lg flex flex-col items-center justify-center font-bold shadow-lg ${
            card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-gray-800'
          }`}>
            <div className="text-2xl">{card.rank}</div>
            <div className="text-3xl">{card.suit}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-base font-bold text-gray-200 mb-5">
        {scenario.hand} — {scenario.position}에서 어떻게?
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
      {scenario.show && <div className="text-center text-3xl font-bold text-amber-400 mb-4 tracking-wider">{scenario.show}</div>}
      <div className="text-center text-base font-bold text-gray-200 mb-5 leading-6">{scenario.question}</div>
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
          className={`py-3.5 px-5 rounded-xl text-[15px] font-medium text-left border-2 transition ${
            answered && opt === answer ? 'border-green-500 bg-green-500/15 text-green-400' :
            answered && opt === selectedAnswer && opt !== answer ? 'border-red-500 bg-red-500/15 text-red-400' :
            answered ? 'border-gray-700 bg-gray-800 text-gray-500' :
            'border-gray-700 bg-gray-800 text-gray-200 hover:border-indigo-500 hover:bg-indigo-500/10'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
