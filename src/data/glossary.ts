export type GlossaryTerm = {
  term: string;
  short: string;  // short key for inline matching
  def: string;
};

export type GlossaryCategory = {
  category: string;
  emoji: string;
  terms: GlossaryTerm[];
};

export const GLOSSARY: GlossaryCategory[] = [
  {
    category: '게임 모드',
    emoji: '🎯',
    terms: [
      { term: 'RFI (Raise First In)', short: 'RFI', def: '아무도 레이즈하지 않았을 때 처음으로 레이즈하는 것. "오픈"이라고도 함.' },
      { term: 'Facing RFI', short: 'Facing RFI', def: '상대방이 먼저 오픈(RFI)했을 때 내가 어떻게 대응할지 결정하는 상황. 3bet/콜/폴드 중 선택.' },
      { term: '3bet', short: '3bet', def: '오픈 레이즈에 대한 리레이즈. 블라인드(1bet) → 오픈(2bet) → 3bet 순서.' },
      { term: '4bet', short: '4bet', def: '3bet에 대한 리레이즈. 매우 강한 핸드(AA, KK 등)나 블러프로 사용.' },
      { term: 'C-bet (Continuation Bet)', short: 'C-bet', def: '프리플랍에서 마지막으로 레이즈한 사람이 플랍에서 계속해서 베팅하는 것.' },
      { term: 'C벳', short: 'C벳', def: '프리플랍에서 마지막으로 레이즈한 사람이 플랍에서 계속해서 베팅하는 것.' },
    ],
  },
  {
    category: '포지션 (9인 테이블)',
    emoji: '🪑',
    terms: [
      { term: 'UTG (Under The Gun)', short: 'UTG', def: '빅블라인드 다음으로 첫 번째 행동. 가장 불리한 포지션.' },
      { term: 'UTG+1, UTG+2', short: 'UTG+1', def: 'UTG 다음 포지션들. 얼리 포지션(EP)으로 타이트하게 플레이.' },
      { term: 'LJ (Lojack)', short: 'LJ', def: '미들 포지션의 시작. 하이잭 바로 앞 자리.' },
      { term: 'HJ (Hijack)', short: 'HJ', def: '미들~레이트 포지션. 컷오프 앞 자리.' },
      { term: 'CO (Cutoff)', short: 'CO', def: '버튼 바로 앞 자리. 레이트 포지션으로 넓은 레인지 플레이.' },
      { term: 'BTN (Button)', short: 'BTN', def: '딜러 버튼 위치. 가장 유리한 포지션.' },
      { term: 'SB (Small Blind)', short: 'SB', def: '소액 강제 베팅. 포스트플랍에서 첫 번째로 행동해서 불리함.' },
      { term: 'BB (Big Blind)', short: 'BB', def: '대액 강제 베팅. 프리플랍 마지막 행동이지만 포스트플랍에서 OOP.' },
    ],
  },
  {
    category: '핸드 표기법',
    emoji: '🃏',
    terms: [
      { term: 's (Suited)', short: '수티드', def: '같은 무늬. 예: AKs = 에이스-킹 같은 무늬' },
      { term: 'o (Offsuit)', short: '오프수트', def: '다른 무늬. 예: AKo = 에이스-킹 다른 무늬' },
      { term: '포켓 페어', short: '포켓 페어', def: '같은 숫자 두 장. 예: AA, KK, QQ, 77 등' },
    ],
  },
  {
    category: '보드 텍스처 (C-bet)',
    emoji: '📊',
    terms: [
      { term: '드라이 (Dry)', short: '드라이', def: '드로우가 적은 보드. 예: K♠ 7♥ 2♦. C-bet 하기 좋음.' },
      { term: '웻 (Wet)', short: '웻', def: '드로우가 많은 보드. 예: J♠ T♠ 9♥. 조심해서 C-bet.' },
      { term: '모노톤 (Monotone)', short: '모노톤', def: '세 장 모두 같은 무늬. 플러시 가능성 높음.' },
      { term: '레인보우 (Rainbow)', short: '레인보우', def: '세 장 모두 다른 무늬. 플러시 드로우 없음.' },
    ],
  },
  {
    category: '핸드 강도',
    emoji: '💪',
    terms: [
      { term: '넛 (Nut)', short: '넛', def: '그 상황에서 가능한 최강의 핸드. "넛 플러시" = 가장 높은 플러시.' },
      { term: '메이드 핸드 (Made Hand)', short: '메이드 핸드', def: '이미 완성된 핸드. 드로우(미완성)의 반대 개념.' },
      { term: '오버페어 (Overpair)', short: '오버페어', def: '보드의 모든 카드보다 높은 포켓 페어. 예: QQ on J-7-3 보드' },
      { term: '탑페어 (Top Pair)', short: '탑페어', def: '보드의 가장 높은 카드와 페어. 키커 강도가 중요.' },
      { term: 'TPTK (Top Pair Top Kicker)', short: 'TPTK', def: '탑페어 + 최고 키커. 예: AK로 K-7-3 보드 → 킹 페어 + 에이스 키커.' },
      { term: '미들페어 (Middle Pair)', short: '미들페어', def: '보드의 중간 카드와 페어. 탑페어보다 약하고 주의 필요.' },
      { term: '언더페어 (Under Pair)', short: '언더페어', def: '보드의 모든 카드보다 낮은 포켓 페어. 예: 55 on Q-9-7 보드.' },
      { term: '셋 (Set)', short: '셋', def: '포켓 페어 + 보드 1장으로 만든 쓰리카드. 아주 강한 핸드!' },
      { term: '트립스 (Trips)', short: '트립스', def: '내 1장 + 보드 2장으로 만든 쓰리카드. 셋보다 약간 약함.' },
      { term: '투페어 (Two Pair)', short: '투페어', def: '페어가 2개. 예: AK로 A-K-5 보드 → 에이스 페어 + 킹 페어.' },
      { term: '풀하우스 (Full House)', short: '풀하우스', def: '쓰리카드 + 페어. 예: KKK + 77. 매우 강한 핸드.' },
      { term: '드로우 (Draw)', short: '드로우', def: '완성되면 강한 핸드가 되는 미완성 핸드.' },
      { term: '에어 (Air)', short: '에어', def: '보드와 연결이 없는 약한 핸드. 블러프로만 이길 수 있음.' },
    ],
  },
  {
    category: '드로우 & 확률',
    emoji: '🎲',
    terms: [
      { term: '아웃 (Out)', short: '아웃', def: '내 핸드를 완성시켜줄 남은 카드 수. 아웃이 많을수록 완성 확률 높음.' },
      { term: '플러시 드로우 (Flush Draw)', short: '플러시 드로우', def: '같은 무늬 4장. 1장만 더 오면 플러시 완성. 9 아웃.' },
      { term: '넛 플러시 드로우', short: '넛 플러시 드로우', def: '에이스를 포함한 플러시 드로우. 완성되면 가장 높은 플러시.' },
      { term: 'OESD', short: 'OESD', def: '오픈엔드 스트레이트 드로우. 양쪽 끝으로 스트레이트 가능. 예: 5-6-7-8 → 4 또는 9가 오면 완성. 8 아웃.' },
      { term: '거트샷 (Gutshot)', short: '거트샷', def: '가운데 1장이 빠진 스트레이트 드로우. 예: 5-6-□-8-9 → 7만 필요. 4 아웃.' },
      { term: '콤보 드로우 (Combo Draw)', short: '콤보 드로우', def: '플러시 드로우 + 스트레이트 드로우가 동시에 있는 상태. 아웃이 많아서 매우 강력!' },
      { term: '팟 오즈 (Pot Odds)', short: '팟 오즈', def: '내가 넣어야 할 금액 대비 딸 수 있는 금액의 비율. 콜할지 판단하는 수학적 기준.' },
      { term: '임플라이드 오즈 (Implied Odds)', short: '임플라이드 오즈', def: '드로우 완성 시 추가로 딸 수 있는 미래 수익까지 포함한 오즈. 팟 오즈의 확장 개념.' },
      { term: '브레이크이븐 (Break-even)', short: '브레이크이븐', def: '손해도 이익도 아닌 분기점. "브레이크이븐 확률" = 콜이 손해 안 되려면 필요한 최소 승률.' },
      { term: 'Rule of 4', short: 'Rule of 4', def: '플랍에서 아웃 수 × 4 = 턴+리버까지 완성 확률(%). 빠른 암산법.' },
      { term: 'Rule of 2', short: 'Rule of 2', def: '턴에서 아웃 수 × 2 = 리버까지 완성 확률(%). 빠른 암산법.' },
    ],
  },
  {
    category: '전략 용어',
    emoji: '🧠',
    terms: [
      { term: '림프 (Limp)', short: '림프', def: '레이즈 없이 빅블라인드만큼만 넣고 참여. SB에서 가끔 사용.' },
      { term: '도미네이트 (Dominate)', short: '도미네이트', def: '상대 핸드를 압도적으로 이기는 상태. 예: AK vs AQ → AQ가 도미네이트됨.' },
      { term: '레인지 어드밴티지', short: '레인지 어드밴티지', def: '특정 보드에서 내 전체 핸드 범위가 상대보다 유리한 상태.' },
      { term: '슬로우 플레이 (Slow Play)', short: '슬로우 플레이', def: '매우 강한 핸드를 일부러 약하게 플레이해서 상대 베팅을 유도하는 전략.' },
      { term: '벳 사이징 (Bet Sizing)', short: '벳 사이징', def: '베팅 금액을 팟 대비 얼마로 할지 결정하는 것. 상황에 따라 1/3~풀팟.' },
      { term: '밸류 벳 (Value Bet)', short: '밸류 벳', def: '내가 이길 때 상대 콜을 받아 돈을 따기 위한 베팅.' },
      { term: '보호 벳 (Protection Bet)', short: '보호 벳', def: '상대 드로우를 비싸게 만들어 완성을 막는 베팅.' },
      { term: '배럴 (Barrel)', short: '배럴', def: '연속적인 베팅. 더블 배럴 = 플랍+턴 연속 베팅, 트리플 배럴 = 리버까지.' },
      { term: '체크-폴드', short: '체크-폴드', def: '체크한 뒤 상대가 베팅하면 폴드. 약한 핸드에서 사용.' },
      { term: '멀티웨이 (Multiway)', short: '멀티웨이', def: '3명 이상이 팟에 참여한 상태. 헤즈업보다 강한 핸드가 필요.' },
      { term: '헤즈업 (Heads-up)', short: '헤즈업', def: '딱 2명만 대결하는 상태.' },
      { term: '수티드 커넥터', short: '수티드 커넥터', def: '같은 무늬의 연속 숫자. 예: 7♠8♠. 스트레이트+플러시 동시 가능.' },
      { term: '밸런스 (Balance)', short: '밸런스', def: '밸류 핸드와 블러프를 적절히 섞어 상대가 읽기 어렵게 만드는 전략.' },
    ],
  },
  {
    category: '기타 용어',
    emoji: '📈',
    terms: [
      { term: 'IP (In Position)', short: 'IP', def: '상대방보다 뒤에서 행동. 정보 이점이 있어 유리함.' },
      { term: 'OOP (Out Of Position)', short: 'OOP', def: '상대방보다 먼저 행동. 정보 불이익으로 불리함.' },
      { term: 'EP (Early Position)', short: 'EP', def: '앞자리(UTG~UTG+2). 뒤에 많은 사람이 남아서 타이트하게 플레이.' },
      { term: 'MP (Middle Position)', short: 'MP', def: '중간자리(LJ~HJ). EP보다 넓지만 LP보다 신중하게.' },
      { term: 'LP (Late Position)', short: 'LP', def: '뒷자리(CO~BTN). 가장 넓게 플레이할 수 있는 유리한 자리.' },
      { term: '레인지 (Range)', short: '레인지', def: '특정 상황에서 플레이하는 핸드들의 집합. 차트로 표현.' },
      { term: '밸류 (Value)', short: '밸류', def: '강한 핸드로 상대의 콜을 받아 팟을 키우는 것.' },
      { term: '블러프 (Bluff)', short: '블러프', def: '약한 핸드로 베팅해서 상대를 폴드시키는 것.' },
      { term: '블로커 (Blocker)', short: '블로커', def: '상대가 특정 핸드를 가질 확률을 줄이는 카드.' },
      { term: '프리플랍', short: '프리플랍', def: '커뮤니티 카드가 깔리기 전, 포켓 카드 2장만으로 베팅하는 첫 라운드.' },
      { term: '포스트플랍', short: '포스트플랍', def: '플랍(3장), 턴(4번째), 리버(5번째) 카드가 나온 이후 베팅 라운드.' },
      { term: '폴드', short: '폴드', def: '핸드를 포기하는 것. 이미 넣은 칩은 잃지만 추가 손실을 방지.' },
      { term: '콜', short: '콜', def: '상대의 베팅 금액과 같은 금액을 넣어 팟에 참여.' },
      { term: '레이즈', short: '레이즈', def: '상대의 베팅보다 더 많은 금액을 넣는 공격적 행동.' },
      { term: '키커', short: '키커', def: '페어가 같을 때 승부를 가리는 나머지 카드. 예: AK vs AQ - 킹이 키커.' },
    ],
  },
];

// Flat lookup map for quick tooltip resolution
export const GLOSSARY_MAP: Record<string, string> = {};
for (const cat of GLOSSARY) {
  for (const t of cat.terms) {
    GLOSSARY_MAP[t.short] = t.def;
    GLOSSARY_MAP[t.term] = t.def;
  }
}
