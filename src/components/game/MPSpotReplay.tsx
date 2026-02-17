'use client';

import { useState } from 'react';
import { type MPHandRecord } from '@/hooks/useMultiplayerSession';
import { getHandNotation } from '@/utils/hand';
import { getCorrectAction_RFI } from '@/utils/correct-action';

const BOT_NAMES: Record<string, string> = {
  hero: '나',
  bot1: 'Bot 1',
  bot2: 'Bot 2',
  bot3: 'Bot 3',
  bot4: 'Bot 4',
  bot5: 'Bot 5',
};

type Props = {
  history: MPHandRecord[];
};

function getHeroPreflopAction(record: MPHandRecord): string | null {
  if (!record.preflopActions) return null;
  const heroAction = record.preflopActions.find(a => a.playerId === 'hero');
  if (!heroAction) return null;
  return heroAction.action.type;
}

function getHandLabel(record: MPHandRecord): string {
  if (!record.heroHand || record.heroHand.length < 2) return '??';
  return getHandNotation(record.heroHand[0], record.heroHand[1]);
}

function getProSuggestion(record: MPHandRecord): { action: string; label: string } | null {
  if (!record.heroHand || !record.heroPosition) return null;
  const notation = getHandNotation(record.heroHand[0], record.heroHand[1]);
  const correct = getCorrectAction_RFI(notation, record.heroPosition);
  const label = correct === 'raise' ? '레이즈' : correct === 'limp' ? '림프' : '폴드';
  return { action: correct, label };
}

function getEvaluation(record: MPHandRecord): 'good' | 'neutral' | 'bad' {
  const heroAction = getHeroPreflopAction(record);
  const pro = getProSuggestion(record);
  if (!heroAction || !pro) return 'neutral';

  const heroMapped = heroAction === 'fold' ? 'fold'
    : heroAction === 'call' ? 'call'
    : 'raise';

  if (heroMapped === pro.action) return 'good';
  if (heroMapped === 'fold' && pro.action === 'raise') return 'bad';
  if (heroMapped !== 'fold' && pro.action === 'fold') return 'bad';
  return 'neutral';
}

function fmt(n: number): string {
  return n % 1 === 0 ? `${n}` : n.toFixed(1);
}

export default function MPSpotReplay({ history }: Props) {
  const [expandedHand, setExpandedHand] = useState<number | null>(null);

  if (history.length === 0) return null;

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

          // Count active players in this hand
          const activeCount = record.allPlayers?.length ?? 6;

          // Winners
          const winners = record.result?.pots.flatMap(p => p.winners) ?? [];
          const uniqueWinners = [...new Set(winners)];

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
                  {record.heroStackChange > 0 ? '+' : ''}{fmt(record.heroStackChange)}
                </span>
                <span className="text-gray-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="ml-3 mt-1 mb-2 p-3 bg-white/3 rounded-lg animate-slide-up text-xs space-y-2">
                  {/* Participants */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">참가자:</span>
                    <span className="text-gray-300">{activeCount}명</span>
                  </div>
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
                  {/* Winner */}
                  {uniqueWinners.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">승자:</span>
                      <span className={`font-bold ${uniqueWinners.includes('hero') ? 'text-green-400' : 'text-gray-300'}`}>
                        {uniqueWinners.map(w => BOT_NAMES[w] || w).join(', ')}
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
