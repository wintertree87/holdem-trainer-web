'use client';

import { useState } from 'react';
import type { Lesson } from '@/data/skill-tree';

type Props = {
  lesson: Lesson;
  unitEmoji: string;
  onStart: () => void;
  isFirstAttempt?: boolean;
};

export default function GuideCard({ lesson, unitEmoji, onStart, isFirstAttempt = true }: Props) {
  const [showTip, setShowTip] = useState(isFirstAttempt);

  return (
    <div className="max-w-[450px] mx-auto mt-10 animate-slide-up bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4 animate-emoji-bounce">{unitEmoji}</div>
      <div className="text-lg font-bold text-indigo-300 mb-2">{lesson.title}</div>
      <div className="text-sm text-gray-500 mb-5">{lesson.subtitle}</div>

      {/* Collapsible tip */}
      {showTip ? (
        <>
          <div className="text-sm leading-7 text-gray-300 text-left mb-4 whitespace-pre-line animate-slide-up">{lesson.guideTip}</div>
          {lesson.guideExample && (
            <div className="text-sm text-left mb-6 bg-white/5 rounded-lg p-3 border border-indigo-500/20 animate-slide-up">
              <div className="text-xs text-indigo-400 font-bold mb-1.5">예시</div>
              <div className="text-gray-300 leading-6 whitespace-pre-line">{lesson.guideExample}</div>
            </div>
          )}
          {!lesson.guideExample && <div className="mb-2" />}
        </>
      ) : (
        <button
          onClick={() => setShowTip(true)}
          className="text-sm text-gray-500 hover:text-indigo-300 mb-6 transition"
        >
          💡 팁 보기
        </button>
      )}

      <button
        onClick={onStart}
        className="px-10 py-3.5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-base font-bold hover:scale-105 active:scale-[0.98] transition animate-pulse-button"
      >
        바로 시작
      </button>
    </div>
  );
}
