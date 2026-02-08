'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { mdToHtml } from '@/utils/markdown';

type GuideLevel = 'beginner' | 'intermediate' | 'advanced';

const GUIDE_PATHS: Record<GuideLevel, string> = {
  beginner: '/docs/홀덤 공략집.md',
  intermediate: '/docs/홀덤 공략집 - 중급편.md',
  advanced: '/docs/홀덤 공략집 - 고급편.md',
};

const GUIDE_LABELS: { level: GuideLevel; label: string; color: string }[] = [
  { level: 'beginner', label: '초급', color: 'bg-green-500' },
  { level: 'intermediate', label: '중급', color: 'bg-yellow-500' },
  { level: 'advanced', label: '고급', color: 'bg-red-500' },
];

type Props = {
  onClose: () => void;
};

export default function GuideOverlay({ onClose }: Props) {
  const [currentLevel, setCurrentLevel] = useState<GuideLevel>('beginner');
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const cache = useRef<Record<string, string>>({});

  const loadContent = useCallback(async (level: GuideLevel) => {
    if (cache.current[level]) {
      setHtml(mdToHtml(cache.current[level]));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(GUIDE_PATHS[level]);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const md = await res.text();
      cache.current[level] = md;
      setHtml(mdToHtml(md));
    } catch {
      setHtml('<p style="text-align:center;color:#9ca3af;padding:40px;">공략집 파일을 불러올 수 없습니다.</p>');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent(currentLevel);
  }, [currentLevel, loadContent]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleScroll = () => {
    if (bodyRef.current) {
      setShowScrollTop(bodyRef.current.scrollTop > 300);
    }
  };

  const scrollToTop = () => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchLevel = (level: GuideLevel) => {
    setCurrentLevel(level);
    bodyRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">
          &larr; 돌아가기
        </button>
        <span className="font-bold text-gray-200 text-sm">공략집</span>
        <div className="flex gap-1.5 ml-auto">
          {GUIDE_LABELS.map(({ level, label, color }) => (
            <button
              key={level}
              onClick={() => switchLevel(level)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                currentLevel === level ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div ref={bodyRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-[700px] mx-auto">
          {loading ? (
            <p className="text-center text-gray-500 py-10">로딩 중...</p>
          ) : (
            <article
              className="prose prose-invert prose-sm max-w-none
                prose-headings:text-gray-200 prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-gray-800 prose-h2:pb-2 prose-h2:mt-8
                prose-p:text-gray-400 prose-p:leading-7
                prose-li:text-gray-400 prose-strong:text-gray-200
                prose-code:text-indigo-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-blockquote:border-indigo-500 prose-blockquote:text-gray-400
                prose-table:text-sm prose-th:text-gray-300 prose-td:text-gray-400
                prose-hr:border-gray-800"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-10 h-10 bg-indigo-500 rounded-full text-white font-bold shadow-lg hover:bg-indigo-600 transition"
        >
          &uarr;
        </button>
      )}
    </div>
  );
}
