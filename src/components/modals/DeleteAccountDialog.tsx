'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

type Props = {
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteAccountDialog({ onClose, onDeleted }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDelete = async () => {
    if (confirmText !== '탈퇴합니다') return;
    setDeleting(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('로그인 상태가 아닙니다.');
        setDeleting(false);
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '탈퇴 처리 중 오류가 발생했습니다.');
      }

      await supabase.auth.signOut();
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : '탈퇴 처리 중 오류가 발생했습니다.');
      setDeleting(false);
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
          <h2 className="text-lg font-bold text-red-400">회원탈퇴</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none cursor-pointer">&times;</button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {step === 1 && (
            <>
              <div className="text-center mb-5">
                <div className="text-3xl mb-3">😢</div>
                <p className="text-gray-200 font-medium mb-2">정말 탈퇴하시겠습니까?</p>
                <p className="text-sm text-gray-400 leading-6">
                  탈퇴하면 학습 기록, XP, 모의게임 전적 등<br />
                  <span className="text-red-400 font-bold">모든 데이터가 영구 삭제</span>됩니다.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-200 text-sm font-medium transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-red-400 text-sm font-medium transition cursor-pointer"
                >
                  탈퇴 진행
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-gray-400 mb-3">
                확인을 위해 아래에 <span className="text-red-400 font-bold">&apos;탈퇴합니다&apos;</span>를 입력해주세요.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="탈퇴합니다"
                className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500 transition"
                autoFocus
              />
              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { setStep(1); setConfirmText(''); setError(''); }}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-gray-200 text-sm font-medium transition cursor-pointer"
                >
                  뒤로
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== '탈퇴합니다' || deleting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 rounded-xl text-white text-sm font-bold transition cursor-pointer"
                >
                  {deleting ? '처리 중...' : '회원탈퇴'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
