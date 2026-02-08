'use client';

import { useEffect } from 'react';
import { GLOSSARY } from '@/data/glossary';

type Props = {
  onClose: () => void;
};

export default function GlossaryModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#1a1d25] rounded-2xl w-[90vw] max-w-[550px] max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-gray-200">홀덤 용어사전</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none cursor-pointer">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {GLOSSARY.map(cat => (
            <div key={cat.category} className="mb-5">
              <h3 className="text-sm font-bold text-gray-300 mb-2.5">{cat.emoji} {cat.category}</h3>
              <div className="space-y-2">
                {cat.terms.map(t => (
                  <div key={t.term} className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm font-bold text-indigo-300 mb-0.5">{t.term}</div>
                    <div className="text-xs text-gray-400 leading-5">{t.def}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
