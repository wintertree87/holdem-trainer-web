'use client';

import { useState, useCallback } from 'react';
import { POSITION_ORDER, POSITION_INFO, SUIT_NAMES, RANKS, type Card } from '@/data/constants';
import { RFI_RANGES, FACING_RFI_RANGES, VS_3BET_RANGES } from '@/data/ranges';
import { generateHand, getHandNotation, getHandDescription } from '@/utils/hand';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from '@/utils/correct-action';
import { generateFlop, analyzeBoardTexture, evaluateHandStrength, type BoardTexture, type HandStrength } from '@/utils/board';
import { useSound } from '@/hooks/useSound';
import PokerTable from '@/components/PokerTable';
import GlossaryTip from '@/components/GlossaryTip';
import RangeChart from '@/components/RangeChart';

type Mode = 'rfi' | 'facing' | 'vs3bet' | 'cbet';

type Props = {
  onRecordResult: (mode: string, isCorrect: boolean) => void;
  onAddWrongNote: (note: { hand: string; position: string; vsPosition?: string; mode: string; myAnswer: string; correctAnswer: string }) => void;
  onIncrementDaily: () => void;
  stats: Record<string, { correct: number; wrong: number }>;
  total: number;
  accuracy: number;
  onOpenWrongNotes: () => void;
};

const ACTION_NAMES: Record<string, string> = {
  raise: '레이즈', fold: '폴드', call: '콜', limp: '림프',
  '3bet': '3bet', '4bet': '4bet', cbet: 'C-bet', check: '체크',
};

