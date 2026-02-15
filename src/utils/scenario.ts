import { RFI_RANGES, FACING_RFI_RANGES, VS_3BET_RANGES } from '@/data/ranges';
import { RANKS } from '@/data/constants';
import { SKILL_TREE } from '@/data/skill-tree';
import type { Scenario } from '@/data/skill-tree';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from './correct-action';

const ALL_HANDS: string[] = [];
for (let i = 0; i < RANKS.length; i++) {
  for (let j = i; j < RANKS.length; j++) {
    if (i === j) ALL_HANDS.push(RANKS[i] + RANKS[j]);
    else { ALL_HANDS.push(RANKS[i] + RANKS[j] + 's'); ALL_HANDS.push(RANKS[i] + RANKS[j] + 'o'); }
  }
}

export function generateRfiScenarios(positions: string[], count: number) {
  const scenarios = [];
  for (let n = 0; n < count; n++) {
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const range = RFI_RANGES[pos];
    const raiseHands = range?.raise || [...(range?.raiseValue || []), ...(range?.raiseBluff || [])];
    const borderHands = raiseHands.slice(-Math.ceil(raiseHands.length * 0.3));

    let hand: string;
    if (Math.random() < 0.4 && borderHands.length > 0) hand = borderHands[Math.floor(Math.random() * borderHands.length)];
    else if (Math.random() < 0.5) hand = raiseHands[Math.floor(Math.random() * raiseHands.length)];
    else hand = ALL_HANDS[Math.floor(Math.random() * ALL_HANDS.length)];

    const correctAction = getCorrectAction_RFI(hand, pos);
    const actionLabel = correctAction === 'raise' ? '레이즈' : correctAction === 'limp' ? '림프' : '폴드';

    scenarios.push({
      quizType: 'rfi_dynamic' as const,
      position: pos, hand, correctAction,
      options: pos === 'SB' ? ['레이즈', '림프', '폴드'] : ['레이즈', '폴드'],
      answer: actionLabel,
      explanation: generateRfiExplanation(hand, pos, correctAction),
    });
  }
  return scenarios;
}

export function generateFacingScenarios(myPositions: string[], count: number) {
  // Find all available keys for the given positions
  const availableKeys: { key: string; myPos: string; vsPos: string }[] = [];
  for (const myPos of myPositions) {
    for (const key of Object.keys(FACING_RFI_RANGES)) {
      if (key.startsWith(myPos + '_vs_')) {
        const vsPos = key.replace(myPos + '_vs_', '');
        availableKeys.push({ key, myPos, vsPos });
      }
    }
  }
  if (availableKeys.length === 0) return [];

  const scenarios = [];
  for (let n = 0; n < count; n++) {
    const { key, myPos, vsPos } = availableKeys[Math.floor(Math.random() * availableKeys.length)];
    const range = FACING_RFI_RANGES[key];
    const actionHands = [...(range.value || []), ...(range.bluff || []), ...(range.call || [])];
    const borderHands = actionHands.slice(-Math.ceil(actionHands.length * 0.3));

    let hand: string;
    if (Math.random() < 0.4 && borderHands.length > 0) hand = borderHands[Math.floor(Math.random() * borderHands.length)];
    else if (Math.random() < 0.5) hand = actionHands[Math.floor(Math.random() * actionHands.length)];
    else hand = ALL_HANDS[Math.floor(Math.random() * ALL_HANDS.length)];

    const correctAction = getCorrectAction_Facing(hand, myPos, vsPos);
    const actionLabel = correctAction === '3bet' ? '3bet' : correctAction === 'call' ? '콜' : '폴드';

    scenarios.push({
      quizType: 'facing_dynamic' as const,
      position: myPos, vsPosition: vsPos, hand, correctAction,
      options: ['3bet', '콜', '폴드'],
      answer: actionLabel,
      explanation: generateFacingExplanation(hand, myPos, vsPos, correctAction, range),
    });
  }
  return scenarios;
}

