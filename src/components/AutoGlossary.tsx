'use client';

import React from 'react';
import GlossaryTip from './GlossaryTip';
import { GLOSSARY, GLOSSARY_MAP } from '@/data/glossary';

// Collect all short keys that should be auto-detected
// Exclude very basic terms that appear everywhere (would be too noisy)
const SKIP_AUTO = new Set([
  '폴드', '콜', '레이즈', '밸류', '블러프', '드로우',
  '프리플랍', '포스트플랍', '에어',
]);

const AUTO_TERMS = GLOSSARY
  .flatMap(c => c.terms.map(t => t.short))
  .filter(t => !SKIP_AUTO.has(t) && t.length >= 2)
  // Sort by length descending so longer matches take priority
  .sort((a, b) => b.length - a.length);

// Build regex: escape special chars, join with |
const TERM_REGEX = new RegExp(
  `(${AUTO_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
  'g'
);

export default function AutoGlossary({ text }: { text: string }) {
  if (!text) return null;

  const parts = text.split(TERM_REGEX);

  return (
    <>
      {parts.map((part, i) => {
        if (GLOSSARY_MAP[part] && !SKIP_AUTO.has(part)) {
          return <GlossaryTip key={i} term={part} />;
        }
        // Preserve newlines as <br>
        if (part.includes('\n')) {
          const lines = part.split('\n');
          return (
            <React.Fragment key={i}>
              {lines.map((line, j) => (
                <React.Fragment key={j}>
                  {j > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        }
        return part;
      })}
    </>
  );
}
