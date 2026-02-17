'use client';

import { SKILL_TREE, CHAPTERS } from '@/data/skill-tree';
import { getPracticeGameConfig } from '@/data/practice-game-config';
import type { LessonData } from '@/hooks/useProgress';

type Props = {
  progress: Record<string, LessonData>;
  openUnitId: number | null;
  onToggleUnit: (id: number) => void;
  onStartLesson: (lessonId: string) => void;
  onStartTestOut: (unitId: number) => void;
  onStartPracticeGame?: (unitId: number) => void;
  getUnitStatus: (unitId: number) => 'locked' | 'current' | 'completed';
  isLessonUnlocked: (unitId: number, lessonId: string) => boolean;
};

function needsReview(data: LessonData | undefined): boolean {
  if (!data || !data.lastAttempt || (data.crown || 0) < 1) return false;
  const daysSince = Math.floor((Date.now() - new Date(data.lastAttempt).getTime()) / (1000 * 60 * 60 * 24));
  return daysSince >= 7;
}

export default function SkillTree({ progress, openUnitId, onToggleUnit, onStartLesson, onStartTestOut, onStartPracticeGame, getUnitStatus, isLessonUnlocked }: Props) {
  // Count total review-needed lessons for toast
  const reviewCount = SKILL_TREE.reduce((sum, u) => sum + u.lessons.filter(l => needsReview(progress[l.id])).length, 0);

  return (
    <div className="py-2.5 pb-8">
      {/* Review reminder */}
      {reviewCount > 0 && (
        <div className="max-w-[400px] mx-auto mb-4 px-4 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center animate-slide-up">
          <span className="text-orange-400 text-sm font-medium">🔄 복습할 레슨이 {reviewCount}개 있어요</span>
        </div>
      )}
      {CHAPTERS.map((chapter) => {
        const allUnitIds = [...chapter.unitIds, ...(chapter.bossUnitId >= 0 ? [chapter.bossUnitId] : [])];
        const chapterUnits = allUnitIds.map(id => SKILL_TREE.find(u => u.id === id)).filter(Boolean);
        const completedLessons = chapterUnits.reduce((sum, u) => sum + (u?.lessons.filter(l => (progress[l.id]?.crown || 0) >= 1).length || 0), 0);
        const totalLessons = chapterUnits.reduce((sum, u) => sum + (u?.lessons.length || 0), 0);
        const chapterProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return (
          <div key={chapter.id} className="mb-6">
            {/* Chapter Header */}
            <div className="text-center mb-4 mt-4">
              <div className="text-2xl mb-1">{chapter.emoji}</div>
              <div className="text-amber-400 text-sm font-bold uppercase tracking-widest">{chapter.title}</div>
              <div className="text-gray-500 text-xs">{chapter.subtitle}</div>
              {totalLessons > 0 && (
                <div className="max-w-[200px] mx-auto mt-2">
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${chapterProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{completedLessons}/{totalLessons}</div>
                </div>
              )}
            </div>

            {/* Units */}
            {chapterUnits.map((unit, idx) => {
              if (!unit) return null;
              const status = getUnitStatus(unit.id);
              const isOpen = openUnitId === unit.id && status !== 'locked';
              const isBoss = unit.isBoss;

              return (
                <div key={unit.id}>
                  {/* Connector */}
                  {idx > 0 && (
                    <div className={`w-[3px] h-5 mx-auto ${
                      status === 'completed' ? 'bg-green-500' :
                      status === 'current' ? 'bg-indigo-500' : 'bg-gray-700'
                    }`} />
                  )}

                  <div
                    className={`flex flex-col items-center mb-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                      status === 'locked' ? 'opacity-50 grayscale blur-[0.5px]' : ''
                    }`}
                    onClick={() => status !== 'locked' && onToggleUnit(unit.id)}
                  >
                    {/* Unit Circle — boss units are larger with gold border */}
                    <div className={`rounded-full flex items-center justify-center font-bold border-[3px] transition-all ${
                      isBoss ? 'w-20 h-20 text-3xl' : 'w-16 h-16 text-2xl'
                    } ${
                      status === 'locked' ? 'bg-gray-800 border-gray-700 text-gray-600' :
                      isBoss && status === 'current' ? 'bg-gradient-to-br from-amber-500 to-yellow-400 border-amber-300 text-white animate-float animate-pulse-glow' :
                      isBoss && status === 'completed' ? 'bg-gradient-to-br from-amber-500 to-yellow-600 border-amber-400 text-white' :
                      status === 'current' ? 'bg-gradient-to-br from-indigo-500 to-indigo-400 border-indigo-300 text-white animate-float animate-pulse-glow' :
                      'bg-gradient-to-br from-green-500 to-green-600 border-green-400 text-white'
                    }`}>
                      {status === 'locked' ? '🔒' : isBoss ? '🏆' : unit.emoji}
                    </div>
                    <div className={`mt-1.5 text-sm font-bold ${status === 'locked' ? 'text-gray-600' : isBoss ? 'text-amber-400' : 'text-gray-200'}`}>
                      {unit.title}
                    </div>
                    <div className={`text-[11px] ${status === 'locked' ? 'text-gray-700' : 'text-gray-500'}`}>{unit.subtitle}</div>

                    {/* Lesson stars */}
                    {unit.lessons.length > 0 && status !== 'locked' && !isBoss && (
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

                    {/* Boss status badge */}
                    {isBoss && status !== 'locked' && (
                      <div className={`mt-1 text-xs font-bold ${
                        status === 'completed' ? 'text-amber-400' : 'text-amber-500/60'
                      }`}>
                        {status === 'completed' ? '✓ 클리어' : '도전하기'}
                      </div>
                    )}
                  </div>

                  {/* Expanded Unit Panel */}
                  {isOpen && unit.lessons.length > 0 && (
                    <div className="max-w-[400px] mx-auto mb-4 bg-white/5 rounded-xl p-4">
                      {/* Boss: single start button */}
                      {isBoss ? (
                        <div className="text-center">
                          <div className="text-sm text-gray-400 mb-3">{unit.lessons[0].guideTip.split('\n')[0]}</div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onStartLesson(unit.lessons[0].id); }}
                            className={`w-full py-3.5 px-5 rounded-xl text-[15px] font-bold transition-all ${
                              status === 'completed'
                                ? 'border border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10'
                                : 'bg-gradient-to-br from-amber-500 to-yellow-500 text-white hover:scale-[1.03] active:scale-[0.98] animate-pulse-button'
                            }`}
                          >
                            {status === 'completed' ? '🏆 다시 도전' : '🏆 보스전 시작!'}
                          </button>
                        </div>
                      ) : (
                        <>
                          {unit.lessons.map((lesson, lessonIdx) => {
                            const unlocked = isLessonUnlocked(unit.id, lesson.id);
                            const crown = progress[lesson.id]?.crown || 0;
                            const review = needsReview(progress[lesson.id]);
                            return (
                              <div
                                key={lesson.id}
                                className={`animate-slide-in flex items-center p-2.5 rounded-lg mb-1.5 transition ${
                                  unlocked ? 'cursor-pointer hover:bg-white/5' : 'opacity-40 cursor-default'
                                } ${review ? 'bg-orange-500/5' : ''}`}
                                style={{ animationDelay: `${lessonIdx * 0.08}s` }}
                                onClick={() => unlocked && onStartLesson(lesson.id)}
                              >
                                <div className={`relative w-9 h-9 rounded-full flex items-center justify-center text-base mr-3 flex-shrink-0 ${
                                  !unlocked ? 'bg-gray-800 text-gray-600' : review ? 'bg-orange-500 text-white' : crown >= 1 ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white'
                                }`}>
                                  {!unlocked ? '🔒' : review ? '🔄' : crown >= 1 ? '✓' : '▶'}
                                  {review && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-400 rounded-full border border-gray-900 animate-pulse" />}
                                </div>
                                <div className="flex-1">
                                  <div className={`text-sm font-bold ${review ? 'text-orange-300' : unlocked ? 'text-gray-200' : 'text-gray-600'}`}>{lesson.title}</div>
                                  <div className="text-[11px] text-gray-500">{review ? '복습 추천' : lesson.subtitle}</div>
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

                          {status === 'current' && (
                            <button
                              className="w-full mt-3 py-3 px-4 border border-amber-500/30 bg-amber-500/5 rounded-xl text-amber-400 text-sm font-bold hover:bg-amber-500/10 hover:border-amber-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                              onClick={(e) => { e.stopPropagation(); onStartTestOut(unit.id); }}
                            >
                              🏆 승급전으로 한 번에 통과하기
                            </button>
                          )}

                          {status === 'completed' && onStartPracticeGame && getPracticeGameConfig(unit.id) && (
                            <button
                              className="w-full mt-3 py-2.5 px-4 border border-indigo-500/30 bg-indigo-500/5 rounded-xl text-indigo-400 text-sm font-bold hover:bg-indigo-500/10 hover:border-indigo-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                              onClick={(e) => { e.stopPropagation(); onStartPracticeGame(unit.id); }}
                            >
                              🎯 실전 연습 (3핸드)
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
