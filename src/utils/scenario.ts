import { RFI_RANGES, FACING_RFI_RANGES, VS_3BET_RANGES } from '@/data/ranges';
import { RANKS } from '@/data/constants';
import { SKILL_TREE } from '@/data/skill-tree';
import type { Scenario } from '@/data/skill-tree';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from './correct-action';
import { shuffleArray } from './shuffle';

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
      options: shuffleArray(pos === 'SB' ? ['레이즈', '림프', '폴드'] : ['레이즈', '폴드']),
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
      options: shuffleArray(['3bet', '콜', '폴드']),
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
      options: shuffleArray(['4bet', '콜', '폴드']),
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
    if (['A','K','Q','J'].includes(r1)) return '높은 페어라 이길 확률이 매우 높은 핸드예요!';
    if (['T','9','8'].includes(r1)) return '중간 페어예요. 괜찮은 핸드!';
    return '작은 페어예요. 상황에 따라 달라요.';
  }
  if (r1 === 'A' && isSuited && !highRanks.includes(r2)) return '에이스 + 같은 무늬! 플러시 가능성이 있어서 플레이할 만한 핸드예요.';
  if (r1 === 'A' && isOffsuit && !highRanks.includes(r2)) return '에이스가 있지만 다른 무늬라 플러시 가능성이 없어요.';
  if (bothHigh && isSuited) return '높은 카드 2장 + 같은 무늬! 상위권 핸드예요.';
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
    return `🧠 생각 과정\n① 내 자리: ${position} → 상위 ${pct}까지 플레이 가능\n② 내 패: ${hand} ${handDesc ? '→ ' + handDesc : ''}\n③ 결론: 레인지 안에 포함 → 레이즈!\n\n${position === 'BTN' ? '💡 만약 폴드했다면? 이 자리에서 이 패를 안 치면 돈 벌 기회를 버리는 거예요.' : '💡 만약 폴드했다면? 충분히 플레이할 수 있는 핸드를 접으면 장기적으로 손해예요.'}`;
  }
  if (correctAction === 'limp') {
    return `🧠 생각 과정\n① 내 자리: SB → 이미 0.5BB 넣은 상태\n② 내 패: ${hand} ${handDesc ? '→ ' + handDesc : ''}\n③ 결론: 크게 올리기엔 부족, 접기엔 아까움 → 림프!\n\n💡 만약 레이즈했다면? BB가 3벳하면 곤란해요. 이 핸드는 적은 돈으로 다음 카드를 보는 게 최선.\n💡 만약 폴드했다면? 이미 0.5BB 넣었고 BB만 남았으니, 이 정도 핸드는 싸게 참여할 만해요.`;
  }
  return `🧠 생각 과정\n① 내 자리: ${position} → ${posDesc}\n② 내 패: ${hand} ${handDesc ? '→ ' + handDesc : ''}\n③ 결론: 레인지 밖 → 폴드가 맞아요\n\n💡 만약 레이즈했다면? 뒤에 남은 사람 중 하나가 더 좋은 패로 다시 올릴 확률이 높아요. 장기적으로 손해예요.`;
}