export function generateVs3betScenarios(positions: string[], count: number) {
  const scenarios = [];
  for (let n = 0; n < count; n++) {
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const key = pos === 'SB' ? 'SB_vs_BB_3bet' : `${pos}_vs_3bet`;
    const range = VS_3BET_RANGES[key];
    if (!range) continue;

    const actionHands = [...(range.fourBetValue || []), ...(range.fourBetBluff || []), ...(range.call || [])];
    const borderHands = actionHands.slice(-Math.ceil(actionHands.length * 0.3));

    let hand: string;
    if (Math.random() < 0.4 && borderHands.length > 0) hand = borderHands[Math.floor(Math.random() * borderHands.length)];
    else if (Math.random() < 0.5) hand = actionHands[Math.floor(Math.random() * actionHands.length)];
    else hand = ALL_HANDS[Math.floor(Math.random() * ALL_HANDS.length)];

    const correctAction = getCorrectAction_Vs3bet(hand, pos);
    const actionLabel = correctAction === '4bet' ? '4bet' : correctAction === 'call' ? '콜' : '폴드';
    const vsPos = pos === 'SB' ? 'BB' : 'IP';

    scenarios.push({
      quizType: 'vs3bet_dynamic' as const,
      position: pos, vsPosition: vsPos, hand, correctAction,
      options: ['4bet', '콜', '폴드'],
      answer: actionLabel,
      explanation: generateVs3betExplanation(hand, pos, correctAction, range),
    });
  }
  return scenarios;
}

// 포지션별 쉬운 설명
const POS_DESC: Record<string, string> = {
  'UTG': '앞자리(UTG)는 뒤에 8명이나 남아있어서 정말 좋은 패만 골라야 해요.',
  'UTG+1': '앞자리(UTG+1)는 뒤에 7명이 남아서 타이트하게 골라야 해요.',
  'UTG+2': '앞자리(UTG+2)는 아직 뒤에 6명이 남아서 신중해야 해요.',
  'LJ': '중간 자리(LJ)는 뒤에 5명이 남아서 조금 더 넓게 플레이 가능해요.',
  'HJ': '중간 자리(HJ)는 뒤에 4명만 남아서 꽤 넓게 플레이할 수 있어요.',
  'CO': '뒷자리(CO)는 뒤에 3명만 남아서 넓게 공격할 수 있어요.',
  'BTN': '버튼(BTN)은 최고의 자리! 뒤에 2명(블라인드)만 남아서 절반 이상의 패로 공격 가능!',
  'SB': '스몰 블라인드(SB)는 특수한 자리예요. 이미 돈을 조금 넣었지만 포스트플랍에서 불리해요.',
  'BB': '빅 블라인드(BB)는 이미 돈을 넣은 상태라 싸게 게임에 참여할 수 있어요.',
};

// 핸드 설명 헬퍼
function describeHand(hand: string): string {
  const isPair = hand.length === 2 && hand[0] === hand[1];
  const isSuited = hand.endsWith('s');
  const isOffsuit = hand.endsWith('o');
  const highRanks = ['A', 'K', 'Q', 'J', 'T'];
  const r1 = hand[0], r2 = hand[1];
  const bothHigh = highRanks.includes(r1) && highRanks.includes(r2);

  if (isPair) {
    if (['A','K','Q','J'].includes(r1)) return '높은 페어라 이길 확률이 매우 높아요!';
    if (['T','9','8'].includes(r1)) return '중간 페어예요. 괜찮은 패!';
    return '작은 페어예요. 상황에 따라 달라요.';
  }
  if (r1 === 'A' && isSuited && !highRanks.includes(r2)) return '에이스 + 같은 무늬! 플러시 가능성이 있어서 좋은 패예요.';
  if (r1 === 'A' && isOffsuit && !highRanks.includes(r2)) return '에이스가 있지만 다른 무늬라 플러시 가능성이 없어요.';
  if (bothHigh && isSuited) return '높은 카드 2장 + 같은 무늬! 이길 확률이 높은 패예요.';
  if (bothHigh && isOffsuit) return '높은 카드 2장이지만 다른 무늬라 이길 확률이 조금 낮아요.';
  if (isSuited) return '같은 무늬라서 플러시 가능성이 있어요.';
  return '';
}

function generateRfiExplanation(hand: string, position: string, correctAction: string): string {
  const range = RFI_RANGES[position];
  const pct = range?.percent || '';
  const posDesc = POS_DESC[position] || '';
  const handDesc = describeHand(hand);

  if (correctAction === 'raise') {
    return `${hand}은(는) 이 자리(${position})에서 베팅해도 되는 패예요! 👍\n${handDesc ? handDesc + ' ' : ''}상위 ${pct}에 포함되니까 자신있게 레이즈!`;
  }
  if (correctAction === 'limp') {
    return `${hand}은(는) SB에서 살짝 참여하는 게 좋아요.\n크게 올리기엔 약하지만, 접기엔 아까운 패예요.\n적은 돈만 내고 다음 카드를 봐요.`;
  }
  return `${hand}은(는) 이 자리(${position})에서는 접는 게 맞아요.\n${posDesc}\n${handDesc ? handDesc + ' 하지만 ' : ''}이 자리에서 베팅하기엔 부족해요. 좋은 자리를 기다리세요!`;
}

