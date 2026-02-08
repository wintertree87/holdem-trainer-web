'use client';

import { useEffect } from 'react';
import type { WrongNote } from '@/hooks/useWrongNotes';

const MODE_NAMES: Record<string, string> = {
  rfi: 'RFI',
  facing: 'Facing RFI',
  vs3bet: 'vs 3bet',
  cbet: 'C-bet',
};

const ACTION_NAMES: Record<string, string> = {
  raise: '레이즈', fold: '폴드', call: '콜', limp: '림프',
  '3bet': '3bet', '4bet': '4bet', cbet: 'C-bet', check: '체크',
};

type Props = {
  notes: WrongNote[];
  onClose: () => void;
  onClear: () => void;
  onStartDrill: () => void;
};

export default function WrongNotesModal({ notes, onClose, onClear, onStartDrill }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#1a1d25] rounded-2xl w-[90vw] max-w-[500px] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-gray-200">오답 노트</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {notes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">아직 오답이 없습니다. 연습을 시작하세요!</p>
          ) : (
            <div className="space-y-2.5">
              {notes.map((note, i) => (
                <div key={note.id || i} className="bg-white/5 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base font-bold text-amber-400">{note.hand}</span>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-400">
                      {MODE_NAMES[note.mode] || note.mode}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {note.position}{note.vsPosition ? ` vs ${note.vsPosition}` : ''}
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-red-400">내 답: {ACTION_NAMES[note.myAnswer] || note.myAnswer}</span>
                    <span className="text-green-400">정답: {ACTION_NAMES[note.correctAnswer] || note.correctAnswer}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notes.length > 0 && (
          <div className="flex gap-2 px-5 py-4 border-t border-gray-800">
            <button onClick={onStartDrill} className="flex-1 py-2.5 bg-indigo-500 rounded-xl text-white text-sm font-bold hover:bg-indigo-600 transition">
              복습 드릴
            </button>
            <button onClick={onClear} className="px-4 py-2.5 bg-gray-700 rounded-xl text-gray-300 text-sm font-bold hover:bg-gray-600 transition">
              전체 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
