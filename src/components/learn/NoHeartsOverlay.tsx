'use client';

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

type Props = {
  nextRecoveryMs: number | null;
  onBack: () => void;
};

export default function NoHeartsOverlay({ nextRecoveryMs, onBack }: Props) {
  return (
    <div className="max-w-[400px] mx-auto mt-16 text-center">
      <div className="text-5xl mb-4">💔</div>
      <div className="text-xl font-bold text-gray-200 mb-2">하트가 없습니다</div>
      <p className="text-sm text-gray-400 mb-6 leading-6">
        하트가 회복될 때까지 잠시 쉬어가세요.<br />
        자유연습과 모의게임은 하트 없이 가능해요!
      </p>

      {nextRecoveryMs !== null && (
        <div className="bg-white/5 rounded-xl p-4 mb-6 inline-block">
          <div className="text-xs text-gray-500 mb-1">다음 하트 회복까지</div>
          <div className="text-2xl font-bold text-red-400">{formatTime(nextRecoveryMs)}</div>
        </div>
      )}

      <div>
        <button
          onClick={onBack}
          className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white text-sm font-bold transition cursor-pointer"
        >
          스킬 트리로 돌아가기
        </button>
      </div>
    </div>
  );
}
