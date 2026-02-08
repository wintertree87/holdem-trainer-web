'use client';

import type { Lesson } from '@/data/skill-tree';

type Props = {
  lesson: Lesson;
  unitEmoji: string;
  onStart: () => void;
};

export default function GuideCard({ lesson, unitEmoji, onStart }: Props) {
  return (
    <div className="max-w-[450px] mx-auto mt-10 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-8 text-center">
      <div className="text-5xl mb-4">{unitEmoji}</div>
      <div className="text-lg font-bold text-indigo-300 mb-2">{lesson.title}</div>
      <div className="text-sm text-gray-500 mb-5">{lesson.subtitle}</div>
      <div className="text-sm leading-7 text-gray-300 text-left mb-6 whitespace-pre-line">{lesson.guideTip}</div>
      <button
        onClick={onStart}
        className="px-10 py-3.5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-base font-bold hover:scale-105 transition"
      >
        시작하기
      </button>
    </div>
  );
}