function generateFacingExplanation(hand: string, myPos: string, vsPos: string, correctAction: string, range: any): string {
  const handDesc = describeHand(hand);
  const isValue = range.value?.includes(hand);

  if (correctAction === '3bet') {
    if (isValue) {
      return `${hand}은(는) 여기서 다시 올려야 해요! (3벳)\n${handDesc ? handDesc + ' ' : ''}상대(${vsPos})가 먼저 베팅했지만, 내가 이길 확률이 높으니까 판을 키우세요!`;
    }
    return `${hand}은(는) 여기서 다시 올려서 상대를 흔들어요! (3벳)\n최강 패는 아니지만, 상대가 포기하면 이득이에요.\n${hand.startsWith('A') ? '에이스가 있어서 상대가 AA/AK를 가질 확률을 줄여주기도 해요.' : ''}`;
  }
  if (correctAction === 'call') {
    return `${hand}은(는) 여기서 따라가는 게 좋아요. (콜)\n다시 올리기엔(3벳) 좀 부족하고, 접기엔 아까운 패예요.\n${handDesc ? handDesc + ' ' : ''}다음 카드를 보면서 기회를 노려요!`;
  }
  return `${hand}은(는) 여기서 접는 게 현명해요.\n상대가 ${vsPos}에서 베팅했다는 건 꽤 좋은 패를 가졌다는 뜻이에요.\n이 패로 싸우기엔 불리해요. 다음 기회를 기다리세요!`;
}

function generateVs3betExplanation(hand: string, pos: string, correctAction: string, range: any): string {
  const handDesc = describeHand(hand);
  const isValue = range.fourBetValue?.includes(hand);

  if (correctAction === '4bet') {
    if (isValue) {
      return `${hand}은(는) 이길 확률이 매우 높은 패! 상대가 다시 올렸어도(3벳) 한 번 더 올려요! (4벳)\n${handDesc ? handDesc + ' ' : ''}이런 패는 자신있게 밀어붙여야 해요!`;
    }
    return `${hand}은(는) 여기서 한 번 더 올려서(4벳) 상대를 압박해요.\n${hand.startsWith('A') ? '에이스가 있어서 상대의 AA 가능성을 줄여주고, ' : ''}상대가 포기하면 큰 이득!`;
  }
  if (correctAction === 'call') {
    return `${hand}은(는) 상대가 다시 올렸지만(3벳), 접기엔 아까운 패예요.\n한 번 더 올리기엔(4벳) 부담스럽고, 여기선 따라가면서(콜) 다음 카드를 봐요.\n${handDesc}`;
  }
  return `${hand}은(는) 상대가 다시 올렸으면(3벳) 여기서 접어야 해요.\n처음 베팅은 했지만, 상대가 다시 올렸다는 건 이길 확률이 높은 패라는 신호예요.\n${handDesc ? handDesc + ' 하지만 ' : ''}이 상황에서 버티기엔 부족해요.`;
}

export function generateTestOutScenarios(unitId: number): (Scenario & { quizType?: string; position?: string; hand?: string; vsPosition?: string })[] {
  const unit = SKILL_TREE.find(u => u.id === unitId);
  if (!unit || unit.lessons.length === 0) return [];

  const allScenarios: (Scenario & { quizType?: string; position?: string; hand?: string; vsPosition?: string })[] = [];
  const lessonsCount = unit.lessons.length;
  const perLesson = Math.max(1, Math.floor(10 / lessonsCount));
  let remaining = 10 - perLesson * lessonsCount;

  for (const lesson of unit.lessons) {
    const count = perLesson + (remaining > 0 ? 1 : 0);
    if (remaining > 0) remaining--;

    if (lesson.quizType === 'rfi_dynamic' && lesson.positions) {
      allScenarios.push(...generateRfiScenarios(lesson.positions, count));
    } else if (lesson.quizType === 'facing_dynamic' && lesson.positions) {
      allScenarios.push(...generateFacingScenarios(lesson.positions, count));
    } else if (lesson.quizType === 'vs3bet_dynamic' && lesson.positions) {
      allScenarios.push(...generateVs3betScenarios(lesson.positions, count));
    } else if (lesson.scenarios) {
      const shuffled = [...lesson.scenarios].sort(() => Math.random() - 0.5);
      allScenarios.push(...shuffled.slice(0, count).map(s => ({ ...s, quizType: lesson.quizType })));
    }
  }

  // 섞어서 10개 리턴
  return allScenarios.sort(() => Math.random() - 0.5).slice(0, 10);
}
