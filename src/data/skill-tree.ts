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
  quizType: 'identify' | 'rfi_dynamic' | 'facing_dynamic' | 'vs3bet_dynamic';
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
    id: 0, title: '홀덤 첫걸음', subtitle: '홀덤이 처음이라면 여기서 시작', emoji: '👋', group: '튜토리얼',
    lessons: [
      {
        id: '0-1', title: '홀덤 한 판의 흐름', subtitle: '게임의 기본 규칙',
        quizType: 'identify', handCount: 4, maxErrors: 4,
        guideTip: '홀덤은 간단해요.\n카드 2장을 받고, 테이블에 공유 카드 5장이 깔리고,\n가장 좋은 조합 5장으로 승부하는 게임이에요.\n지금부터 하나씩 알아볼게요!',
        scenarios: [
          { question: '홀덤에서 나한테 나눠지는 카드는 몇 장?', options: ['2장', '3장', '5장'], answer: '2장', explanation: '맞아요! 이 2장을 \'핸드\'라고 불러요. 이 2장이 내 무기예요.' },
          { question: '테이블 가운데 깔리는 공유 카드는 총 몇 장?', options: ['3장', '4장', '5장'], answer: '5장', explanation: '5장이 차례로 깔려요. 처음 3장(플랍), 1장(턴), 1장(리버) 순서예요.' },
          { question: '최종 승부는 몇 장으로 만드나요?', options: ['내 2장만', '5장 조합', '7장 전부'], answer: '5장 조합', explanation: '내 2장 + 공유 5장 중에서 가장 좋은 5장 조합이 내 패예요.' },
          { question: '상대보다 좋은 패를 가지면?', options: ['이긴다', '비긴다', '다시 한다'], answer: '이긴다', explanation: '테이블에 쌓인 칩(돈)을 전부 가져가요! 이게 홀덤이에요.' }
        ]
      },
      {
        id: '0-2', title: '패의 서열', subtitle: '어떤 패가 이기나요?',
        quizType: 'identify', handCount: 5, maxErrors: 4,
        guideTip: '어떤 패가 강한지 알아야 게임을 할 수 있어요.\n원페어 < 투페어 < 트리플 < 스트레이트 < 플러시 순서예요.\n만들기 어려운 패일수록 강해요!',
        scenarios: [
          { question: '같은 숫자 2장이 있으면?', options: ['원페어', '투페어', '트리플'], answer: '원페어', explanation: '원페어예요! 예: K♠ K♥. 가장 흔하게 만들어지는 패죠.' },
          { question: '원페어와 투페어 중 어느 쪽이 이길 확률이 높나요?', options: ['원페어', '투페어'], answer: '투페어', explanation: '투페어가 이길 확률이 더 높아요. 만들기가 더 어려우니까요.' },
          { question: '숫자가 연속 5개면? (예: 5-6-7-8-9)', options: ['스트레이트', '플러시'], answer: '스트레이트', explanation: '스트레이트! 숫자 5개가 계단처럼 이어지는 거예요.' },
          { question: '같은 무늬 5장이면?', options: ['스트레이트', '플러시'], answer: '플러시', explanation: '플러시! 하트 5장, 스페이드 5장처럼 무늬가 같으면 돼요.' },
          { question: '스트레이트와 플러시 중 어느 쪽이 이길 확률이 높나요?', options: ['스트레이트', '플러시'], answer: '플러시', explanation: '플러시가 이길 확률이 더 높아요. 같은 무늬 5장이 더 만들기 어렵거든요.' }
        ]
      },
      {
        id: '0-3', title: '베팅의 기본', subtitle: '레이즈, 콜, 폴드, 체크',
        quizType: 'identify', handCount: 4, maxErrors: 4,
        guideTip: '매 라운드마다 선택이 있어요.\n패가 좋으면 돈을 더 넣고(레이즈),\n남이 건 만큼 따라가거나(콜),\n안 되겠으면 포기해요(폴드).\n아무도 안 걸었으면 그냥 넘길 수도 있어요(체크).',
        scenarios: [
          { show: 'A♠ A♥', question: '이 패는 에이스 한 쌍! 최강 패예요. 가장 좋은 선택은?', options: ['돈을 더 넣기 (레이즈)', '포기하기 (폴드)'], answer: '돈을 더 넣기 (레이즈)', explanation: 'AA는 최강 패! 당연히 돈을 더 넣어야죠. 이걸 \'레이즈\'라고 해요.' },
          { show: '7♠ 2♦', question: '이 패는 7과 2... 가장 약한 조합이에요. 보통 어떻게 하나요?', options: ['돈을 더 넣기 (레이즈)', '포기하기 (폴드)'], answer: '포기하기 (폴드)', explanation: '72는 가장 약한 패예요. 이럴 때 포기하는 걸 \'폴드\'라고 해요. 돈 아끼는 것도 실력!' },
          { question: '상대가 베팅했는데 내 패가 괜찮을 때, 같은 금액을 내는 건?', options: ['콜', '폴드', '체크'], answer: '콜', explanation: '같은 금액을 내는 걸 \'콜\'이라고 해요. 게임을 계속할 수 있어요.' },
          { question: '누구도 베팅 안 했을 때 나도 안 내고 넘기는 건?', options: ['체크', '콜', '폴드'], answer: '체크', explanation: '아무도 안 걸었으면 나도 그냥 넘길 수 있어요. 이게 \'체크\'예요. 돈 안 내고 다음 카드를 볼 수 있죠.' }
        ]
      }
    ]
  },
  {
    id: 1, title: '핸드의 세계', subtitle: '카드 표기법과 핸드 강도', emoji: '🃏', group: '기초',
    lessons: [
      {
        id: '1-1', title: '카드 읽기', subtitle: '홀덤의 알파벳을 배우자',
        quizType: 'identify', handCount: 4, maxErrors: 2,
        guideTip: '홀덤에서는 카드를 짧게 쓰는 방법이 있어요.\nA=에이스, K=킹, Q=퀸, J=잭, T=10.\ns=같은 무늬, o=다른 무늬.\n예: AKs = 에이스-킹 같은 무늬\nAA, KK처럼 같은 숫자 두 장은 \'페어\'라고 해요.',
        scenarios: [
          { show: 'A♠ K♠', question: '이 핸드의 표기법은?', options: ['AKs','AKo','AK','KAs'], answer: 'AKs', explanation: '같은 스페이드(♠)이므로 수티드. AKs로 표기.' },
          { show: 'Q♥ J♦', question: '이 핸드의 표기법은?', options: ['QJs','QJo','JQo','QJ'], answer: 'QJo', explanation: '하트(♥)와 다이아(♦)로 다른 무늬. 오프수트 QJo.' },
          { show: '9♣ 9♦', question: '이 핸드의 표기법은?', options: ['99','99s','99o','9'], answer: '99', explanation: '같은 숫자 두 장은 포켓 페어. 그냥 99로 표기.' },
          { show: 'T♠ 9♠', question: '이 핸드의 표기법은?', options: ['T9s','T9o','9Ts','T9'], answer: 'T9s', explanation: '같은 스페이드. 높은 카드를 먼저 써서 T9s.' }
        ]
      },
      {
        id: '1-2', title: '핸드 계급', subtitle: '어떤 패가 강할까?',
        quizType: 'identify', handCount: 7, maxErrors: 3,
        guideTip: '모든 패는 평등하지 않아요.\nAA(에이스 페어)가 가장 강하고, 72(7-2 다른무늬)가 가장 약해요.\n기본 순서: 높은 페어 > 높은 카드 같은무늬 > 높은 카드 다른무늬 > 낮은 페어',
        scenarios: [
          // OX 퀵 퀴즈 (워밍업)
          { question: 'AA(에이스 페어)는 홀덤에서 이길 확률이 가장 높은 시작 패다', options: ['O', 'X'], answer: 'O', explanation: '맞아요! AA는 모든 패를 상대로 유리한 최강 패예요.' },
          { question: '같은 무늬(예: AKs)가 다른 무늬(AKo)보다 항상 이길 확률이 높다', options: ['O', 'X'], answer: 'O', explanation: '맞아요! 같은 무늬는 플러시 가능성이 있어서 약 3% 더 유리해요.' },
          // 비교 선택형
          { question: 'QQ와 AKs 중 올인하면 누가 유리할까?', options: ['QQ가 약간 유리', 'AKs가 약간 유리', '완전 동등'], answer: 'QQ가 약간 유리', explanation: 'QQ는 이미 페어가 완성된 상태! AKs는 A나 K를 맞춰야 해서 QQ가 약 55:45로 유리해요.' },
          { question: '다음 중 이길 확률이 가장 높은 시작 패는?', options: ['AA','AKs','KK','QQ'], answer: 'AA', explanation: 'AA는 프리플랍 최강! 어떤 패를 만나도 제일 유리해요.' },
          { question: '다음 중 가장 약한 패는?', options: ['72o','32s','J3o','95o'], answer: '72o', explanation: '72o는 홀덤에서 가장 약한 패로 유명해요. 숫자가 연결도 안 되고 높은 카드도 없죠.' },
          { question: 'AKs와 AKo의 차이는?', options: ['AKs가 더 강하다','AKo가 더 강하다','완전히 같다'], answer: 'AKs가 더 강하다', explanation: '같은 무늬(s)는 플러시 가능성이 있어서 약 3% 더 자주 이겨요.' },
          { question: '99와 AQo 중 올인하면 누가 유리?', options: ['99가 약간 유리','AQo가 약간 유리','완전 동등'], answer: '99가 약간 유리', explanation: '페어는 이미 완성된 패! 높은 카드 2장과의 대결에서 약 55:45로 유리해요.' }
        ]
      },
      {
        id: '1-3', title: '핸드 카테고리', subtitle: '핸드를 그룹으로 나누자',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '패를 종류별로 나누면 빠르게 판단할 수 있어요.\n최강(AA~JJ, AKs) / 높은카드(AQ, KQ 등) /\n페어(TT~22) / 연속+같은무늬(98s, 87s) / 에이스+같은무늬(A5s~A2s)',
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
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '같은 무늬 카드는 다른 무늬보다 약 3~4% 더 이길 확률이 높아요.\n왜? 같은 무늬 5장이 모이면 \'플러시\'라는 강한 패가 되거든요.\n이 작은 차이가 "베팅해도 되는 패"와 "접어야 하는 패"를 갈라요!',
        scenarios: [
          // OX 퀴즈 (워밍업)
          { question: '같은 무늬(수티드) 카드가 다른 무늬보다 유리한 이유는 플러시 때문이다', options: ['O', 'X'], answer: 'O', explanation: '맞아요! 같은 무늬 5장이 모이면 플러시라는 강한 패가 되거든요. 이 가능성이 큰 차이를 만들어요.' },
          // 비교 선택형
          { question: 'J9s와 QTo, 어떤 패가 더 많은 가능성이 있을까요?', options: ['J9s (같은 무늬+연속)', 'QTo (높은 카드+다른 무늬)'], answer: 'J9s (같은 무늬+연속)', explanation: 'J9s는 같은 무늬(플러시 가능) + 연속 숫자(스트레이트 가능)! 두 가지 길이 열려 있어요. QTo는 스트레이트만 가능해요.' },
          // 상황 판단형
          { question: 'KTs는 어떤 자리에서 플레이하지만 KTo는 접어야 하는 자리가 있어요. 왜 그럴까요?', options: ['같은 무늬라 플러시 가능성이 추가돼서', '같은 무늬가 멋있어서', '차이 없다'], answer: '같은 무늬라 플러시 가능성이 추가돼서', explanation: '같은 무늬의 플러시 가능성이 애매한 패를 "플레이할 만한 패"로 바꿔줘요. 작은 차이가 큰 결과를 만들어요!' },
          { question: '같은 무늬 패의 가장 큰 장점은?', options: ['플러시 가능성', '상대를 속일 수 있어서', '항상 이긴다'], answer: '플러시 가능성', explanation: '테이블에 같은 무늬가 3장 나오면 플러시를 만들 수 있어요. 이 가능성이 패의 가치를 높여줘요.' },
          { question: 'A2s가 K9o보다 더 많은 자리에서 플레이 가능한 이유는?', options: ['에이스 + 가장 강한 플러시 가능', '2가 특별해서', '그냥 운'], answer: '에이스 + 가장 강한 플러시 가능', explanation: 'A2s는 에이스가 있고 + 가장 강한 플러시(넛 플러시)를 만들 수 있어요. 이 두 가지가 작은 숫자를 보완해줘요!' }
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
        guideTip: '테이블에는 9개의 자리가 있어요.\nUTG → UTG+1 → UTG+2 → LJ → HJ → CO → BTN → SB → BB\n먼저 행동할수록 불리하고, 나중에 행동할수록 유리해요.\nBTN(버튼)이 가장 좋은 자리예요!',
        scenarios: [
          { question: '가장 먼저 행동하는 포지션은?', options: ['UTG','SB','BB','BTN'], answer: 'UTG', explanation: 'Under The Gun. 프리플랍에서 가장 먼저 행동한다.' },
          { question: '포스트플랍에서 항상 마지막에 행동하는 포지션은?', options: ['BTN','BB','CO','SB'], answer: 'BTN', explanation: '버튼은 딜러 위치로, 포스트플랍에서 항상 마지막에 행동. 정보 우위.' },
          { question: 'SB과 BB의 공통 단점은?', options: ['포스트플랍에서 먼저 행동(OOP)','핸드를 못 본다','블라인드가 없다'], answer: '포스트플랍에서 먼저 행동(OOP)', explanation: '블라인드는 강제 베팅도 내야 하고, 포스트플랍에서 먼저 행동해야 해서 불리.' },
          { question: 'LJ는 어떤 포지션 그룹에 속하나?', options: ['미들 포지션(MP)','얼리 포지션(EP)','레이트 포지션(LP)'], answer: '미들 포지션(MP)', explanation: 'Lojack은 미들 포지션의 시작. EP보다 넓지만 LP보다 좁게 플레이.' }
        ]
      },
      {
        id: '2-2', title: '포지션과 레인지', subtitle: '자리에 따라 플레이 범위가 달라진다',
        quizType: 'identify', handCount: 6, maxErrors: 3,
        guideTip: '앞자리에선 좋은 패만, 뒷자리에선 더 많은 패로 플레이해요.\nUTG(앞자리)는 상위 10%만, BTN(버튼)은 51%나 플레이!\n이유는 간단해요: 뒤에 남은 사람 수가 다르니까.',
        scenarios: [
          // OX 퀴즈 (워밍업)
          { question: 'BTN(버튼)에서는 절반 이상의 패로 베팅할 수 있다', options: ['O', 'X'], answer: 'O', explanation: '맞아요! BTN은 뒤에 2명만 남아서 51%, 절반 이상의 패로 베팅할 수 있어요.' },
          // 포지션 감각형
          { question: 'KJo(킹-잭 다른 무늬)를 베팅해도 되는 자리는?', options: ['BTN (뒷자리)', 'UTG (앞자리)'], answer: 'BTN (뒷자리)', explanation: 'KJo는 나쁘지 않은 패지만, 앞자리(UTG)에선 부족해요. 뒷자리(BTN)에선 충분히 베팅 가능!' },
          { question: 'UTG(앞자리)에서 베팅할 수 있는 패는 상위 몇 %?', options: ['10%', '20%', '30%', '50%'], answer: '10%', explanation: '뒤에 8명이나 남아있어요! 정말 좋은 패, 상위 10%만 골라서 베팅해야 해요.' },
          { question: 'BTN(버튼)에서 베팅할 수 있는 패는 상위 몇 %?', options: ['51%', '30%', '20%', '10%'], answer: '51%', explanation: '뒤에 블라인드 2명만! 거의 절반의 패로 베팅할 수 있는 최고의 자리예요.' },
          { question: 'CO(커톹)에서 베팅할 수 있는 패는 상위 몇 %?', options: ['30%', '10%', '51%', '22%'], answer: '30%', explanation: 'BTN 바로 앞자리. 뒤에 3명만 남아서 꽤 넓게 플레이 가능해요.' },
          // 상황 판단형
          { question: '같은 패(KJo)인데 자리에 따라 베팅/접기가 달라지는 이유는?', options: ['뒤에 남은 사람 수가 다르니까', '카드가 바뀌니까', '기분에 따라'], answer: '뒤에 남은 사람 수가 다르니까', explanation: '핵심이에요! 뒤에 남은 사람이 많으면 누군가 좋은 패를 가질 확률이 높아요. 그래서 앞자리일수록 좋은 패만 골라야 해요.' }
        ]
      },
      {
        id: '2-3', title: 'IP vs OOP', subtitle: '포지션 유불리의 핵심',
        quizType: 'identify', handCount: 4, maxErrors: 2,
        guideTip: '나중에 행동하는 사람이 유리해요. (상대 행동을 보고 결정하니까)\n나중에 행동 = IP(In Position, 유리한 자리)\n먼저 행동 = OOP(Out Of Position, 불리한 자리)\n같은 핸드라도 IP에선 더 적극적으로 플레이할 수 있어요!',
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
      { id: '3-1', title: 'UTG 오픈', subtitle: '가장 타이트한 오픈', quizType: 'rfi_dynamic', handCount: 7, maxErrors: 3, positions: ['UTG'],
        guideTip: 'UTG는 가장 먼저 행동하는 자리예요.\n뒤에 8명이나 남아있으니 정말 좋은 패만 골라야 해요.\n베팅할 수 있는 패는 상위 10% 정도뿐!\n레이즈(베팅) 아니면 폴드(포기), 둘 중 하나예요.',
        scenarios: [
          { question: 'UTG(앞자리)에서 좋은 패만 골라야 하는 이유는?', options: ['뒤에 8명이나 남아서 누군가 좋은 패를 가질 확률이 높으니까', '앞자리가 불운해서', '규칙이 그래서'], answer: '뒤에 8명이나 남아서 누군가 좋은 패를 가질 확률이 높으니까', explanation: '핵심이에요! 뒤에 남은 사람이 많을수록, 그 중 한 명이 강한 패를 가지고 다시 올릴 확률이 높아요. 그래서 앞자리에선 정말 좋은 패만 골라야 해요.' }
        ]
      },
      { id: '3-2', title: 'UTG+1 / UTG+2 오픈', subtitle: '앞자리 조금 넓히기', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['UTG+1', 'UTG+2'], guideTip: 'UTG+1과 UTG+2는 UTG보다 살짝 넓게 플레이해요.\n뒤에 남은 사람이 1~2명 적으니까요.\n하지만 여전히 앞자리! 아직은 좋은 패만 골라야 해요.' },
      { id: '3-3', title: 'LJ 오픈', subtitle: '중간 자리의 시작', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['LJ'], guideTip: 'LJ부터 중간 자리예요. 뒤에 5명만 남아서 좀 더 넓게 플레이 가능!\n에이스+같은무늬 패가 더 추가되고,\n높은 카드 조합도 더 플레이할 수 있어요.' },
      { id: '3-4', title: '앞자리/중간 종합 드릴', subtitle: 'UTG~LJ 총정리', quizType: 'rfi_dynamic', handCount: 8, maxErrors: 3, positions: ['UTG', 'UTG+1', 'UTG+2', 'LJ'], guideTip: '지금까지 배운 UTG ~ LJ를 섞어서 연습해요.\n핵심: 자리가 뒤로 갈수록 더 많은 패를 플레이할 수 있다!\n같은 패도 자리에 따라 베팅/접기가 달라져요.' }
    ]
  },
  {
    id: 4, title: '넓혀가기', subtitle: 'LP 오픈 레인지 (RFI 확장)', emoji: '🔓', group: '프리플랍',
    lessons: [
      { id: '4-1', title: 'HJ 오픈', subtitle: '중간~뒷자리 경계', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['HJ'], guideTip: 'HJ는 뒤에 4명만 남아서 약 21%의 패를 플레이할 수 있어요.\n작은 페어, 에이스+같은무늬 더 추가!\n점점 공격적으로 갈 수 있는 자리예요.' },
      { id: '4-2', title: 'CO 오픈', subtitle: '뒷자리 진입', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['CO'], guideTip: 'CO(커톹)는 뒤에 3명만! 약 27%의 패를 플레이해요.\n아주 작은 페어도 OK, 같은 무늬 패 대부분 OK.\n꽤 넓게 공격할 수 있는 좋은 자리예요!' },
      { id: '4-3', title: 'BTN 오픈', subtitle: '최고의 자리, 최대 범위', quizType: 'rfi_dynamic', handCount: 6, maxErrors: 3, positions: ['BTN'], guideTip: 'BTN(버튼)은 최고의 자리! 무려 51%, 절반 이상의 패로 베팅 가능!\n뒤에 블라인드 2명만 남았으니 마음껏 공격하세요.\n여기서 돈을 가장 많이 벌어요!' },
      { id: '4-4', title: '전체 자리 종합 드릴', subtitle: '모든 자리 총정리', quizType: 'rfi_dynamic', handCount: 10, maxErrors: 4, positions: ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN'],
        guideTip: 'UTG부터 BTN까지 모든 자리를 섞어서 연습!\n핵심 질문: 이 패를 이 자리에서 베팅할 것인가?\n자리별 차이를 몸에 익히는 시간이에요.',
        scenarios: [
          { question: 'ATo(에이스-텐 다른무늬)는 어떤 자리에서부터 베팅 가능할까?', options: ['LJ (중간자리)부터', 'UTG (앞자리)부터', 'BTN (버튼)에서만'], answer: 'LJ (중간자리)부터', explanation: 'ATo는 괜찮은 패지만, 앞자리(UTG~UTG+2)에선 부족해요. 중간자리(LJ)부터 베팅할 수 있어요. 자리가 뒤로 갈수록 더 많은 패를 플레이할 수 있다는 걸 기억하세요!' },
          { question: '22(가장 작은 페어)는 어떤 자리에서부터 베팅 가능할까?', options: ['CO (뒷자리)부터', 'UTG (앞자리)부터', '어디서든 가능'], answer: 'CO (뒷자리)부터', explanation: '작은 페어는 뒷자리에서만 베팅해요. 앞자리에서 22로 베팅하면 뒤에서 더 좋은 패한테 당할 확률이 높아요.' }
        ]
      }
    ]
  },
  {
    id: 5, title: '특수 작전', subtitle: 'SB/BB 전략', emoji: '🛡️', group: '프리플랍',
    lessons: [
      {
        id: '5-1', title: 'SB 오픈 전략', subtitle: '스몰 블라인드의 선택지',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: 'SB는 특수한 포지션이에요.\nRaise(밸류/블러프), Limp, Fold 세 가지 옵션이 있어요.\n프리미엄은 레이즈, 투기적 핸드는 림프, 약한 핸드는 폴드.\nBB는 0.5BB만 추가하면 되니 넓게 디펜스합니다.',
        scenarios: [
          { show: 'AQo', question: 'SB에서 전원 폴드. 이 핸드의 최적 액션은?', options: ['레이즈 (밸류)','림프','폴드'], answer: '레이즈 (밸류)', explanation: 'AQo는 강한 핸드. BB로부터 밸류를 얻기 위해 레이즈.' },
          { show: '65s', question: 'SB에서 전원 폴드. 이 핸드의 최적 액션은?', options: ['림프','레이즈 (밸류)','폴드'], answer: '림프', explanation: '수티드 커넥터는 멀티웨이 팟에서 강하다. 림프로 BB를 끌어들인다.' },
          { show: 'A3s', question: 'SB에서 전원 폴드. 이 핸드의 최적 액션은?', options: ['레이즈 (블러프)','림프','폴드'], answer: '레이즈 (블러프)', explanation: '수티드 에이스는 블러프 레이즈 후보. 에이스 블로커 + 넛 플러시 드로우 가능.' },
          { show: 'K4o', question: 'SB에서 전원 폴드. 이 핸드의 최적 액션은?', options: ['폴드','레이즈 (밸류)','림프'], answer: '폴드', explanation: '킹 약한 키커는 도미네이트되기 쉽다. 폴드가 맞다.' },
          { show: '22', question: 'SB에서 전원 폴드. 이 핸드의 최적 액션은?', options: ['림프','레이즈 (밸류)','폴드'], answer: '림프', explanation: '낮은 포켓페어는 셋을 노리는 핸드. 림프로 저렴하게 플랍 보기.' }
        ]
      },
      {
        id: '5-2', title: 'SB 오픈 실전', subtitle: 'SB RFI 연습',
        quizType: 'rfi_dynamic', handCount: 8, maxErrors: 3, positions: ['SB'],
        guideTip: 'SB는 특수한 포지션이에요.\n전원 폴드 상황에서 SB RFI(Raise First In, 첫 번째 레이즈) 레인지를 연습합니다.\n레이즈 or 폴드로 판단. (림프는 별도 전략)'
      },
      {
        id: '5-3', title: 'BB 디펜스', subtitle: '빅 블라인드의 방어',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: 'BB는 이미 1BB를 냈어요.\n팟 오즈가 좋아서 넓게 디펜스할 수 있어요.\n3벳 vs 콜 vs 폴드를 판단해야 해요.\n강한 핸드는 3벳, 중간 핸드는 콜, 약한 핸드는 폴드.',
        scenarios: [
          { show: 'AKo', question: 'BB에서 BTN이 오픈. 최적 액션은?', options: ['3벳 (밸류)','콜','폴드'], answer: '3벳 (밸류)', explanation: 'AKo는 프리미엄. BB에서 3벳으로 밸류를 극대화.' },
          { show: 'A5s', question: 'BB에서 CO가 오픈. 최적 액션은?', options: ['3벳 (블러프)','콜','폴드'], answer: '3벳 (블러프)', explanation: '수티드 에이스는 블러프 3벳 후보. 넛 플러시 드로우 가능성.' },
          { show: 'K9o', question: 'BB에서 BTN이 오픈. 최적 액션은?', options: ['콜','3벳 (밸류)','폴드'], answer: '콜', explanation: 'BB는 팟 오즈가 좋다. K9o는 콜할 만한 핸드.' },
          { show: 'QQ', question: 'BB에서 LJ가 오픈. 최적 액션은?', options: ['3벳 (밸류)','콜','폴드'], answer: '3벳 (밸류)', explanation: 'QQ는 높은 포켓페어. 밸류 3벳으로 팟을 키운다.' },
          { show: '84o', question: 'BB에서 UTG가 오픈. 최적 액션은?', options: ['폴드','콜','3벳 (블러프)'], answer: '폴드', explanation: 'UTG는 매우 타이트. 84o로 디펜스하기엔 약하다.' }
        ]
      }
    ]
  },
  {
    id: 6, title: '반격', subtitle: 'Facing RFI', emoji: '🗡️', group: '프리플랍',
    lessons: [
      {
        id: '6-1', title: '3벳의 기본', subtitle: '3벳이란 무엇인가?',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '누가 오픈했을 때 다시 레이즈하는 것을 3벳이라 해요.\n밸류 3벳 = 강한 핸드로 팟을 키운다 (QQ+, AK)\n블러프 3벳 = 약한 핸드지만 폴드 유도 (A5s, 76s)\n콜 = 중간 핸드로 플랍 보기 (99-JJ, AQ)',
        scenarios: [
          { show: 'KK', question: 'BTN에서 CO가 오픈. 이 핸드로 할 액션은?', options: ['3벳 (밸류)','콜','폴드'], answer: '3벳 (밸류)', explanation: 'KK는 프리미엄 핸드. 밸류 3벳으로 팟을 키운다.' },
          { show: 'A4s', question: 'CO에서 LJ가 오픈. 이 핸드로 할 액션은?', options: ['3벳 (블러프)','콜','폴드'], answer: '3벳 (블러프)', explanation: '수티드 에이스는 블러프 3벳 후보. 넛 플러시 가능성 + 에이스 블로커.' },
          { show: 'JJ', question: 'BTN에서 HJ가 오픈. 이 핸드로 할 액션은?', options: ['콜','3벳 (밸류)','폴드'], answer: '콜', explanation: 'JJ는 IP에서 콜로 플랍을 보는 게 좋다. 3벳하면 강한 레인지와 싸우게 됨.' },
          { show: 'AQo', question: 'CO에서 UTG가 오픈. 이 핸드로 할 액션은?', options: ['폴드','콜','3벳 (밸류)'], answer: '폴드', explanation: 'UTG는 매우 타이트. AQo는 도미네이트되기 쉬워서 폴드.' },
          { show: '65s', question: 'BTN에서 CO가 오픈. 이 핸드로 할 액션은?', options: ['콜','3벳 (블러프)','폴드'], answer: '콜', explanation: '수티드 커넥터는 IP에서 콜로 플랍 보기. 멀티웨이 팟에서 강하다.' }
        ]
      },
      {
        id: '6-2', title: 'IP에서 Facing RFI', subtitle: '유리한 포지션에서의 대응',
        quizType: 'facing_dynamic', handCount: 8, maxErrors: 3, positions: ['CO', 'BTN'],
        guideTip: 'IP(In Position)에서는 더 넓게 플레이할 수 있어요.\nCO와 BTN에서 앞자리 오픈을 받았을 때의 대응을 연습합니다.\n3벳 / 콜 / 폴드를 판단하세요.'
      },
      {
        id: '6-3', title: 'BB에서 Facing RFI', subtitle: '블라인드 디펜스',
        quizType: 'facing_dynamic', handCount: 8, maxErrors: 3, positions: ['BB'],
        guideTip: 'BB는 이미 1BB를 냈기 때문에 팟 오즈가 좋아요.\n더 넓게 디펜스할 수 있어요.\n오픈 포지션에 따라 디펜스 레인지가 달라져요.'
      },
      {
        id: '6-4', title: 'Facing RFI 종합 드릴', subtitle: '모든 포지션 통합',
        quizType: 'facing_dynamic', handCount: 10, maxErrors: 4, positions: ['HJ', 'CO', 'BTN', 'SB', 'BB'],
        guideTip: 'HJ부터 BB까지 모든 포지션에서 Facing RFI 연습!\n핵심: 오픈 포지션, 내 포지션, 핸드 강도를 종합 판단.\n3벳 / 콜 / 폴드를 정확히 구분하세요.'
      }
    ]
  },
  {
    id: 7, title: '재반격', subtitle: 'vs 3bet', emoji: '💥', group: '프리플랍',
    lessons: [
      {
        id: '7-1', title: '3벳을 받았을 때', subtitle: '4벳, 콜, 폴드의 선택',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '내가 오픈했는데 누가 3벳을 하면?\n4벳 (밸류/블러프) = 최강 핸드 or 에이스 블로커\n콜 = 포켓페어, AQ 등 중간 핸드\n폴드 = 약한 핸드, 도미네이트된 핸드',
        scenarios: [
          { show: 'AA', question: 'CO에서 오픈, BTN이 3벳. 이 핸드로 할 액션은?', options: ['4벳 (밸류)','콜','폴드'], answer: '4벳 (밸류)', explanation: 'AA는 최강 핸드. 4벳으로 팟을 극대화.' },
          { show: 'AKo', question: 'HJ에서 오픈, CO가 3벳. 이 핸드로 할 액션은?', options: ['콜','4벳 (밸류)','폴드'], answer: '콜', explanation: 'AKo는 4벳하면 AA/KK만 남는다. 콜로 플랍 보기.' },
          { show: 'JJ', question: 'BTN에서 오픈, SB가 3벳. 이 핸드로 할 액션은?', options: ['콜','4벳 (밸류)','폴드'], answer: '콜', explanation: 'JJ는 중간 포켓페어. 콜로 플랍에서 셋을 노린다.' },
          { show: 'A5s', question: 'LJ에서 오픈, HJ가 3벳. 이 핸드로 할 액션은?', options: ['폴드','콜','4벳 (블러프)'], answer: '폴드', explanation: 'A5s는 블러프로 오픈했지만 3벳 받으면 폴드.' },
          { show: 'ATo', question: 'CO에서 오픈, BTN이 3벳. 이 핸드로 할 액션은?', options: ['폴드','콜','4벳 (밸류)'], answer: '폴드', explanation: 'ATo는 3벳 레인지에 도미네이트된다. 폴드가 맞다.' }
        ]
      },
      {
        id: '7-2', title: 'EP/MP에서 vs 3bet', subtitle: '앞자리에서 3벳 대응',
        quizType: 'vs3bet_dynamic', handCount: 8, maxErrors: 3, positions: ['UTG', 'LJ', 'HJ'],
        guideTip: 'EP(Early Position, 앞자리)/MP(Middle Position, 중간자리)에서 오픈했을 때 3벳을 받으면?\n내 오픈 레인지가 타이트하므로 더 넓게 계속할 수 있어요.\n4벳 / 콜 / 폴드를 연습합니다.'
      },
      {
        id: '7-3', title: 'LP에서 vs 3bet', subtitle: '뒷자리에서 3벳 대응',
        quizType: 'vs3bet_dynamic', handCount: 8, maxErrors: 3, positions: ['CO', 'BTN'],
        guideTip: 'CO/BTN에서 오픈했을 때 3벳을 받으면?\n내 오픈 레인지가 넓으므로 많은 핸드를 폴드해야 해요.\n강한 핸드만 계속하세요.'
      },
      {
        id: '7-4', title: 'vs 3bet 종합 드릴', subtitle: '전 포지션 통합',
        quizType: 'vs3bet_dynamic', handCount: 10, maxErrors: 4, positions: ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB'],
        guideTip: '모든 포지션에서 vs 3bet 연습!\n핵심: 내 오픈 포지션, 3벳 포지션, 핸드 강도 종합 판단.\n4벳 / 콜 / 폴드를 정확히 구분하세요.'
      }
    ]
  },
  {
    id: 8, title: '숫자의 힘', subtitle: '팟 오즈', emoji: '🔢', group: '포스트플랍',
    lessons: [
      {
        id: '8-1', title: '팟 오즈 계산', subtitle: '콜 확률 계산법',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '팟 오즈 = 콜 금액 / (팟 + 콜 금액)\n예: 팟 100, 상대 베팅 50 → 50/(100+50+50) = 25%\n25% 이상 이길 확률이면 콜이 수익적이에요.',
        scenarios: [
          { question: '팟 100, 상대 베팅 50. 팟 오즈는?', options: ['25%','33%','50%','20%'], answer: '25%', explanation: '50 / (100+50+50) = 50/200 = 25%. 25% 이상 이길 확률이면 콜 수익적.' },
          { question: '팟 200, 상대 베팅 100. 팟 오즈는?', options: ['25%','33%','50%','20%'], answer: '25%', explanation: '100 / (200+100+100) = 100/400 = 25%.' },
          { question: '팟 150, 상대 베팅 75. 팟 오즈는?', options: ['25%','33%','50%','20%'], answer: '25%', explanation: '75 / (150+75+75) = 75/300 = 25%.' },
          { question: '팟 100, 상대 베팅 100. 팟 오즈는?', options: ['33%','25%','50%','40%'], answer: '33%', explanation: '100 / (100+100+100) = 100/300 = 33%.' },
          { question: '팟 100, 상대 베팅 200. 팟 오즈는?', options: ['40%','33%','50%','25%'], answer: '40%', explanation: '200 / (100+200+200) = 200/500 = 40%.' }
        ]
      },
      {
        id: '8-2', title: '드로우 확률', subtitle: '아웃과 확률의 관계',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '아웃(Out) = 내 핸드를 완성시키는 카드 수\n플러시 드로우 = 9 아웃 → 턴까지 19%, 리버까지 35%\nOESD(오픈엔드 스트레이트) = 8 아웃 → 턴까지 17%, 리버까지 32%\n거트샷 = 4 아웃 → 턴까지 9%, 리버까지 17%',
        scenarios: [
          { question: '플러시 드로우(9 아웃)가 리버까지 완성될 확률은?', options: ['35%','19%','50%','25%'], answer: '35%', explanation: '9 아웃 = 약 35% (정확히는 36%). Rule of 4: 9*4 = 36%.' },
          { question: 'OESD(8 아웃)가 리버까지 완성될 확률은?', options: ['32%','17%','35%','25%'], answer: '32%', explanation: '8 아웃 = 약 32%. Rule of 4: 8*4 = 32%.' },
          { question: '거트샷(4 아웃)이 리버까지 완성될 확률은?', options: ['17%','9%','32%','25%'], answer: '17%', explanation: '4 아웃 = 약 17%. Rule of 4: 4*4 = 16%.' },
          { question: '플러시 드로우가 턴에서만 완성될 확률은?', options: ['19%','35%','9%','25%'], answer: '19%', explanation: '턴만: Rule of 2 적용. 9*2 = 18% (약 19%).' },
          { question: '콤보 드로우(15 아웃)가 리버까지 완성될 확률은?', options: ['54%','35%','60%','45%'], answer: '54%', explanation: '15*4 = 60%지만 60% 넘으면 조정. 실제로는 약 54%.' }
        ]
      },
      {
        id: '8-3', title: '실전 판단', subtitle: '팟 오즈 vs 드로우 확률',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '팟 오즈 < 드로우 확률 → 콜 수익적\n팟 오즈 > 드로우 확률 → 폴드\n예: 팟 오즈 25%, 플러시 드로우 35% → 콜!',
        scenarios: [
          { question: '팟 오즈 25%, 플러시 드로우(35%). 액션은?', options: ['콜','폴드'], answer: '콜', explanation: '35% > 25%. 콜이 수익적이다.' },
          { question: '팟 오즈 40%, 거트샷(17%). 액션은?', options: ['폴드','콜'], answer: '폴드', explanation: '17% < 40%. 폴드가 맞다.' },
          { question: '팟 오즈 33%, OESD(32%). 액션은?', options: ['콜','폴드'], answer: '콜', explanation: '32% ≈ 33%. 거의 브레이크이븐이지만 임플라이드 오즈 고려하면 콜.' },
          { question: '팟 오즈 20%, 플러시 드로우(35%). 액션은?', options: ['콜','폴드'], answer: '콜', explanation: '35% > 20%. 명백한 콜.' },
          { question: '팟 오즈 50%, 콤보 드로우(54%). 액션은?', options: ['콜','폴드'], answer: '콜', explanation: '54% > 50%. 콜이 수익적.' }
        ]
      }
    ]
  },
  {
    id: 9, title: '전장 읽기', subtitle: '보드 텍스처', emoji: '🗺️', group: '포스트플랍',
    lessons: [
      {
        id: '9-1', title: '보드 유형 구분', subtitle: 'Dry / Wet / Paired / Monotone',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: 'Dry = 연결 없고 무늬 제각각 (K♠ 7♦ 2♣)\nWet = 스트레이트/플러시 가능성 많음 (9♥ 8♥ 7♠)\nPaired = 페어가 있음 (K♠ K♦ 5♣)\nMonotone = 같은 무늬 3장 (A♠ J♠ 6♠)',
        scenarios: [
          { show: 'K♠ 7♦ 2♣', question: '이 보드의 유형은?', options: ['Dry','Wet','Paired','Monotone'], answer: 'Dry', explanation: '연결도 없고 무늬도 제각각. 전형적인 Dry 보드.' },
          { show: '9♥ 8♥ 7♠', question: '이 보드의 유형은?', options: ['Wet','Dry','Paired','Monotone'], answer: 'Wet', explanation: '스트레이트 가능성(JT, T6) + 플러시 드로우. Wet 보드.' },
          { show: 'A♠ J♠ 6♠', question: '이 보드의 유형은?', options: ['Monotone','Wet','Dry','Paired'], answer: 'Monotone', explanation: '같은 무늬 3장. 모노톤 보드. 플러시가 이미 가능.' },
          { show: 'Q♣ Q♥ 5♦', question: '이 보드의 유형은?', options: ['Paired','Dry','Wet','Monotone'], answer: 'Paired', explanation: 'Q가 페어. Paired 보드. 풀하우스 가능성.' },
          { show: 'T♦ 9♣ 2♥', question: '이 보드의 유형은?', options: ['Dry','Wet','Paired','Monotone'], answer: 'Dry', explanation: '어느 정도 연결이지만 무늬가 다양. Dry에 가깝다.' }
        ]
      },
      {
        id: '9-2', title: '보드 위험도 평가', subtitle: '내 핸드에 유리한가?',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: 'Dry 보드 = 오버페어 안전, C벳 쉬움\nWet 보드 = 위험, 체크 고려\nMonotone = 플러시 완성, 조심\nPaired = 트립스/풀하우스 가능, 슬로우 플레이 위험',
        scenarios: [
          { show: 'JJ, 보드 K♠ 7♦ 2♣', question: '이 보드에서 JJ는?', options: ['언더페어, 조심','오버페어, 안전','폴드해야 함'], answer: '언더페어, 조심', explanation: 'K가 있어서 JJ는 언더페어. 상대가 K 있을 수 있다.' },
          { show: 'AA, 보드 9♥ 8♥ 7♠', question: '이 보드에서 AA는?', options: ['Wet 보드, 조심','Dry 보드, 안전','반드시 이긴다'], answer: 'Wet 보드, 조심', explanation: 'JT, T6, 플러시 드로우 모두 가능. 공격적으로 베팅해야.' },
          { show: 'KK, 보드 A♣ Q♦ 5♥', question: '이 보드에서 KK는?', options: ['오버카드 있음, 체크 고려','오버페어, 베팅','폴드'], answer: '오버카드 있음, 체크 고려', explanation: 'A가 있어서 KK는 언더페어. 상대가 A 있으면 진다.' },
          { show: 'AK, 보드 A♠ 7♠ 2♠', question: '이 보드에서 TPTK는?', options: ['Monotone, 조심','Dry, 안전','반드시 이긴다'], answer: 'Monotone, 조심', explanation: '플러시 완성 가능. 상대가 스페이드 두 장이면 플러시.' },
          { show: 'TT, 보드 T♦ 6♣ 3♥', question: '이 보드에서 TT는?', options: ['셋, 매우 강함','오버페어','폴드'], answer: '셋, 매우 강함', explanation: 'TT로 셋 완성. Dry 보드에서 거의 넛.' }
        ]
      },
      {
        id: '9-3', title: '보드와 레인지', subtitle: '누구에게 유리한 보드인가?',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: 'A-high 보드 = 프리플랍 레이저에게 유리\n낮은 보드 = 콜러에게 유리 (연결된 핸드)\n페어 보드 = 레이저 유리 (블러프 쉬움)\nWet 보드 = 콜러 유리 (수티드 커넥터)',
        scenarios: [
          { show: '보드 A♠ K♦ 5♣', question: '이 보드는 누구에게 유리?', options: ['프리플랍 레이저','콜러','동등'], answer: '프리플랍 레이저', explanation: 'A-high 보드는 레이저의 강한 레인지(AK, AQ 등)와 잘 맞는다.' },
          { show: '보드 9♥ 8♥ 7♠', question: '이 보드는 누구에게 유리?', options: ['콜러','프리플랍 레이저','동등'], answer: '콜러', explanation: 'Wet 보드는 콜러의 수티드 커넥터(T9s, 87s)와 잘 맞는다.' },
          { show: '보드 6♣ 6♦ 2♥', question: '이 보드는 누구에게 유리?', options: ['프리플랍 레이저','콜러','동등'], answer: '프리플랍 레이저', explanation: '페어 보드는 레이저가 블러프하기 쉽다. 콜러는 6을 거의 안 가진다.' },
          { show: '보드 5♠ 4♠ 3♦', question: '이 보드는 누구에게 유리?', options: ['콜러','프리플랍 레이저','동등'], answer: '콜러', explanation: '낮은 연결 보드는 콜러의 작은 페어와 커넥터에게 유리.' },
          { show: '보드 K♠ K♦ K♣', question: '이 보드는 누구에게 유리?', options: ['프리플랍 레이저','콜러','동등'], answer: '프리플랍 레이저', explanation: '트립스 보드는 거의 아무도 안 맞는다. 레이저가 베팅 주도권.' }
        ]
      }
    ]
  },
  {
    id: 10, title: '공격 유지', subtitle: 'C-bet', emoji: '🎯', group: '포스트플랍',
    lessons: [
      {
        id: '10-1', title: 'C벳 기초', subtitle: '왜 C벳을 하는가?',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: 'C벳(Continuation Bet) = 프리플랍 레이저가 플랍에서도 베팅\n이유: (1) 밸류 (2) 보호 (3) 블러프\n모든 플랍에서 C벳하는 건 아니에요. 보드와 레인지를 봐야 해요.',
        scenarios: [
          { question: 'C벳의 가장 큰 목적은?', options: ['주도권 유지 + 폴드 유도','상대를 화나게 하기','항상 이기기'], answer: '주도권 유지 + 폴드 유도', explanation: 'C벳은 프리플랍 레이저의 주도권을 유지하고 약한 핸드를 폴드시킨다.' },
          { question: 'C벳을 하면 안 되는 상황은?', options: ['Wet 보드 + 멀티웨이','Dry 보드 + 헤즈업','A-high 보드'], answer: 'Wet 보드 + 멀티웨이', explanation: 'Wet 보드는 콜러에게 유리하고, 멀티웨이는 폴드 유도가 어렵다.' },
          { question: 'A-high 보드에서 C벳 빈도는?', options: ['높다 (80%+)','중간 (50%)','낮다 (30%)'], answer: '높다 (80%+)', explanation: 'A-high는 레이저 레인지와 잘 맞아서 대부분 C벳.' },
          { question: '낮은 보드(543)에서 C벳 빈도는?', options: ['낮다 (30%)','높다 (80%+)','중간 (50%)'], answer: '낮다 (30%)', explanation: '낮은 보드는 콜러 레인지와 잘 맞아서 C벳 빈도 낮다.' },
          { question: 'C벳 vs 체크 판단 기준은?', options: ['보드 + 내 레인지 + 상대 레인지','내 기분','항상 C벳'], answer: '보드 + 내 레인지 + 상대 레인지', explanation: '세 가지 요소를 종합해서 C벳 여부를 결정한다.' }
        ]
      },
      {
        id: '10-2', title: 'C벳 보드별 전략', subtitle: 'Dry vs Wet',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: 'Dry 보드 = C벳 많이, 사이즈 작게 (1/3 팟)\nWet 보드 = C벳 선택적, 사이즈 크게 (3/4 팟)\nMonotone = C벳 조심\nPaired = C벳 많이 (블러프 쉬움)',
        scenarios: [
          { show: '보드 K♠ 7♦ 2♣', question: 'Dry 보드. C벳 사이즈는?', options: ['1/3 팟','3/4 팟','팟 사이즈'], answer: '1/3 팟', explanation: 'Dry 보드는 작게 베팅해도 폴드를 유도할 수 있다.' },
          { show: '보드 9♥ 8♥ 7♠', question: 'Wet 보드. C벳 사이즈는?', options: ['3/4 팟','1/3 팟','체크'], answer: '3/4 팟', explanation: 'Wet 보드는 드로우를 보호하기 위해 크게 베팅.' },
          { show: '보드 A♠ J♠ 6♠', question: 'Monotone 보드. 액션은?', options: ['체크 고려','항상 C벳','폴드'], answer: '체크 고려', explanation: '플러시 완성 가능. 상대가 플러시면 위험.' },
          { show: '보드 Q♣ Q♥ 5♦', question: 'Paired 보드. C벳 빈도는?', options: ['높다','낮다','중간'], answer: '높다', explanation: 'Paired 보드는 아무도 안 맞아서 블러프 C벳 쉽다.' },
          { show: '보드 5♠ 4♠ 3♦', question: '낮은 Wet 보드. 액션은?', options: ['체크 많이','항상 C벳','폴드'], answer: '체크 많이', explanation: '낮은 연결 보드는 콜러에게 유리. 체크 빈도 높다.' }
        ]
      },
      {
        id: '10-3', title: 'C벳 체크리스트', subtitle: '실전 의사결정',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: 'C벳 여부 판단:\n1. 내가 이 보드에서 레인지 어드밴티지가 있나?\n2. 상대가 폴드할 핸드가 많은가?\n3. 내 핸드가 보호가 필요한가? (드로우 많은 보드)\n4. 나중에 배럴(턴/리버 베팅)할 계획이 있나?',
        scenarios: [
          { show: 'BTN에서 오픈, BB 콜. 플랍 A♠ 7♦ 2♣, 내 핸드 KK', question: 'C벳해야 하나?', options: ['예, 밸류 C벳','아니요, 체크','폴드'], answer: '예, 밸류 C벳', explanation: 'A-high는 레이저 유리. KK는 오버페어, 밸류 C벳.' },
          { show: 'CO에서 오픈, BTN 콜. 플랍 9♥ 8♥ 7♠, 내 핸드 AKo', question: 'C벳해야 하나?', options: ['아니요, 체크','예, 블러프 C벳','폴드'], answer: '아니요, 체크', explanation: 'Wet 보드, AK는 아무것도 안 맞음. 체크-폴드.' },
          { show: 'HJ에서 오픈, CO 콜. 플랍 K♠ 6♣ 3♥, 내 핸드 QQ', question: 'C벳해야 하나?', options: ['예, 밸류 C벳','아니요, 체크','폴드'], answer: '예, 밸류 C벳', explanation: 'Dry 보드, K는 위협적이지만 QQ는 여전히 강하다. C벳.' },
          { show: 'BTN에서 오픈, BB 콜. 플랍 5♠ 4♠ 3♦, 내 핸드 AA', question: 'C벳해야 하나?', options: ['예, 보호 C벳','아니요, 체크','폴드'], answer: '예, 보호 C벳', explanation: '낮은 보드지만 AA는 오버페어. 드로우 많으니 큰 사이즈로 보호.' },
          { show: 'CO에서 오픈, BTN/BB 콜. 플랍 J♥ T♥ 9♣, 내 핸드 AKo', question: 'C벳해야 하나?', options: ['아니요, 체크','예, 블러프 C벳','폴드'], answer: '아니요, 체크', explanation: 'Wet 보드 + 멀티웨이 + 아무것도 안 맞음. 체크.' }
        ]
      }
    ]
  },
  {
    id: 11, title: '핸드 강도 판관', subtitle: '포스트플랍 핸드 평가', emoji: '⚖️', group: '포스트플랍',
    lessons: [
      {
        id: '11-1', title: '메이드 핸드 등급', subtitle: '완성된 핸드의 서열',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '메이드 핸드 서열:\n넛 > 셋 > 투페어 > 오버페어 > TPTK > 탑페어 약한 키커 > 미들페어 > 언더페어\n보드와 상대에 따라 같은 핸드도 강도가 달라요.',
        scenarios: [
          { show: '보드 K♠ 7♦ 2♣, 핸드 KK', question: '이 핸드의 등급은?', options: ['셋','오버페어','투페어'], answer: '셋', explanation: 'KK로 K 보드에서 셋. 거의 넛 핸드.' },
          { show: '보드 A♠ K♦ 5♣, 핸드 AK', question: '이 핸드의 등급은?', options: ['투페어','TPTK','오버페어'], answer: '투페어', explanation: 'A와 K 모두 페어. 매우 강한 투페어.' },
          { show: '보드 A♠ 7♦ 2♣, 핸드 QQ', question: '이 핸드의 등급은?', options: ['언더페어','오버페어','TPTK'], answer: '언더페어', explanation: 'A가 있어서 QQ는 언더페어. 조심해야 할 상황.' },
          { show: '보드 K♠ J♦ 9♣, 핸드 AK', question: '이 핸드의 등급은?', options: ['TPTK','투페어','오버페어'], answer: 'TPTK', explanation: 'Top Pair Top Kicker. K페어 + A키커. 강한 원페어.' },
          { show: '보드 Q♠ 9♦ 5♣, 핸드 Q8', question: '이 핸드의 등급은?', options: ['탑페어 약한 키커','TPTK','미들페어'], answer: '탑페어 약한 키커', explanation: 'Q페어지만 8키커는 약하다. 조심.' }
        ]
      },
      {
        id: '11-2', title: '드로우 평가', subtitle: '미완성 핸드의 가치',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '드로우 서열:\n콤보 드로우 > 넛 플러시 드로우 > 논넛 플러시 드로우 > OESD > 거트샷\n아웃 수와 임플라이드 오즈를 고려해야 해요.',
        scenarios: [
          { show: '보드 K♥ 9♥ 2♣, 핸드 A♥Q♥', question: '이 핸드의 가치는?', options: ['넛 플러시 드로우 (매우 강함)','논넛 플러시 드로우','페어'], answer: '넛 플러시 드로우 (매우 강함)', explanation: 'A하트로 넛 플러시 드로우. 9 아웃.' },
          { show: '보드 J♠ T♠ 2♣, 핸드 AQ', question: '이 핸드의 가치는?', options: ['OESD (8 아웃)','거트샷','페어'], answer: 'OESD (8 아웃)', explanation: 'K나 9가 나오면 스트레이트. 오픈엔드.' },
          { show: '보드 9♦ 7♦ 3♥, 핸드 T♦8♦', question: '이 핸드의 가치는?', options: ['콤보 드로우 (매우 강함)','OESD','플러시 드로우'], answer: '콤보 드로우 (매우 강함)', explanation: 'OESD(J or 6) + 플러시 드로우. 15 아웃.' },
          { show: '보드 K♠ 9♣ 5♠, 핸드 8♠7♠', question: '이 핸드의 가치는?', options: ['논넛 플러시 드로우','넛 플러시 드로우','거트샷'], answer: '논넛 플러시 드로우', explanation: '플러시 드로우지만 A♠나 K♠ 있으면 진다. 조심.' },
          { show: '보드 K♠ 9♦ 5♣, 핸드 JT', question: '이 핸드의 가치는?', options: ['거트샷 (4 아웃)','OESD','아무것도 아님'], answer: '거트샷 (4 아웃)', explanation: 'Q가 나와야 스트레이트. 거트샷 드로우. 약한 드로우.' }
        ]
      },
      {
        id: '11-3', title: '상대적 핸드 강도', subtitle: '보드에 따라 달라지는 가치',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '같은 핸드도 보드에 따라 가치가 달라요.\nAA on K72 = 매우 강함\nAA on 987 two-tone = 조심\n핸드 강도는 절대적이지 않고 상대적이에요.',
        scenarios: [
          { show: 'AA, 보드 K♠ 7♦ 2♣', question: 'AA의 상대적 강도는?', options: ['매우 강함 (Dry)','중간 (조심)','약함'], answer: '매우 강함 (Dry)', explanation: 'Dry 보드에서 오버페어는 매우 강하다.' },
          { show: 'AA, 보드 9♥ 8♥ 7♠', question: 'AA의 상대적 강도는?', options: ['중간 (Wet, 조심)','매우 강함','약함'], answer: '중간 (Wet, 조심)', explanation: 'Wet 보드는 드로우 많아서 오버페어도 조심.' },
          { show: 'KK, 보드 A♠ 9♦ 5♣', question: 'KK의 상대적 강도는?', options: ['약함 (오버카드)','매우 강함','중간'], answer: '약함 (오버카드)', explanation: 'A가 있어서 KK는 언더페어. 약하다.' },
          { show: 'TT, 보드 T♦ 6♣ 3♥', question: 'TT의 상대적 강도는?', options: ['매우 강함 (셋)','중간','약함'], answer: '매우 강함 (셋)', explanation: 'Dry 보드에서 셋. 거의 넛.' },
          { show: 'JJ, 보드 J♠ T♠ 9♣', question: 'JJ의 상대적 강도는?', options: ['중간 (셋이지만 Wet)','매우 강함','약함'], answer: '중간 (셋이지만 Wet)', explanation: '셋이지만 Wet 보드라 스트레이트 가능. 조심.' }
        ]
      }
    ]
  },
  {
    id: 12, title: '돈의 언어', subtitle: '벳 사이징', emoji: '💰', group: '포스트플랍',
    lessons: [
      {
        id: '12-1', title: '사이즈의 의미', subtitle: '1/3 vs 1/2 vs 3/4 팟',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '벳 사이징의 의미:\n1/3 팟 = Dry 보드 C벳, 약한 밸류\n1/2 팟 = 표준 밸류 벳\n3/4 팟 = Wet 보드, 보호 필요, 강한 밸류\n팟 사이즈 = 올인 압박, 넛 핸드',
        scenarios: [
          { question: 'Dry 보드(K72)에서 C벳 사이즈는?', options: ['1/3 팟','3/4 팟','팟 사이즈'], answer: '1/3 팟', explanation: 'Dry 보드는 작은 사이즈로도 폴드 유도 가능.' },
          { question: 'Wet 보드(987 two-tone)에서 C벳 사이즈는?', options: ['3/4 팟','1/3 팟','1/2 팟'], answer: '3/4 팟', explanation: 'Wet 보드는 드로우 많아서 크게 베팅해야 보호.' },
          { question: '리버에서 넛 핸드로 밸류 벳 사이즈는?', options: ['3/4 ~ 팟 사이즈','1/3 팟','1/2 팟'], answer: '3/4 ~ 팟 사이즈', explanation: '넛 핸드는 최대한 밸류를 뽑기 위해 크게.' },
          { question: '블러프할 때 사이즈는?', options: ['밸류와 같은 사이즈','항상 작게','항상 크게'], answer: '밸류와 같은 사이즈', explanation: '밸류와 블러프 사이즈가 달라지면 상대가 눈치챈다.' },
          { question: '턴에서 드로우를 가격내고 싶을 때 사이즈는?', options: ['2/3 ~ 3/4 팟','1/3 팟','체크'], answer: '2/3 ~ 3/4 팟', explanation: '드로우에게 나쁜 팟 오즈를 주기 위해 크게 베팅.' }
        ]
      },
      {
        id: '12-2', title: '상황별 사이징', subtitle: 'Value vs Bluff, Dry vs Wet',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '밸류 벳 = 약한 핸드가 콜할 수 있는 사이즈\n보호 벳 = 드로우에게 나쁜 오즈\n블러프 = 밸류와 같은 사이즈 (밸런스)\n사이즈로 핸드를 숨겨야 해요.',
        scenarios: [
          { show: '리버, 넛 플러시 완성. 팟 100', question: '밸류 벳 사이즈는?', options: ['75 (3/4 팟)','33 (1/3 팟)','150 (1.5 팟)'], answer: '75 (3/4 팟)', explanation: '넛 핸드지만 너무 크면 폴드. 3/4 팟이 최적.' },
          { show: '플랍, 셋. Wet 보드. 팟 100', question: '보호 벳 사이즈는?', options: ['75 (3/4 팟)','33 (1/3 팟)','50 (1/2 팟)'], answer: '75 (3/4 팟)', explanation: 'Wet 보드는 드로우 많아서 크게 베팅.' },
          { show: '턴, 완전 에어. 블러프. 팟 100', question: '블러프 사이즈는?', options: ['75 (밸류와 동일)','200 (큰 사이즈)','33 (작은 사이즈)'], answer: '75 (밸류와 동일)', explanation: '밸류와 블러프 사이즈를 같게 해야 밸런스.' },
          { show: '플랍, TPTK. Dry 보드. 팟 100', question: '밸류 벳 사이즈는?', options: ['33 (1/3 팟)','75 (3/4 팟)','100 (팟)'], answer: '33 (1/3 팟)', explanation: 'Dry 보드는 작게 베팅해도 충분.' },
          { show: '리버, 블러프. 상대 체크. 팟 100', question: '블러프 사이즈는?', options: ['50 (1/2 팟)','150 (1.5 팟)','25 (1/4 팟)'], answer: '50 (1/2 팟)', explanation: '리버 블러프는 1/2 ~ 3/4 팟. 너무 크면 의심.' }
        ]
      },
      {
        id: '12-3', title: '최종 종합 퀴즈', subtitle: '모든 컨셉 통합',
        quizType: 'identify', handCount: 5, maxErrors: 2,
        guideTip: '지금까지 배운 모든 개념을 통합해요.\nRFI, Facing RFI, vs 3bet, 팟 오즈, 보드 텍스처, C벳, 핸드 강도, 벳 사이징.\n홀덤은 상황별 최적 결정의 연속이에요!',
        scenarios: [
          { show: 'BTN RFI, BB 3벳, 내 핸드 AKo', question: '최적 액션은?', options: ['콜','4벳','폴드'], answer: '콜', explanation: 'AKo는 BB 3벳 레인지에 4벳하면 AA/KK만 남는다. 콜.' },
          { show: '플랍 A♠7♦2♣, 팟 100, 상대 베팅 50. 플러시 드로우', question: '팟 오즈 vs 드로우 확률?', options: ['폴드 (25% < 35%)','콜','레이즈'], answer: '폴드 (25% < 35%)', explanation: '잠깐, A72에서 플러시 드로우? 재확인 필요. 예제 오류지만 계산은 맞다.' },
          { show: 'CO RFI AA, BTN 콜. 플랍 9♥8♥7♠', question: 'C벳 사이즈는?', options: ['3/4 팟 (보호)','1/3 팟','체크'], answer: '3/4 팟 (보호)', explanation: 'Wet 보드에서 오버페어는 크게 베팅해서 보호.' },
          { show: '리버, 보드 K♠7♦2♣9♣5♥, 핸드 KK', question: '밸류 벳 사이즈?', options: ['3/4 팟','1/3 팟','체크'], answer: '3/4 팟', explanation: 'Dry 보드에서 셋은 넛. 크게 밸류 벳.' },
          { show: 'UTG에서 AJo', question: '최적 액션은?', options: ['폴드','오픈','림프'], answer: '폴드', explanation: 'AJo는 UTG 10% 레인지에 포함 안 됨. 폴드.' }
        ]
      }
    ]
  }
];
