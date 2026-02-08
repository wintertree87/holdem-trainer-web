'use client';

import { SKILL_TREE } from '@/data/skill-tree';

type Props = {
  passed: boolean;
  correct: number;
  total: number;
  wrong: number;
  xp: number;
  lessonId: string;
  unitId: number;
  onStartLesson: (lessonId: string) => void;
  onBackToTree: () => void;
  isLessonUnlocked: (unitId: number, lessonId: string) => boolean;
};

export default function LessonResult({ passed, correct, total, wrong, xp, lessonId, unitId, onStartLesson, onBackToTree, isLessonUnlocked }: Props) {
  const unit = SKILL_TREE.find(u => u.id === unitId);
  const lessonIdx = unit?.lessons.findIndex(l => l.id === lessonId) ?? -1;
  const nextLesson = unit?.lessons[lessonIdx + 1];
  const nextUnit = SKILL_TREE.find(u => u.id === unitId + 1);

  return (
    <div className="max-w-[400px] mx-auto mt-10 text-center">
      <div className="text-6xl mb-4">{passed ? (wrong === 0 ? '🌟' : '🎉') : '💔'}</div>
      <div className={`text-2xl font-bold mb-2 ${passed ? 'text-green-400' : 'text-red-400'}`}>
        {passed ? (wrong === 0 ? '퍼펙트!' : '레슨 완료!') : '다시 도전하세요!'}
      </div>
      <div className="text-sm text-gray-400 mb-2">정답 {correct}/{total} ({Math.round((correct / total) * 100)}%)</div>
      {xp > 0 && <div className="text-lg font-bold text-indigo-300 mb-6">+{xp} XP</div>}

      <div className="flex flex-col gap-2.5">
        {passed && nextLesson && isLessonUnlocked(unitId, nextLesson.id) && (
          <button onClick={() => onStartLesson(nextLesson.id)} className="py-3.5 px-5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] transition">
            다음 레슨
          </button>
        )}
        {passed && !nextLesson && nextUnit && nextUnit.lessons.length > 0 && isLessonUnlocked(nextUnit.id, nextUnit.lessons[0].id) && (
          <button onClick={() => onStartLesson(nextUnit.lessons[0].id)} className="py-3.5 px-5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] transition">
            다음 유닛: {nextUnit.title}
          </button>
        )}
        {!passed && (
          <button onClick={() => onStartLesson(lessonId)} className="py-3.5 px-5 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-[15px] font-bold hover:scale-[1.03] transition">
            다시 도전
          </button>
        )}
        <button onClick={onBackToTree} className="py-3.5 px-5 bg-gray-700 rounded-xl text-gray-200 text-[15px] font-bold hover:scale-[1.03] transition">
          스킬 트리로
        </button>
      </div>
    </div>
  );
}
