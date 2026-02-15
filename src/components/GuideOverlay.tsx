'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { mdToHtml } from '@/utils/markdown';

type GuideLevel = 'beginner' | 'intermediate' | 'advanced' | 'reference';

const GUIDE_PATHS: Record<GuideLevel, string> = {
  beginner: '/docs/홀덤 공략집.md',
  intermediate: '/docs/홀덤 공략집 - 중급편.md',
  advanced: '/docs/홀덤 공략집 - 고급편.md',
  reference: '/docs/홀덤 확률표.md',
};

const GUIDE_LABELS: { level: GuideLevel; label: string; color: string }[] = [
  { level: 'beginner', label: '초급', color: 'bg-green-500' },
  { level: 'intermediate', label: '중급', color: 'bg-yellow-500' },
  { level: 'advanced', label: '고급', color: 'bg-red-500' },
  { level: 'reference', label: '확률표', color: 'bg-blue-500' },
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
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm cursor-pointer">
          &larr; 돌아가기
        </button>
        <span className="font-bold text-gray-200 text-sm">공략집</span>
        <div className="flex gap-1.5 ml-auto">
          {GUIDE_LABELS.map(({ level, label, color }) => (
            <button
              key={level}
              onClick={() => switchLevel(level)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
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
      <div ref={bodyRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-8">
        <div className="max-w-[640px] mx-auto">
          {loading ? (
            <p className="text-center text-gray-500 py-10">로딩 중...</p>
          ) : (
            <article
              className="guide-article"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-10 h-10 bg-indigo-500 rounded-full text-white font-bold shadow-lg hover:bg-indigo-600 transition cursor-pointer"
        >
          &uarr;
        </button>
      )}
    </div>
  );
}
