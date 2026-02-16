'use client';

import { useState } from 'react';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { generateHandFromNotation } from '@/utils/hand';
import PokerTable from '@/components/PokerTable';

type Props = {
  userId?: string;
};

export default function DailyHand({ userId }: Props) {
  const { challenge, userAnswer, isCorrect, distribution, totalResponses, loading, submitAnswer } = useDailyChallenge(userId);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  if (loading || !challenge) return null;

  const cards = generateHandFromNotation(challenge.hand);
  const isFacing = challenge.quizType === 'facing_dynamic';
  const isVs3bet = challenge.quizType === 'vs3bet_dynamic';
  const answered = userAnswer !== null;

  const handleAnswer = async (answer: string) => {
    if (answered || animating) return;
    setSelectedAnswer(answer);
    setAnimating(true);
    await submitAnswer(answer);
    setAnimating(false);
  };

  return (
    <div className="mb-4 bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-500/20 rounded-2xl p-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-sm font-bold text-amber-300">오늘의 한 판</span>
        </div>
        {answered && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {isCorrect ? '정답!' : '아쉽네요'}
          </span>
        )}
      </div>

      {/* Scenario */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block bg-indigo-500 text-white px-3 py-0.5 rounded-full text-xs font-bold">{challenge.position}</span>
          {(isFacing || isVs3bet) && challenge.vsPosition && (
            <span className="text-xs text-gray-400">
              vs {challenge.vsPosition}{isFacing ? ' 오픈' : ' 3bet'}
            </span>
          )}
        </div>

        {/* Cards */}
        <div className="flex justify-center gap-2 mb-3">
          {cards.map((card, i) => (
            <div
              key={i}
              className={`w-[55px] h-[75px] bg-white rounded-lg flex flex-col items-center justify-center font-bold shadow-md ${
                card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-gray-800'
              }`}
            >
              <div className="text-lg">{card.rank}</div>
              <div className="text-xl">{card.suit}</div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-300 mb-3">
          {isFacing
            ? `${challenge.vsPosition}가 오픈. ${challenge.position}에서 어떻게?`
            : isVs3bet
            ? `${challenge.position}에서 오픈 후 3bet 받음. 어떻게?`
            : `${challenge.hand} — ${challenge.position}에서 어떻게?`}
        </div>
      </div>

      {/* Options or Results */}
      {!answered ? (
        <div className="flex gap-2">
          {challenge.options.map(opt => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={animating}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-gray-600 text-gray-200 hover:border-amber-500 hover:text-amber-300 active:scale-95 transition"
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="animate-slide-up">
          {/* Explanation */}
          <div className="text-xs text-gray-400 mb-3">{challenge.explanation}</div>

          {/* Distribution */}
          {distribution && totalResponses > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-gray-500 mb-1">{totalResponses}명 참여</div>
              {challenge.options.map(opt => {
                const count = distribution[opt] || 0;
                const pct = Math.round((count / totalResponses) * 100);
                const isCorrectOpt = opt === challenge.correctAnswer;
                const isUserChoice = opt === userAnswer;

                return (
                  <div key={opt} className="flex items-center gap-2">
                    <div className="w-14 text-xs text-gray-400 shrink-0 text-right">
                      {opt}
                      {isUserChoice && <span className="ml-1">👈</span>}
                    </div>
                    <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isCorrectOpt ? 'bg-green-500/60' : 'bg-gray-600'
                        }`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                      <span className="absolute right-2 top-0 h-full flex items-center text-[10px] text-gray-300 font-bold">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
