'use client';

import { useState } from 'react';
import { GLOSSARY_MAP } from '@/data/glossary';

type Props = {
  term: string;
  children?: React.ReactNode;
};

export default function GlossaryTip({ term, children }: Props) {
  const [show, setShow] = useState(false);
  const def = GLOSSARY_MAP[term];

  if (!def) return <>{children || term}</>;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(s => !s)}
    >
      <span className="border-b border-dashed border-indigo-400/50 text-indigo-300 cursor-help">
        {children || term}
      </span>
      {show && (
        <span className="absolute z-[60] bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-xs text-gray-300 leading-relaxed pointer-events-none animate-slide-up">
          <span className="font-bold text-indigo-300 block mb-0.5">{term}</span>
          {def}
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45 -mt-1" />
        </span>
      )}
    </span>
  );
}
