'use client';

import { useEffect } from 'react';

type Props = {
  onClose: () => void;
};

const GLOSSARY = [
  {
    category: '게임 모드',
    emoji: '🎯',
    terms: [
      { term: 'RFI (Raise First In)', def: '아무도 레이즈하지 않았을 때 처음으로 레이즈하는 것. "오픈"이라고도 함.' },
      { term: 'Facing RFI', def: '상대방이 먼저 오픈(RFI)했을 때 내가 어떻게 대응할지 결정하는 상황. 3bet/콜/폴드 중 선택.' },
      { term: '3bet', def: '오픈 레이즈에 대한 리레이즈. 블라인드(1bet) → 오픈(2bet) → 3bet 순서.' },
      { term: '4bet', def: '3bet에 대한 리레이즈. 매우 강한 핸드(AA, KK 등)나 블러프로 사용.' },
      { term: 'C-bet (Continuation Bet)', def: '프리플랍에서 마지막으로 레이즈한 사람이 플랍에서 계속해서 베팅하는 것.' },
    ],
  },
  {
    category: '포지션 (9인 테이블)',
    emoji: '🪑',
    terms: [
      { term: 'UTG (Under The Gun)', def: '빅블라인드 다음으로 첫 번째 행동. 가장 불리한 포지션.' },
      { term: 'UTG+1, UTG+2', def: 'UTG 다음 포지션들. 얼리 포지션(EP)으로 타이트하게 플레이.' },
      { term: 'LJ (Lojack)', def: '미들 포지션의 시작. 하이잭 바로 앞 자리.' },
      { term: 'HJ (Hijack)', def: '미들~레이트 포지션. 컷오프 앞 자리.' },
      { term: 'CO (Cutoff)', def: '버튼 바로 앞 자리. 레이트 포지션으로 넓은 레인지 플레이.' },
      { term: 'BTN (Button)', def: '딜러 버튼 위치. 가장 유리한 포지션.' },
      { term: 'SB (Small Blind)', def: '소액 강제 베팅. 포스트플랍에서 첫 번째로 행동해서 불리함.' },
      { term: 'BB (Big Blind)', def: '대액 강제 베팅. 프리플랍 마지막 행동이지만 포스트플랍에서 OOP.' },
    ],
  },
  {
    category: '핸드 표기법',
    emoji: '🃏',
    terms: [
      { term: 's (Suited)', def: '같은 무늬. 예: AKs = 에이스-킹 같은 무늬' },
      { term: 'o (Offsuit)', def: '다른 무늬. 예: AKo = 에이스-킹 다른 무늬' },
      { term: '포켓 페어', def: '같은 숫자 두 장. 예: AA, KK, QQ, 77 등' },
    ],
  },
  {
    category: '보드 텍스처 (C-bet)',
    emoji: '📊',
    terms: [
      { term: '드라이 (Dry)', def: '드로우가 적은 보드. 예: K♠ 7♥ 2♦. C-bet 하기 좋음.' },
      { term: '웻 (Wet)', def: '드로우가 많은 보드. 예: J♠ T♠ 9♥. 조심해서 C-bet.' },
      { term: '모노톤 (Monotone)', def: '세 장 모두 같은 무늬. 플러시 가능성 높음.' },
      { term: '레인보우 (Rainbow)', def: '세 장 모두 다른 무늬. 플러시 드로우 없음.' },
    ],
  },
  {
    category: '핸드 강도',
    emoji: '💪',
    terms: [
      { term: '오버페어 (Overpair)', def: '보드의 모든 카드보다 높은 포켓 페어. 예: QQ on J-7-3 보드' },
      { term: '탑페어 (Top Pair)', def: '보드의 가장 높은 카드와 페어. 키커 강도가 중요.' },
      { term: 'TPTK (Top Pair Top Kicker)', def: '탑페어 + 가장 높은 키커. 예: AK on K-7-3 보드' },
      { term: '드로우 (Draw)', def: '완성되면 강한 핸드가 되는 미완성 핸드.' },
      { term: '에어 (Air)', def: '보드와 연결이 없는 약한 핸드. 블러프로만 이길 수 있음.' },
    ],
  },
  {
    category: '기타 용어',
    emoji: '📈',
    terms: [
      { term: 'IP (In Position)', def: '상대방보다 뒤에서 행동. 정보 이점이 있어 유리함.' },
      { term: 'OOP (Out Of Position)', def: '상대방보다 먼저 행동. 정보 불이익으로 불리함.' },
      { term: '레인지 (Range)', def: '특정 상황에서 플레이하는 핸드들의 집합. 차트로 표현.' },
      { term: '밸류 (Value)', def: '강한 핸드로 상대의 콜을 받아 팟을 키우는 것.' },
      { term: '블러프 (Bluff)', def: '약한 핸드로 베팅해서 상대를 폴드시키는 것.' },
      { term: '블로커 (Blocker)', def: '상대가 특정 핸드를 가질 확률을 줄이는 카드.' },
    ],
  },
];

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
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
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
