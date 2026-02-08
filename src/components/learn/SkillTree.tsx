'use client';

import { SKILL_TREE } from '@/data/skill-tree';
import type { LessonData } from '@/hooks/useProgress';

type Props = {
  progress: Record<string, LessonData>;
  openUnitId: number | null;
  onToggleUnit: (id: number) => void;
  onStartLesson: (lessonId: string) => void;
  getUnitStatus: (unitId: number) => 'locked' | 'current' | 'completed';
  isLessonUnlocked: (unitId: number, lessonId: string) => boolean;
};

export default function SkillTree({ progress, openUnitId, onToggleUnit, onStartLesson, getUnitStatus, isLessonUnlocked }: Props) {
  let lastGroup = '';

  return (
    <div className="py-2.5 pb-8">
      {SKILL_TREE.map((unit, idx) => {
        const status = getUnitStatus(unit.id);
        const isOpen = openUnitId === unit.id && status !== 'locked';
        const showGroupLabel = unit.group !== lastGroup;
        if (showGroupLabel) lastGroup = unit.group;

        return (
          <div key={unit.id}>
            {showGroupLabel && (
              <div className={`text-center text-amber-400 text-xs font-bold uppercase tracking-widest ${idx > 0 ? 'mt-5' : ''} mb-2.5`}>
                {unit.group}
              </div>
            )}

            {idx > 0 && SKILL_TREE[idx - 1].group === unit.group && (
              <div className={`w-[3px] h-5 mx-auto ${status === 'completed' ? 'bg-green-500' : status === 'current' ? 'bg-indigo-500' : 'bg-gray-700'}`} />
            )}

            <div
              className={`flex flex-col items-center mb-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${status === 'locked' ? 'opacity-50 grayscale blur-[0.5px]' : ''}`}
              onClick={() => status !== 'locked' && onToggleUnit(unit.id)}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-[3px] transition-all ${
                status === 'locked' ? 'bg-gray-800 border-gray-700 text-gray-600' :
                status === 'current' ? 'bg-gradient-to-br from-indigo-500 to-indigo-400 border-indigo-300 text-white animate-float animate-pulse-glow' :
                'bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white'
              }`}>
                {status === 'locked' ? '🔒' : unit.emoji}
              </div>
              <div className={`mt-1.5 text-sm font-bold ${status === 'locked' ? 'text-gray-600' : 'text-gray-200'}`}>{unit.title}</div>
              <div className={`text-[11px] ${status === 'locked' ? 'text-gray-700' : 'text-gray-500'}`}>{unit.subtitle}</div>

              {unit.lessons.length > 0 && status !== 'locked' && (
                <div className="flex gap-1.5 mt-1">
                  {unit.lessons.map(l => {
                    const crown = progress[l.id]?.crown || 0;
                    return (
                      <div key={l.id} className={`flex items-center justify-center ${
                        crown >= 3 ? 'text-amber-400 text-xs drop-shadow-[0_0_3px_rgba(251,191,36,0.6)]' :
                        crown >= 1 ? 'text-amber-500 text-xs' :
                        'text-gray-700 text-xs'
                      }`}>
                        {crown >= 1 ? '★' : '·'}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {isOpen && unit.lessons.length > 0 && (
              <div className="max-w-[400px] mx-auto mb-4 bg-white/5 rounded-xl p-4">
                {unit.lessons.map((lesson, lessonIdx) => {
                  const unlocked = isLessonUnlocked(unit.id, lesson.id);
                  const crown = progress[lesson.id]?.crown || 0;
                  return (
                    <div
                      key={lesson.id}
                      className={`animate-slide-in flex items-center p-2.5 rounded-lg mb-1.5 transition ${
                        unlocked ? 'cursor-pointer hover:bg-white/5' : 'opacity-40 cursor-default'
                      }`}
                      style={{ animationDelay: `${lessonIdx * 0.08}s` }}
                      onClick={() => unlocked && onStartLesson(lesson.id)}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base mr-3 flex-shrink-0 ${
                        !unlocked ? 'bg-gray-800 text-gray-600' : crown >= 1 ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white'
                      }`}>
                        {!unlocked ? '🔒' : crown >= 1 ? '✓' : '▶'}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-bold ${unlocked ? 'text-gray-200' : 'text-gray-600'}`}>{lesson.title}</div>
                        <div className="text-[11px] text-gray-500">{lesson.subtitle}</div>
                      </div>
                      <div className="flex gap-[3px] ml-2">
                        {[1, 2, 3].map(i => (
                          <span key={i} className={`text-sm transition-all ${
                            crown >= i
                              ? crown >= 3 ? 'text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.6)]' : 'text-amber-400'
                              : 'text-gray-700'
                          }`}>★</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