function generateFacingExplanation(hand: string, myPos: string, vsPos: string, correctAction: string, range: any): string {
  const handDesc = describeHand(hand);
  const isValue = range.value?.includes(hand);

  if (correctAction === '3bet') {
    const reason = isValue
      ? '상위권 핸드니까 판을 키워야 해요'
      : hand.startsWith('A') ? '에이스 블로커 + 상대 폴드 유도' : '상대 폴드를 유도하는 블러프';
    return `🧠 생각 과정\n① 상황: ${vsPos}가 오픈 → 나(${myPos})의 차례\n② 내 패: ${hand} ${handDesc ? '→ ' + handDesc : ''}\n③ 판단: ${reason} → 3벳!\n\n💡 만약 콜했다면? ${isValue ? '강한 핸드인데 콜만 하면 팟을 키울 기회를 놓쳐요.' : '이 핸드는 콜하면 포스트플랍에서 어려운 상황이 많아요. 3벳으로 지금 결판내는 게 나아요.'}\n💡 만약 폴드했다면? ${isValue ? '이 정도 핸드를 접으면 너무 타이트해요. 장기적으로 큰 손해!' : '블러프 3벳 기회를 놓치면 상대가 편하게 플레이하게 돼요.'}`;
  }
  if (correctAction === 'call') {
    return `🧠 생각 과정\n① 상황: ${vsPos}가 오픈 → 나(${myPos})의 차례\n② 내 패: ${hand} ${handDesc ? '→ ' + handDesc : ''}\n③ 판단: 3벳하기엔 약간 부족, 폴드하기엔 아까움 → 콜!\n\n💡 만약 3벳했다면? 상대가 4벳하면 접어야 해요. 이 핸드는 콜로 포스트플랍을 보는 게 더 수익적이에요.\n💡 만약 폴드했다면? 충분히 플레이할 수 있는 핸드예요. 접으면 너무 타이트해져요.`;
  }
  return `🧠 생각 과정\n① 상황: ${vsPos}가 오픈 → 나(${myPos})의 차례\n② 내 패: ${hand} ${handDesc ? '→ ' + handDesc : ''}\n③ 판단: 상대 레인지에 대해 이 핸드는 너무 약함 → 폴드\n\n💡 만약 콜했다면? 포스트플랍에서 좋은 상황을 만들기 어렵고, 돈만 잃을 확률이 높아요.\n💡 만약 3벳했다면? 블러프 3벳은 특정 핸드(에이스 블로커 등)로 해야 효과적이에요. 이 핸드로는 비추!`;
}

function generateVs3betExplanation(hand: string, pos: string, correctAction: string, range: any): string {
  const handDesc = describeHand(hand);
  const isValue = range.fourBetValue?.includes(hand);

  if (correctAction === '4bet') {
    const reason = isValue
      ? '프리미엄 핸드! 판을 더 키워야 해요'
      : hand.startsWith('A') ? '에이스 블로커로 상대 AA 확률을 줄이면서 압박' : '블러프 4벳으로 상대 폴드 유도';
    return `🧠 생각 과정\n① 상황: ${pos}에서 오픈 → 상대 3벳\n② 내 패: ${hand} ${handDesc ? '→ ' + handDesc : ''}\n③ 판단: ${reason} → 4벳!\n\n💡 만약 콜했다면? ${isValue ? '이렇게 강한 핸드로 콜만 하면 팟을 키울 기회를 놓쳐요.' : '이 핸드는 콜하면 포스트플랍에서 어중간해져요. 4벳으로 지금 결판내세요.'}\n💡 만약 폴드했다면? ${isValue ? '절대 접으면 안 되는 핸드예요! 이런 핸드를 접으면 엄청난 손해.' : '블러프 4벳 기회를 놓치면 상대가 3벳을 남발하게 돼요.'}`;
  }
  if (correctAction === 'call') {
    return `🧠 생각 과정\n① 상황: ${pos}에서 오픈 → 상대 3벳\n② 내 패: ${hand} ${handDesc ? '→ ' + handDesc : ''}\n③ 판단: 4벳하기엔 부담, 폴드하기엔 아까움 → 콜!\n\n💡 만약 4벳했다면? 상대가 올인하면 곤란해요. 이 핸드는 콜로 플랍을 보는 게 더 안전하고 수익적이에요.\n💡 만약 폴드했다면? 3벳 앞에서 너무 많이 접으면 상대가 3벳을 남발해요. 이 정도 핸드는 버텨야 해요.`;
  }
  return `🧠 생각 과정\n① 상황: ${pos}에서 오픈 → 상대 3벳\n② 내 패: ${hand} ${handDesc ? '→ ' + handDesc : ''}\n③ 판단: 3벳 레인지에 대해 너무 약함 → 폴드\n\n💡 만약 콜했다면? 3벳 팟은 커요. 이 핸드로 계속하면 돈만 태울 확률이 높아요.\n💡 만약 4벳했다면? 블러프 4벳은 에이스 블로커 같은 특수한 핸드로 해야 해요. 이 핸드로는 위험해요.`;
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
