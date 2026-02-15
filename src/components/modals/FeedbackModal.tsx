'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

type Props = {
  onClose: () => void;
};

export default function FeedbackModal({ onClose }: Props) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('feedback').insert({
        user_id: user?.id ?? null,
        message: message.trim(),
      });
      setDone(true);
    } catch {
      // silently fail — don't block user
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1a1d25] rounded-2xl w-[90vw] max-w-[440px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-gray-200">피드백 보내기</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none cursor-pointer">&times;</button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {done ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-3">🙏</div>
              <p className="text-gray-200 font-medium mb-1">감사합니다!</p>
              <p className="text-sm text-gray-400">피드백이 전달되었습니다.</p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white text-sm font-medium transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-3">
                버그, 건의, 칭찬 뭐든 좋아요. 자유롭게 남겨주세요.
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="여기에 피드백을 입력하세요..."
                rows={4}
                maxLength={1000}
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition"
                autoFocus
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-600">{message.length}/1000</span>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitting}
                  className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition cursor-pointer"
                >
                  {submitting ? '보내는 중...' : '보내기'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
