export const XP_LEVELS = [
  { level: 1, title: '루키', xpRequired: 0 },
  { level: 2, title: '비기너', xpRequired: 100 },
  { level: 3, title: '루키 II', xpRequired: 300 },
  { level: 4, title: '레귤러', xpRequired: 600 },
  { level: 5, title: '레귤러 II', xpRequired: 1000 },
  { level: 6, title: '그라인더', xpRequired: 1500 },
  { level: 7, title: '그라인더 II', xpRequired: 2200 },
  { level: 8, title: '샤크', xpRequired: 3000 },
  { level: 9, title: '샤크 II', xpRequired: 4000 },
  { level: 10, title: '마스터', xpRequired: 5500 }
];

export type Scenario = {
  show?: string;
  question?: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  quizType: 'identify' | 'rfi_dynamic';
  handCount: number;
  maxErrors: number;
  guideTip: string;
  positions?: string[];
  scenarios?: Scenario[];
};

export type Unit = {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  group: string;
  lessons: Lesson[];
};

export const SKILL_TREE: Unit[] = [
  {
    id: 1, title: '핸드의 세계', subtitle: '카드 표기법과 핸드 강도', emoji: '🃏', group: '기초',
    lessons: [
      {
        id: '1-1', title: '카드 읽기', subtitle: '홀덤의 알파벳을 배우자',
        quizType: 'identify', handCount: 4, maxErrors: 2,
        guideTip: '홀덤에서 카드를 표기하는 방법이 있어요.\nA=에이스, K=킹, Q=퀸, J=잭, T=10.\ns=같은 무늬(수티드), o=다른 무늬(오프수트).\nAA, KK처럼 같은 숫자 두 장은 포켓 페어라고 해요.',
        scenarios: [
          { show: 'A♠ K♠', question: '이 핸드의 표기법은?', options: ['AKs','AKo','AK','KAs'], answer: 'AKs', explanation: '같은 스페이드(♠)이므로 수티드. AKs로 표기.' },
          { show: 'Q♥ J♦', question: '이 핸드의 표기법은?', options: ['QJs','QJo','JQo','QJ'], answer: 'QJo', explanation: '하트(♥)와 다이아(♦)로 다른 무늬. 오프수트 QJo.' },
          { show: '9♣ 9♦', question: '이 핸드의 표기법은?', options: ['99','99s','99o','9'], answer: '99', explanation: '같은 숫자 두 장은 포켓 페어. 그냥 99로 표기.' },
          { show: 'T♠ 9♠', question: '이 핸드의 표기법은?', options: ['T9s','T9o','9Ts','T9'], answer: 'T9s', explanation: '같은 스페이드. 높은 카드를 먼저 써서 T9s.' }
        ]
      },
      {
        id: '1-2', title: '핸드 계급', subtitle: '어떤 패가 강할까?',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '모든 핸드는 평등하지 않아요.\nAA > KK > QQ > ... > 32o 순서예요.\n높은 페어 > 높은 수티드 > 높은 오프수트 > 낮은 페어 순이에요.',
        scenarios: [
          { question: '다음 중 가장 강한 시작 핸드는?', options: ['AA','AKs','KK','QQ'], answer: 'AA', explanation: 'AA는 프리플랍 최강 핸드. 모든 핸드를 상대로 유리.' },
          { question: 'AKs와 QQ 중 프리플랍에서 더 강한 것은?', options: ['QQ','AKs','비슷하다'], answer: 'QQ', explanation: 'QQ는 이미 페어. AKs는 맞아야 페어가 되므로 QQ가 약간 유리.' },
          { question: '다음 중 가장 약한 핸드는?', options: ['72o','32s','J3o','95o'], answer: '72o', explanation: '72o는 홀덤에서 가장 약한 핸드로 유명. 연결도 없고 높은 카드도 없다.' },
          { question: 'AKs와 AKo의 차이는?', options: ['AKs가 더 강하다','AKo가 더 강하다','완전히 같다'], answer: 'AKs가 더 강하다', explanation: '수티드는 플러시 가능성이 있어서 약 3% 더 자주 이긴다.' },
          { question: '99와 AQo 중 올인하면 누가 유리?', options: ['99가 약간 유리','AQo가 약간 유리','완전 동등'], answer: '99가 약간 유리', explanation: '포켓 페어는 이미 페어가 완성된 상태. 오버카드 둘과의 매치업에서 약 55:45로 유리.' }
        ]
      },
      {
        id: '1-3', title: '핸드 카테고리', subtitle: '핸드를 그룹으로 나누자',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '핸드를 카테고리로 나누면 판단이 빨라져요.\n프리미엄(AA-JJ, AKs) / 브로드웨이(AQ, KQ 등 T이상 조합) /\n포켓페어(TT-22) / 수티드 커넥터(98s, 87s) / 수티드 에이스(A5s-A2s)',
        scenarios: [
          { show: 'AKs', question: '이 핸드의 카테고리는?', options: ['프리미엄','브로드웨이','수티드 커넥터'], answer: '프리미엄', explanation: 'AKs는 상위 5개 핸드에 포함. 프리미엄 핸드.' },
          { show: 'KJo', question: '이 핸드의 카테고리는?', options: ['프리미엄','브로드웨이','수티드 에이스'], answer: '브로드웨이', explanation: 'K과 J 모두 T 이상. 브로드웨이 핸드.' },
          { show: '87s', question: '이 핸드의 카테고리는?', options: ['수티드 커넥터','브로드웨이','프리미엄'], answer: '수티드 커넥터', explanation: '같은 무늬 + 연속된 숫자. 스트레이트+플러시를 동시에 노리는 투기적 핸드.' },
          { show: 'A4s', question: '이 핸드의 카테고리는?', options: ['수티드 에이스','프리미엄','브로드웨이'], answer: '수티드 에이스', explanation: '에이스 + 낮은 카드 + 수티드. 넛 플러시 가능성이 핵심 가치. 블러프 3벳 후보.' },
          { show: '55', question: '이 핸드의 카테고리는?', options: ['스몰 포켓페어','프리미엄','브로드웨이'], answer: '스몰 포켓페어', explanation: '낮은 포켓페어. 셋(555)을 맞히면 대박, 안 맞으면 어려운 핸드.' }
        ]
      },
      {
        id: '1-4', title: '수티드의 힘', subtitle: '같은 무늬가 왜 중요할까?',
        quizType: 'identify', handCount: 4, maxErrors: 2,
        guideTip: '같은 무늬(수티드)는 다른 무늬(오프수트)보다 약 3-4% 더 이길 확률이 높아요.\n플러시를 만들 수 있는 가능성이 이 차이를 만들어요.\n이 작은 차이가 "플레이 가능"과 "폴드"의 경계를 가릅니다.',
        scenarios: [
          { question: 'KTs는 플레이하지만 KTo는 접는 포지션이 있다. 왜?', options: ['수티드는 플러시 가능성이 있어서','수티드가 멋있어서','차이 없다'], answer: '수티드는 플러시 가능성이 있어서', explanation: '수티드의 플러시 가능성이 EV(기대값)를 높여 경계선 핸드의 플레이 여부를 바꾼다.' },
          { question: 'J9s와 QTo 중 더 플레이어빌리티가 좋은 핸드는?', options: ['J9s','QTo','비슷하다'], answer: 'J9s', explanation: 'J9s는 수티드+커넥터로 스트레이트와 플러시 모두 가능. QTo는 한쪽(스트레이트)만.' },
          { question: '수티드 핸드의 가장 큰 장점은?', options: ['플러시 가능성','상대를 속일 수 있어서','항상 이긴다'], answer: '플러시 가능성', explanation: '수티드는 보드에 같은 무늬가 3장 나오면 플러시를 만들 수 있어 기대값이 높다.' },
          { question: 'A2s가 K9o보다 많은 포지션에서 플레이 가능한 이유는?', options: ['에이스 블로커 + 넛 플러시 가능','2가 강해서','답이 없다'], answer: '에이스 블로커 + 넛 플러시 가능', explanation: 'A2s는 에이스 블로커(상대 AA 확률 감소) + 넛 플러시 가능성이라는 두 가지 가치가 있다.' }
        ]
      }
    ]
  },
  {
    id: 2, title: '자리가 돈이다', subtitle: '포지션의 중요성', emoji: '🪑', group: '기초',
    lessons: [
      {
        id: '2-1', title: '포지션 이름', subtitle: '9개의 자리를 외우자',
        quizType: 'identify', handCount: 4, maxErrors: 2,
        guideTip: '9인 테이블은 UTG → UTG+1 → UTG+2 → LJ → HJ → CO → BTN → SB → BB 순이에요.\n먼저 행동할수록 불리하고, 나중에 행동할수록 유리해요.',
        scenarios: [
          { question: '가장 먼저 행동하는 포지션은?', options: ['UTG','SB','BB','BTN'], answer: 'UTG', explanation: 'Under The Gun. 프리플랍에서 가장 먼저 행동한다.' },
          { question: '포스트플랍에서 항상 마지막에 행동하는 포지션은?', options: ['BTN','BB','CO','SB'], answer: 'BTN', explanation: '버튼은 딜러 위치로, 포스트플랍에서 항상 마지막에 행동. 정보 우위.' },
          { question: 'SB과 BB의 공통 단점은?', options: ['포스트플랍에서 먼저 행동(OOP)','핸드를 못 본다','블라인드가 없다'], answer: '포스트플랍에서 먼저 행동(OOP)', explanation: '블라인드는 강제 베팅도 내야 하고, 포스트플랍에서 먼저 행동해야 해서 불리.' },
          { question: 'LJ는 어떤 포지션 그룹에 속하나?', options: ['미들 포지션(MP)','얼리 포지션(EP)','레이트 포지션(LP)'], answer: '미들 포지션(MP)', explanation: 'Lojack은 미들 포지션의 시작. EP보다 넓지만 LP보다 좁게 플레이.' }
        ]
      },
      {
        id: '2-2', title: '포지션과 레인지', subtitle: '자리에 따라 핸드 수가 달라진다',
        quizType: 'identify', handCount: 4, maxErrors: 2,
        guideTip: '앞자리일수록 적은 핸드를, 뒷자리일수록 많은 핸드를 플레이해요.\nUTG는 약 10%, BTN은 약 51%.\n이유는 간단해요: 뒤에 남은 사람 수가 다르니까.',
        scenarios: [
          { question: 'UTG의 오픈 레인지는 대략 몇 %?', options: ['10%','20%','30%','50%'], answer: '10%', explanation: '뒤에 8명이 남아있어서 매우 타이트하게. 상위 10%만 오픈.' },
          { question: 'BTN의 오픈 레인지는 대략 몇 %?', options: ['51%','30%','20%','10%'], answer: '51%', explanation: '뒤에 블라인드 2명만 남아서 거의 절반의 핸드를 오픈할 수 있다.' },
          { question: 'CO의 오픈 레인지는 대략 몇 %?', options: ['30%','10%','51%','22%'], answer: '30%', explanation: 'BTN 앞 자리. 레이트 포지션이라 꽤 넓게 플레이 가능.' },
          { question: 'KJo를 UTG에서 오픈하는 것은?', options: ['폴드가 맞다','오픈해야 한다','상관없다'], answer: '폴드가 맞다', explanation: 'KJo는 UTG 10% 레인지에 포함되지 않는다. BTN이면 오픈.' }
        ]
      },
      {
        id: '2-3', title: 'IP vs OOP', subtitle: '포지션 유불리의 핵심',
        quizType: 'identify', handCount: 4, maxErrors: 2,
        guideTip: 'IP(In Position) = 상대보다 뒤에서 행동. 정보 이점이 있어서 유리.\nOOP(Out Of Position) = 상대보다 먼저 행동. 정보가 부족해서 불리.\n같은 핸드라도 IP이면 더 넓게 플레이할 수 있어요.',
        scenarios: [
          { question: 'BTN이 오픈하고 BB가 콜. 포스트플랍에서 IP인 쪽은?', options: ['BTN','BB'], answer: 'BTN', explanation: 'BB가 먼저 행동하고 BTN이 나중에 행동. BTN이 IP.' },
          { question: 'CO가 오픈하고 HJ가 콜. HJ는 IP인가 OOP인가?', options: ['OOP','IP'], answer: 'OOP', explanation: 'HJ가 CO보다 앞에 앉아있으므로 포스트플랍에서 먼저 행동. OOP.' },
          { question: 'IP의 가장 큰 장점은?', options: ['상대 행동을 보고 결정할 수 있다','더 많은 카드를 받는다','블라인드를 안 낸다'], answer: '상대 행동을 보고 결정할 수 있다', explanation: '상대가 체크하면 약한 신호, 베팅하면 뭔가 있다는 신호. 이 정보가 IP의 핵심 이점.' },
          { question: 'SB vs BTN. 포스트플랍에서 SB는?', options: ['OOP (불리)','IP (유리)','상관없다'], answer: 'OOP (불리)', explanation: 'SB는 BTN보다 먼저 행동. OOP라서 불리한 포지션.' }
        ]
      }
    ]
  },
  {
    id: 3, title: '첫 번째 공격', subtitle: 'EP 오픈 레인지 (RFI)', emoji: '⚔️', group: '프리플랍',
    lessons: [
      { id: '3-1', title: 'UTG 오픈', subtitle: '가장 타이트한 오픈', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['UTG'], guideTip: 'UTG는 가장 먼저 행동하는 포지션이에요.\n뒤에 8명이 남아있어서 매우 타이트하게 오픈해야 해요.\n상위 10%만: AA-77, AKs-ATs, A5s-A4s, KQs-98s, AKo-AJo, KQo' },
      { id: '3-2', title: 'UTG+1 / UTG+2 오픈', subtitle: '얼리 포지션 확장', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['UTG+1', 'UTG+2'], guideTip: 'UTG+1과 UTG+2는 UTG보다 살짝 넓어요.\n66 추가, A9s 추가, 수티드 커넥터 몇 개 추가.\n하지만 여전히 얼리 포지션이라 타이트하게!' },
      { id: '3-3', title: 'LJ 오픈', subtitle: '미들 포지션의 시작', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['LJ'], guideTip: 'LJ(Lojack)부터 미들 포지션이에요.\n55 추가, A8s-A2s, 수티드 브로드웨이 더 추가.\n오프수트 브로드웨이도 ATo, QJo, JTo까지.' },
      { id: '3-4', title: 'EP/MP 종합 드릴', subtitle: '앞자리 포지션 총정리', quizType: 'rfi_dynamic', handCount: 8, maxErrors: 3, positions: ['UTG', 'UTG+1', 'UTG+2', 'LJ'], guideTip: '지금까지 배운 UTG ~ LJ를 섞어서 연습해요.\n핵심: 포지션이 뒤로 갈수록 레인지가 넓어진다.\n같은 핸드도 포지션에 따라 레이즈/폴드가 달라져요!' }
    ]
  },
  {
    id: 4, title: '넓혀가기', subtitle: 'LP 오픈 레인지 (RFI 확장)', emoji: '🔓', group: '프리플랍',
    lessons: [
      { id: '4-1', title: 'HJ 오픈', subtitle: 'MP/LP 경계', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['HJ'], guideTip: 'HJ(Hijack)는 약 21% 오픈.\n44 추가, A7s-A6s, K7s, 더 많은 수티드 커넥터.\n오프수트도 A9o, K9o, J9o까지.' },
      { id: '4-2', title: 'CO 오픈', subtitle: '레이트 포지션 진입', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['CO'], guideTip: 'CO(Cutoff)는 약 27% 오픈.\n22-33 추가, K6s-K5s, 많은 수티드 핸드.\n오프수트도 A5o, K8o, T9o, 87o까지. 꽤 넓다!' },
      { id: '4-3', title: 'BTN 오픈', subtitle: '최고의 포지션, 최대 레인지', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['BTN'], guideTip: 'BTN은 약 51% 오픈. 절반 이상의 핸드를 플레이!\n거의 모든 수티드 핸드, 오프수트도 매우 넓게.\n블라인드 2명만 남았으니 공격적으로!' },
      { id: '4-4', title: '전 포지션 종합 드릴', subtitle: '모든 포지션 RFI 총정리', quizType: 'rfi_dynamic', handCount: 10, maxErrors: 4, positions: ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN'], guideTip: 'UTG부터 BTN까지 전체 포지션 종합 드릴!\n핵심 질문: 이 핸드를 이 포지션에서 오픈할 것인가?\n포지션별 레인지 차이를 체화시키는 시간이에요.' }
    ]
  },
  { id: 5, title: '특수 작전', subtitle: 'SB/BB 전략', emoji: '🛡️', group: '프리플랍', lessons: [] },
  { id: 6, title: '반격', subtitle: 'Facing RFI', emoji: '🗡️', group: '프리플랍', lessons: [] },
  { id: 7, title: '재반격', subtitle: 'vs 3bet', emoji: '💥', group: '프리플랍', lessons: [] },
  { id: 8, title: '숫자의 힘', subtitle: '팟 오즈', emoji: '🔢', group: '포스트플랍', lessons: [] },
  { id: 9, title: '전장 읽기', subtitle: '보드 텍스처', emoji: '🗺️', group: '포스트플랍', lessons: [] },
  { id: 10, title: '공격 유지', subtitle: 'C-bet', emoji: '🎯', group: '포스트플랍', lessons: [] },
  { id: 11, title: '핸드 강도 판관', subtitle: '포스트플랍 핸드 평가', emoji: '⚖️', group: '포스트플랍', lessons: [] },
  { id: 12, title: '돈의 언어', subtitle: '벳 사이징', emoji: '💰', group: '포스트플랍', lessons: [] }
];