export default function PracticeTab({ onRecordResult, onAddWrongNote, onIncrementDaily, stats, total, accuracy, onOpenWrongNotes }: Props) {
  const [mode, setMode] = useState<Mode>('rfi');
  const [hand, setHand] = useState<Card[] | null>(null);
  const [notation, setNotation] = useState('');
  const [position, setPosition] = useState('UTG');
  const [vsPosition, setVsPosition] = useState<string | null>(null);
  const [board, setBoard] = useState<Card[]>([]);
  const [boardTexture, setBoardTexture] = useState<BoardTexture | null>(null);
  const [handStrength, setHandStrength] = useState<HandStrength | null>(null);
  const [result, setResult] = useState<{ correct: boolean; action: string; myAction: string; explanation: string } | null>(null);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [dealKey, setDealKey] = useState(0);
  const { playCorrect, playWrong } = useSound();

  const newHand = useCallback(() => {
    const cards = generateHand();
    const nota = getHandNotation(cards[0], cards[1]);
    setHand(cards);
    setNotation(nota);
    setResult(null);
    setDealKey(k => k + 1);

    let pos = position;
    let vsPos: string | null = null;

    if (mode === 'rfi') {
      const positions = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB'];
      pos = positions[Math.floor(Math.random() * positions.length)];
      setPosition(pos);
    } else if (mode === 'facing') {
      const keys = Object.keys(FACING_RFI_RANGES);
      const key = keys[Math.floor(Math.random() * keys.length)];
      const [myP, , vsP] = key.split('_');
      pos = myP; vsPos = vsP;
      setPosition(pos); setVsPosition(vsPos);
    } else if (mode === 'vs3bet') {
      const positions = ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB'];
      pos = positions[Math.floor(Math.random() * positions.length)];
      vsPos = pos === 'SB' ? 'BB' : 'IP';
      setPosition(pos); setVsPosition(vsPos);
    } else if (mode === 'cbet') {
      const positions = ['CO', 'BTN'];
      pos = positions[Math.floor(Math.random() * positions.length)];
      vsPos = 'BB';
      setPosition(pos); setVsPosition(vsPos);
      const flop = generateFlop(cards);
      setBoard(flop);
      const bt = analyzeBoardTexture(flop);
      setBoardTexture(bt);
      setHandStrength(evaluateHandStrength(cards, flop, bt));
    }
  }, [mode, position]);

  const makeDecision = useCallback((action: string) => {
    if (!hand || result) return;

    let correctAction: string;
    if (mode === 'rfi') correctAction = getCorrectAction_RFI(notation, position);
    else if (mode === 'facing') correctAction = getCorrectAction_Facing(notation, position, vsPosition!);
    else if (mode === 'cbet') correctAction = handStrength?.shouldCbet ? 'cbet' : 'check';
    else correctAction = getCorrectAction_Vs3bet(notation, position);

    const isCorrect = action === correctAction;
    setResult({
      correct: isCorrect,
      action: correctAction,
      myAction: action,
      explanation: isCorrect
        ? `정답! ${ACTION_NAMES[correctAction]}이(가) 맞습니다.`
        : `오답. 정답은 ${ACTION_NAMES[correctAction]}입니다.`,
    });

    if (isCorrect) {
      setSessionCorrect(c => c + 1);
      playCorrect();
    } else {
      setSessionWrong(c => c + 1);
      playWrong();
      onAddWrongNote({ hand: notation, position, vsPosition: vsPosition || undefined, mode, myAnswer: action, correctAnswer: correctAction });
    }

    onRecordResult(mode, isCorrect);
    onIncrementDaily();
  }, [hand, result, mode, notation, position, vsPosition, handStrength, onRecordResult, onAddWrongNote, onIncrementDaily, playCorrect, playWrong]);

  const getActionButtons = () => {
    if (mode === 'rfi') {
      return position === 'SB'
        ? [{ action: 'raise', label: '레이즈', color: 'from-green-600 to-green-500' }, { action: 'limp', label: '림프', color: 'from-blue-600 to-blue-500' }, { action: 'fold', label: '폴드', color: 'from-red-600 to-red-500' }]
        : [{ action: 'raise', label: '레이즈', color: 'from-green-600 to-green-500' }, { action: 'fold', label: '폴드', color: 'from-red-600 to-red-500' }];
    }
    if (mode === 'facing') return [{ action: '3bet', label: '3bet', color: 'from-purple-600 to-purple-500' }, { action: 'call', label: '콜', color: 'from-blue-600 to-blue-500' }, { action: 'fold', label: '폴드', color: 'from-red-600 to-red-500' }];
    if (mode === 'vs3bet') return [{ action: '4bet', label: '4bet', color: 'from-purple-600 to-purple-500' }, { action: 'call', label: '콜', color: 'from-blue-600 to-blue-500' }, { action: 'fold', label: '폴드', color: 'from-red-600 to-red-500' }];
    return [{ action: 'cbet', label: 'C-bet', color: 'from-green-600 to-green-500' }, { action: 'check', label: '체크', color: 'from-gray-600 to-gray-500' }];
  };

  // Mini donut chart
  const sessionTotal = sessionCorrect + sessionWrong;
  const sessionPct = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2 flex-wrap">
        {(['rfi', 'facing', 'vs3bet', 'cbet'] as Mode[]).map(m => (
          <button key={m} onClick={() => { setMode(m); setHand(null); setResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            {m === 'rfi' ? 'RFI' : m === 'facing' ? 'Facing RFI' : m === 'vs3bet' ? 'vs 3bet' : 'C-bet'}
          </button>
        ))}
      </div>

      {/* Stats with mini donut */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        {sessionTotal > 0 && (
          <div className="flex items-center gap-1.5">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" fill="none" stroke="#374151" strokeWidth="3" />
              <circle cx="10" cy="10" r="8" fill="none" stroke="#22c55e" strokeWidth="3"
                strokeDasharray={`${(sessionPct / 100) * 50.27} 50.27`}
                strokeDashoffset="12.57" strokeLinecap="round" />
            </svg>
            <span>{sessionCorrect}✓ {sessionWrong}✗</span>
          </div>
        )}
        <span>누적: {total}핸드 ({accuracy}%)</span>
        <button onClick={onOpenWrongNotes} className="text-amber-400 hover:text-amber-300 transition">오답노트</button>
      </div>

      {/* Game Area */}
      {!hand ? (
        <div className="text-center py-16">
          <button onClick={newHand} className="px-8 py-4 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-xl text-white text-lg font-bold hover:scale-105 active:scale-[0.98] transition shadow-lg shadow-indigo-500/20">
            연습 시작
          </button>
        </div>
      ) : (
        <>
          {/* Scenario */}
          <div className="text-center text-sm text-gray-400 mb-2">
            {mode === 'rfi' && <><GlossaryTip term={position}>{position}</GlossaryTip>에서 폴드로 돌아왔습니다</>}
            {mode === 'facing' && <><GlossaryTip term={vsPosition!}>{vsPosition}</GlossaryTip>가 오픈. <GlossaryTip term={position}>{position}</GlossaryTip>에서 어떻게?</>}
            {mode === 'vs3bet' && <><GlossaryTip term={position}>{position}</GlossaryTip>에서 오픈 후 {vsPosition}에서 <GlossaryTip term="3bet">3bet</GlossaryTip></>}
            {mode === 'cbet' && <><GlossaryTip term={position}>{position}</GlossaryTip>에서 오픈, {vsPosition}가 콜. 플랍에서?</>}
          </div>

          {/* Poker Table Visualization */}
          <PokerTable heroPosition={position} villainPosition={vsPosition} className="mb-2" />

          {/* Cards */}
          <div className="flex justify-center gap-3 mb-3">
            {hand.map((card, i) => (
              <div key={`${dealKey}-${i}`} className={`animate-card-deal w-[70px] h-[95px] bg-white rounded-lg flex flex-col items-center justify-center font-bold shadow-lg transition-all duration-300 ${
                result ? (result.correct ? 'ring-2 ring-green-500 shadow-green-500/20' : 'ring-2 ring-red-500 shadow-red-500/20') : ''
              } ${result && !result.correct ? 'animate-shake' : ''} ${
                card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-gray-800'
              }`} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="text-2xl">{card.rank}</div>
                <div className="text-3xl">{card.suit}</div>
              </div>
            ))}
          </div>

          <div className="text-center text-sm text-gray-300 mb-4">{notation} ({getHandDescription(notation)})</div>

          {/* Board (C-bet) */}
          {mode === 'cbet' && board.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-center gap-2 mb-2">
                {board.map((card, i) => (
                  <div key={`${dealKey}-b-${i}`} className={`animate-card-deal w-[55px] h-[75px] bg-white rounded-lg flex flex-col items-center justify-center font-bold ${
                    card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-gray-800'
                  }`} style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                    <div className="text-lg">{card.rank}</div>
                    <div className="text-xl">{card.suit}</div>
                  </div>
                ))}
              </div>
              {boardTexture && (
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {boardTexture.tags.map(tag => (
                    <span key={tag} className="text-xs bg-white/10 px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!result && (
            <div className="flex gap-2 justify-center">
              {getActionButtons().map(btn => (
                <button key={btn.action} onClick={() => makeDecision(btn.action)}
                  className={`px-6 py-3 bg-gradient-to-br ${btn.color} rounded-xl text-white font-bold hover:scale-105 active:scale-[0.97] transition-all duration-200 shadow-lg`}>
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`animate-slide-up p-4 rounded-xl ${result.correct ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <div className={`text-base font-bold mb-1 ${result.correct ? 'text-green-400' : 'text-red-400'}`}>
                {result.correct ? '정답!' : '오답!'}
              </div>
              <div className="text-sm text-gray-300">{result.explanation}</div>

              {/* Range Chart (RFI/Facing/vs3bet only) */}
              {mode !== 'cbet' && (
                <RangeChart
                  mode={mode === 'facing' ? 'facing' : mode === 'vs3bet' ? 'vs3bet' : 'rfi'}
                  position={position}
                  vsPosition={vsPosition || undefined}
                  currentHand={notation}
                />
              )}

              <button onClick={newHand} className="mt-3 px-6 py-2.5 bg-indigo-500 rounded-lg text-white text-sm font-bold hover:bg-indigo-600 transition">
                다음 핸드
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
