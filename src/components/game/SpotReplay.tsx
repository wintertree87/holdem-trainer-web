'use client';

import { useState } from 'react';
import { type HandRecord } from '@/hooks/useGameSession';
import { getHandNotation } from '@/utils/hand';
import { getCorrectAction_RFI } from '@/utils/correct-action';

type Props = {
  history: HandRecord[];
};

function getHeroPreflopAction(record: HandRecord): string | null {
  if (!record.preflopActions) return null;
  const heroAction = record.preflopActions.find(a => a.actor === 'hero');
  if (!heroAction) return null;
  return heroAction.action.type;
}

function getHandLabel(record: HandRecord): string {
  if (!record.heroHand || record.heroHand.length < 2) return '??';
  return getHandNotation(record.heroHand[0], record.heroHand[1]);
}

function getProSuggestion(record: HandRecord): { action: string; label: string } | null {
  if (!record.heroHand || !record.heroPosition) return null;
  const notation = getHandNotation(record.heroHand[0], record.heroHand[1]);
  // Only provide RFI suggestion for simplicity (preflop open)
  const correct = getCorrectAction_RFI(notation, record.heroPosition);
  const label = correct === 'raise' ? '레이즈' : correct === 'limp' ? '림프' : '폴드';
  return { action: correct, label };
}

function getEvaluation(record: HandRecord): 'good' | 'neutral' | 'bad' {
  const heroAction = getHeroPreflopAction(record);
  const pro = getProSuggestion(record);
  if (!heroAction || !pro) return 'neutral';

  // Map hero action to comparable format
  const heroMapped = heroAction === 'fold' ? 'fold'
    : heroAction === 'call' ? 'call'
    : 'raise'; // bet/raise/allin → aggressive

  if (heroMapped === pro.action) return 'good';
  if (heroMapped === 'fold' && pro.action === 'raise') return 'bad';
  if (heroMapped !== 'fold' && pro.action === 'fold') return 'bad';
  return 'neutral';
}

export default function SpotReplay({ history }: Props) {
  const [expandedHand, setExpandedHand] = useState<number | null>(null);

  if (history.length === 0) return null;

  // Count evaluations
  const evaluations = history.map(getEvaluation);
  const goodCount = evaluations.filter(e => e === 'good').length;
  const badCount = evaluations.filter(e => e === 'bad').length;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-bold text-gray-300 flex items-center gap-1.5">
          🔍 스팟 리플레이
        </div>
        <div className="text-xs text-gray-500">
          <span className="text-green-400">{goodCount}↑</span>
          {' '}
          <span className="text-red-400">{badCount}↓</span>
        </div>
      </div>

      <div className="space-y-1">
        {history.map((record, i) => {
          const evaluation = evaluations[i];
          const isExpanded = expandedHand === record.number;
          const handLabel = getHandLabel(record);
          const heroAction = getHeroPreflopAction(record);
          const pro = getProSuggestion(record);

          const bgColor = evaluation === 'good' ? 'border-l-green-500' :
                          evaluation === 'bad' ? 'border-l-red-500' :
                          'border-l-gray-600';

          return (
            <div key={record.number}>
              <button
                onClick={() => setExpandedHand(isExpanded ? null : record.number)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 transition text-left border-l-2 ${bgColor}`}
              >
                <span className="text-xs text-gray-500 w-5">#{record.number}</span>
                <span className="text-sm font-mono text-gray-300 w-10">{handLabel}</span>
                <span className="text-xs text-gray-500">{record.heroPosition}</span>
                <span className="flex-1" />
                <span className={`text-sm font-bold ${
                  record.heroStackChange > 0 ? 'text-green-400' :
                  record.heroStackChange < 0 ? 'text-red-400' :
                  'text-gray-500'
                }`}>
                  {record.heroStackChange > 0 ? '+' : ''}{record.heroStackChange.toFixed(1)}
                </span>
                <span className="text-gray-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="ml-3 mt-1 mb-2 p-3 bg-white/3 rounded-lg animate-slide-up text-xs space-y-2">
                  {/* Hero's preflop action */}
                  {heroAction && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">내 판단:</span>
                      <span className="text-gray-300 font-bold">
                        {heroAction === 'fold' ? '폴드' :
                         heroAction === 'call' ? '콜' :
                         heroAction === 'check' ? '체크' :
                         '레이즈'}
                      </span>
                    </div>
                  )}
                  {/* Pro suggestion */}
                  {pro && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">프로 추천:</span>
                      <span className={`font-bold ${evaluation === 'good' ? 'text-green-400' : evaluation === 'bad' ? 'text-red-400' : 'text-gray-300'}`}>
                        {pro.label}
                      </span>
                      {evaluation === 'good' && <span className="text-green-400">✓</span>}
                      {evaluation === 'bad' && <span className="text-red-400">✗</span>}
                    </div>
                  )}
                  {/* Result */}
                  {record.result && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">결과:</span>
                      <span className={`font-bold ${
                        record.result.winner === 'hero' ? 'text-green-400' :
                        record.result.winner === 'bot' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {record.result.winner === 'hero' ? '승리' :
                         record.result.winner === 'bot' ? '패배' : '무승부'}
                        {record.result.wonByFold ? ' (폴드)' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
