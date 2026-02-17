import { RFI_RANGES, FACING_RFI_RANGES, VS_3BET_RANGES } from '@/data/ranges';
import { RANKS, SUITS, type Card } from '@/data/constants';
import { SKILL_TREE, CHAPTERS } from '@/data/skill-tree';
import type { Scenario } from '@/data/skill-tree';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from './correct-action';
import { generateFlop, analyzeBoardTexture, evaluateHandStrength } from './board';
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

export function generateRfiExplanation(hand: string, position: string, correctAction: string): string {
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

export function generateFacingExplanation(hand: string, myPos: string, vsPos: string, correctAction: string, range: any): string {
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

export function generateVs3betExplanation(hand: string, pos: string, correctAction: string, range: any): string {
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

export function generateCbetExplanation(
  hand: string,
  position: string,
  handStrength: { category: string; name: string; shouldCbet: boolean; reason: string; hasDraws: boolean; draws: string[] },
  boardTexture: { tags: string[]; isDry: boolean; isWet: boolean; favorsCbet: number },
): string {
  const handDesc = describeHand(hand);
  const boardDesc = boardTexture.tags.join(' + ');
  const drawInfo = handStrength.hasDraws ? `(${handStrength.draws.join(', ')})` : '';

  if (handStrength.shouldCbet) {
    const isBluff = handStrength.category === 'air';
    const isSemiBluff = handStrength.hasDraws && (handStrength.category === 'air' || handStrength.category === 'underpair');

    if (isSemiBluff) {
      return `🧠 생각 과정\n① 내 핸드: ${hand} → ${handStrength.name} ${drawInfo}\n${handDesc ? '   ' + handDesc + '\n' : ''}② 보드: ${boardDesc}\n③ 판단: ${handStrength.reason}\n\n💡 만약 체크했다면? 드로우가 있을 때 베팅하면 두 가지 이득이 있어요: 상대가 폴드하면 바로 이기고, 콜해도 드로우가 완성될 수 있어요.`;
    }
    if (isBluff) {
      return `🧠 생각 과정\n① 내 핸드: ${hand} → ${handStrength.name}\n${handDesc ? '   ' + handDesc + '\n' : ''}② 보드: ${boardDesc} → ${boardTexture.isDry ? '드라이한 보드라 상대도 맞지 않았을 확률이 높아요' : '보드가 좋지는 않지만'}\n③ 판단: ${handStrength.reason}\n\n💡 만약 체크했다면? 에어로 체크하면 팟을 포기하는 거예요. 프리플랍 공격자로서 드라이 보드에서 베팅하면 상대가 못 맞췄을 때 쉽게 폴드해요.`;
    }
    // Value C-bet
    return `🧠 생각 과정\n① 내 핸드: ${hand} → ${handStrength.name} ${drawInfo}\n${handDesc ? '   ' + handDesc + '\n' : ''}② 보드: ${boardDesc}\n③ 판단: ${handStrength.reason}\n\n💡 만약 체크했다면? 좋은 핸드로 체크하면 팟을 키울 기회를 놓쳐요. 밸류를 뽑을 수 있을 때 베팅하세요!`;
  }

  // Should check
  if (handStrength.category === 'middlepair' || handStrength.category === 'underpair') {
    return `🧠 생각 과정\n① 내 핸드: ${hand} → ${handStrength.name} ${drawInfo}\n${handDesc ? '   ' + handDesc + '\n' : ''}② 보드: ${boardDesc}\n③ 판단: ${handStrength.reason}\n\n💡 만약 C-bet했다면? 약한 메이드 핸드로 베팅하면 더 좋은 핸드만 콜하고, 더 나쁜 핸드는 폴드해요. 체크로 쇼다운 밸류를 지키는 게 낫습니다.`;
  }

  return `🧠 생각 과정\n① 내 핸드: ${hand} → ${handStrength.name} ${drawInfo}\n${handDesc ? '   ' + handDesc + '\n' : ''}② 보드: ${boardDesc} → ${boardTexture.isWet ? '웻한 보드라 상대가 맞았을 확률이 높아요' : '이 보드에서는'}\n③ 판단: ${handStrength.reason}\n\n💡 만약 C-bet했다면? ${boardTexture.isWet ? '웻 보드에서 에어로 베팅하면 상대가 콜/레이즈할 확률이 높아서 돈만 잃어요.' : '이 상황에서 무리한 블러프는 비효율적이에요. 체크하고 다음 카드를 보세요.'}`;
}

export function generateBossScenarios(chapterId: number, count: number = 15): (Scenario & { quizType?: string; position?: string; hand?: string; vsPosition?: string })[] {
  const chapter = CHAPTERS.find(c => c.id === chapterId);
  if (!chapter) return [];

  const units = chapter.unitIds.map(id => SKILL_TREE.find(u => u.id === id)).filter(Boolean);
  const allScenarios: (Scenario & { quizType?: string; position?: string; hand?: string; vsPosition?: string })[] = [];

  // Calculate per-unit allocation
  const totalLessons = units.reduce((sum, u) => sum + (u?.lessons.length || 0), 0);
  const perLesson = Math.max(1, Math.ceil(count / Math.max(1, totalLessons)));

  for (const unit of units) {
    if (!unit) continue;
    for (const lesson of unit.lessons) {
      if (lesson.quizType === 'rfi_dynamic' && lesson.positions) {
        allScenarios.push(...generateRfiScenarios(lesson.positions, perLesson));
      } else if (lesson.quizType === 'facing_dynamic' && lesson.positions) {
        allScenarios.push(...generateFacingScenarios(lesson.positions, perLesson));
      } else if (lesson.quizType === 'vs3bet_dynamic' && lesson.positions) {
        allScenarios.push(...generateVs3betScenarios(lesson.positions, perLesson));
      } else if (lesson.quizType === 'board_texture') {
        allScenarios.push(...generateBoardTextureScenarios(perLesson));
      } else if (lesson.quizType === 'hand_strength') {
        allScenarios.push(...generateHandStrengthScenarios(perLesson));
      } else if (lesson.quizType === 'pot_odds') {
        allScenarios.push(...generatePotOddsScenarios(perLesson));
      } else if (lesson.quizType === 'cbet_dynamic') {
        allScenarios.push(...generateCbetScenarios(perLesson));
      } else if (lesson.quizType === 'turn_dynamic') {
        allScenarios.push(...generateTurnScenarios(perLesson));
      } else if (lesson.quizType === 'river_dynamic') {
        allScenarios.push(...generateRiverScenarios(perLesson));
      } else if (lesson.quizType === 'sizing_dynamic') {
        allScenarios.push(...generateSizingScenarios(perLesson));
      } else if (lesson.scenarios) {
        const shuffled = shuffleArray([...lesson.scenarios]);
        allScenarios.push(...shuffled.slice(0, perLesson).map(s => ({ ...s, quizType: lesson.quizType })));
      }
    }
  }

  return shuffleArray(allScenarios).slice(0, count);
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
    } else if (lesson.quizType === 'board_texture') {
      allScenarios.push(...generateBoardTextureScenarios(count));
    } else if (lesson.quizType === 'hand_strength') {
      allScenarios.push(...generateHandStrengthScenarios(count));
    } else if (lesson.quizType === 'pot_odds') {
      allScenarios.push(...generatePotOddsScenarios(count));
    } else if (lesson.quizType === 'cbet_dynamic') {
      allScenarios.push(...generateCbetScenarios(count));
    } else if (lesson.quizType === 'turn_dynamic') {
      allScenarios.push(...generateTurnScenarios(count));
    } else if (lesson.quizType === 'river_dynamic') {
      allScenarios.push(...generateRiverScenarios(count));
    } else if (lesson.quizType === 'sizing_dynamic') {
      allScenarios.push(...generateSizingScenarios(count));
    } else if (lesson.scenarios) {
      const shuffled = [...lesson.scenarios].sort(() => Math.random() - 0.5);
      allScenarios.push(...shuffled.slice(0, count).map(s => ({ ...s, quizType: lesson.quizType })));
    }
  }

  // 섞어서 10개 리턴
  return allScenarios.sort(() => Math.random() - 0.5).slice(0, 10);
}

// ========== Post-flop Dynamic Generators ==========

function fmtCard(c: Card): string { return `${c.rank}${c.suit}`; }
function fmtBoard(board: Card[]): string { return board.map(fmtCard).join(' '); }

function randomHand(exclude: Card[]): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      if (!exclude.some(c => c.rank === rank && c.suit === suit)) deck.push({ rank, suit });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return [deck[0], deck[1]];
}

// --- Board Texture Scenarios (Unit 12) ---
export function generateBoardTextureScenarios(count: number): (Scenario & { quizType?: string; boardCards?: Card[] })[] {
  const scenarios: (Scenario & { quizType?: string; boardCards?: Card[] })[] = [];

  for (let i = 0; i < count; i++) {
    const board = generateFlop([]);
    const texture = analyzeBoardTexture(board);
    const boardStr = fmtBoard(board);
    const qType = i % 3;

    if (qType === 0) {
      // Board type classification
      let answer: string;
      if (texture.isMonotone) answer = 'Monotone';
      else if (texture.isPaired) answer = 'Paired';
      else if (texture.isWet) answer = 'Wet';
      else answer = 'Dry';

      const explanations: Record<string, string> = {
        Dry: '연결도 적고 무늬도 다양한 안전한 보드.',
        Wet: '스트레이트/플러시 가능성이 많은 위험한 보드.',
        Paired: '페어가 있어 풀하우스/트립스 가능.',
        Monotone: '같은 무늬 3장. 플러시가 이미 가능.',
      };

      scenarios.push({
        show: boardStr,
        question: '이 보드의 유형은?',
        options: shuffleArray(['Dry', 'Wet', 'Paired', 'Monotone']),
        answer,
        explanation: `${boardStr} → ${texture.tags.join(', ')}. ${explanations[answer]}`,
        quizType: 'board_texture',
        boardCards: board,
      });
    } else if (qType === 1) {
      // C-bet frequency
      let answer: string;
      if (texture.favorsCbet >= 60) answer = '높다 (자주 베팅)';
      else if (texture.favorsCbet >= 40) answer = '중간';
      else answer = '낮다 (체크 위주)';

      scenarios.push({
        show: boardStr,
        question: '이 보드에서 C벳 빈도는?',
        options: shuffleArray(['높다 (자주 베팅)', '중간', '낮다 (체크 위주)']),
        answer,
        explanation: `${texture.tags.join(', ')} 보드 (C벳 선호도 ${texture.favorsCbet}%). ${
          texture.favorsCbet >= 60 ? '드라이/하이카드 보드라 레이저에게 유리.' :
          texture.favorsCbet >= 40 ? '중립적인 보드. 핸드에 따라 판단.' :
          '웻/로우 보드라 체크가 안전.'
        }`,
        quizType: 'board_texture',
        boardCards: board,
      });
    } else {
      // Range advantage
      let answer: string;
      let reason: string;
      if (texture.hasHighCards && !texture.isConnected) {
        answer = '프리플랍 레이저';
        reason = '하이카드 보드는 레이저의 강한 레인지(AK, AQ)에 유리.';
      } else if (texture.isConnected || (texture.isWet && !texture.hasHighCards)) {
        answer = '콜러';
        reason = '커넥티드/로우 보드는 콜러의 수티드 커넥터에 유리.';
      } else if (texture.isPaired) {
        answer = '프리플랍 레이저';
        reason = '페어드 보드는 레이저가 블러프하기 유리.';
      } else {
        answer = '비슷하다';
        reason = '특별히 한쪽에 유리하지 않은 중립적 보드.';
      }

      scenarios.push({
        show: boardStr,
        question: '이 보드는 누구에게 유리?',
        options: shuffleArray(['프리플랍 레이저', '콜러', '비슷하다']),
        answer,
        explanation: `${boardStr}: ${reason}`,
        quizType: 'board_texture',
        boardCards: board,
      });
    }
  }

  return scenarios;
}

// --- Hand Strength Scenarios (Unit 13) ---
export function generateHandStrengthScenarios(count: number): (Scenario & { quizType?: string; boardCards?: Card[]; handCards?: Card[] })[] {
  const scenarios: (Scenario & { quizType?: string; boardCards?: Card[]; handCards?: Card[] })[] = [];
  const answerCounts: Record<string, number> = {};
  const maxPerAnswer = Math.ceil(count / 3);
  let attempts = 0;

  while (scenarios.length < count && attempts < count * 60) {
    attempts++;
    const board = generateFlop([]);
    const hand = randomHand(board);
    const texture = analyzeBoardTexture(board);
    const strength = evaluateHandStrength(hand, board, texture);

    // Determine display answer
    let answerLabel = strength.name;
    if (strength.hasDraws && (strength.category === 'air' || strength.value <= 20)) {
      if (strength.draws.includes('플러시 드로우') && strength.draws.includes('스트레이트 드로우')) answerLabel = '콤보 드로우';
      else if (strength.draws.includes('플러시 드로우')) answerLabel = '플러시 드로우';
      else if (strength.draws.includes('스트레이트 드로우')) answerLabel = '스트레이트 드로우';
    }

    // Ensure variety
    if ((answerCounts[answerLabel] || 0) >= maxPerAnswer) continue;
    // Skip pure air without draws (boring)
    if (strength.category === 'air' && !strength.hasDraws && scenarios.length < count - 1) continue;

    const boardStr = fmtBoard(board);
    const handStr = hand.map(fmtCard).join('');

    const allOptions = ['오버페어', '탑페어 탑키커', '탑페어 약키커', '미들/바텀 페어', '언더페어', '플러시 드로우', '스트레이트 드로우', '콤보 드로우', '에어'];
    const wrongOptions = allOptions.filter(a => a !== answerLabel);
    const options = [answerLabel, ...shuffleArray(wrongOptions).slice(0, 3)];

    scenarios.push({
      show: `${handStr}, 보드 ${boardStr}`,
      question: '이 핸드의 강도는?',
      options: shuffleArray(options),
      answer: answerLabel,
      explanation: `${handStr} on ${boardStr}: ${answerLabel}. ${strength.reason}${strength.hasDraws ? ` (${strength.draws.join(' + ')})` : ''}`,
      quizType: 'hand_strength',
      boardCards: board,
      handCards: hand,
    });
    answerCounts[answerLabel] = (answerCounts[answerLabel] || 0) + 1;
  }

  return shuffleArray(scenarios);
}

// --- C-bet Scenarios (Unit 16) ---
function handToNotation(hand: Card[]): string {
  const ri1 = RANKS.indexOf(hand[0].rank as typeof RANKS[number]);
  const ri2 = RANKS.indexOf(hand[1].rank as typeof RANKS[number]);
  const [high, low] = ri1 <= ri2 ? [hand[0], hand[1]] : [hand[1], hand[0]];
  if (high.rank === low.rank) return `${high.rank}${low.rank}`;
  return `${high.rank}${low.rank}${high.suit === low.suit ? 's' : 'o'}`;
}

const OPEN_CALL_PAIRS = [
  { hero: 'BTN', villain: 'BB' },
  { hero: 'CO', villain: 'BB' },
  { hero: 'CO', villain: 'BTN' },
  { hero: 'HJ', villain: 'BB' },
  { hero: 'HJ', villain: 'BTN' },
  { hero: 'LJ', villain: 'BB' },
];

export function generateCbetScenarios(count: number): (Scenario & { quizType?: string; position?: string; vsPosition?: string; hand?: string; boardCards?: Card[]; handCards?: Card[] })[] {
  const scenarios: (Scenario & { quizType?: string; position?: string; vsPosition?: string; hand?: string; boardCards?: Card[]; handCards?: Card[] })[] = [];
  let cbetCount = 0;
  let checkCount = 0;
  const maxImbalance = Math.ceil(count * 0.7);

  for (let i = 0; i < count; i++) {
    let board: Card[], hand: Card[], texture: ReturnType<typeof analyzeBoardTexture>, strength: ReturnType<typeof evaluateHandStrength>;
    let attempts = 0;

    // Ensure reasonable balance of C-bet vs Check answers
    do {
      board = generateFlop([]);
      hand = randomHand(board);
      texture = analyzeBoardTexture(board);
      strength = evaluateHandStrength(hand, board, texture);
      attempts++;
    } while (
      attempts < 30 &&
      ((strength.shouldCbet && cbetCount >= maxImbalance) || (!strength.shouldCbet && checkCount >= maxImbalance))
    );

    if (strength.shouldCbet) cbetCount++;
    else checkCount++;

    const { hero, villain } = OPEN_CALL_PAIRS[Math.floor(Math.random() * OPEN_CALL_PAIRS.length)];
    const notation = handToNotation(hand);
    const answer = strength.shouldCbet ? 'C벳' : '체크';

    scenarios.push({
      question: `${hero}에서 오픈, ${villain} 콜.\n플랍이 나왔어요. 어떻게 할까요?`,
      options: shuffleArray(['C벳', '체크']),
      answer,
      explanation: generateCbetExplanation(notation, hero, strength, texture),
      quizType: 'cbet_dynamic',
      position: hero,
      vsPosition: villain,
      hand: notation,
      boardCards: board,
      handCards: hand,
    });
  }

  return scenarios;
}

// --- Turn Scenarios (Unit 17) ---
function randomCard(exclude: Card[]): Card {
  return randomHand(exclude)[0];
}

function shouldBetTurn(strength: ReturnType<typeof evaluateHandStrength>, turnCard: Card): boolean {
  const turnRank = RANKS.indexOf(turnCard.rank as typeof RANKS[number]);
  if (strength.value >= 60) return true;
  if (strength.hasDraws && strength.value >= 25) return true;
  if (strength.category === 'air' && turnRank <= 1) return true; // Bluff on A/K
  return false;
}

export function generateTurnScenarios(count: number): (Scenario & { quizType?: string; position?: string; vsPosition?: string; hand?: string; boardCards?: Card[]; handCards?: Card[] })[] {
  const scenarios: (Scenario & { quizType?: string; position?: string; vsPosition?: string; hand?: string; boardCards?: Card[]; handCards?: Card[] })[] = [];

  for (let i = 0; i < count; i++) {
    const { hero, villain } = OPEN_CALL_PAIRS[Math.floor(Math.random() * OPEN_CALL_PAIRS.length)];
    const flop = generateFlop([]);
    const hand = randomHand(flop);
    const turn = randomCard([...flop, ...hand]);
    const board4 = [...flop, turn];
    const flopTexture = analyzeBoardTexture(flop);
    const strength = evaluateHandStrength(hand, board4, flopTexture);
    const notation = handToNotation(hand);
    const bet = shouldBetTurn(strength, turn);
    const answer = bet ? '베팅' : '체크';
    const handDesc = describeHand(notation);

    let explanation: string;
    if (bet && strength.value >= 60) {
      explanation = `🧠 생각 과정\n① 내 핸드: ${notation} → ${strength.name}\n${handDesc ? '   ' + handDesc + '\n' : ''}② 턴 ${fmtCard(turn)}\n③ 판단: 강한 핸드 → 밸류 더블배럴!\n\n💡 체크하면? 팟을 키울 기회를 놓쳐요.`;
    } else if (bet && strength.hasDraws) {
      explanation = `🧠 생각 과정\n① 내 핸드: ${notation} → ${strength.name} (${strength.draws.join(', ')})\n② 턴 ${fmtCard(turn)}\n③ 판단: 드로우로 세미블러프 더블배럴!\n\n💡 체크하면? 폴드 유도 기회를 놓치고, 무료로 리버를 줘요.`;
    } else if (bet) {
      explanation = `🧠 생각 과정\n① 내 핸드: ${notation} → 에어\n② 턴 ${fmtCard(turn)} → 하이카드! 레이저에게 유리\n③ 판단: 블러프 더블배럴!\n\n💡 체크하면? 하이카드 턴은 상대를 폴드시키기 좋은 기회예요.`;
    } else {
      explanation = `🧠 생각 과정\n① 내 핸드: ${notation} → ${strength.name}\n② 턴 ${fmtCard(turn)}\n③ 판단: ${strength.category === 'middlepair' || strength.category === 'underpair' ? '약한 메이드 핸드. 팟 컨트롤!' : '턴에서 무리한 블러프는 비용이 커요.'}\n\n💡 베팅하면? 턴은 빅 벳 라운드. 불필요한 돈을 태울 수 있어요.`;
    }

    scenarios.push({
      question: `${hero} 오픈 → ${villain} 콜 → 플랍 C벳 → 콜.\n턴이 나왔어요. 어떻게?`,
      options: shuffleArray(['베팅', '체크']),
      answer,
      explanation,
      quizType: 'turn_dynamic',
      position: hero, vsPosition: villain, hand: notation,
      boardCards: board4, handCards: hand,
    });
  }

  return scenarios;
}

// --- River Scenarios (Unit 18) ---
export function generateRiverScenarios(count: number): (Scenario & { quizType?: string; position?: string; vsPosition?: string; hand?: string; boardCards?: Card[]; handCards?: Card[] })[] {
  const scenarios: (Scenario & { quizType?: string; position?: string; vsPosition?: string; hand?: string; boardCards?: Card[]; handCards?: Card[] })[] = [];

  for (let i = 0; i < count; i++) {
    const { hero, villain } = OPEN_CALL_PAIRS[Math.floor(Math.random() * OPEN_CALL_PAIRS.length)];
    const flop = generateFlop([]);
    const hand = randomHand(flop);
    const extra = randomHand([...flop, ...hand]);
    const board5 = [...flop, ...extra];
    const flopTexture = analyzeBoardTexture(flop);
    const strength = evaluateHandStrength(hand, board5, flopTexture);
    const notation = handToNotation(hand);
    const handDesc = describeHand(notation);
    const shouldBet = strength.value >= 55;
    const answer = shouldBet ? '베팅' : '체크';

    let explanation: string;
    if (shouldBet) {
      explanation = `🧠 생각 과정\n① 내 핸드: ${notation} → ${strength.name}\n${handDesc ? '   ' + handDesc + '\n' : ''}② 보드: ${fmtBoard(board5)}\n③ 판단: 리버에서 밸류 있음 → 베팅!\n\n💡 체크하면? 약한 핸드의 콜을 놓쳐요.`;
    } else if (strength.hasDraws) {
      explanation = `🧠 생각 과정\n① 내 핸드: ${notation} → 미스드 드로우\n② 보드: ${fmtBoard(board5)}\n③ 판단: 드로우 미스. 체크.\n\n💡 베팅하면? 블러프도 가능하지만 리스크가 커요. 초보는 체크가 안전.`;
    } else {
      explanation = `🧠 생각 과정\n① 내 핸드: ${notation} → ${strength.name}\n② 보드: ${fmtBoard(board5)}\n③ 판단: ${strength.value >= 30 ? '어중간한 핸드. 체크로 쇼다운.' : '약한 핸드. 체크.'}\n\n💡 베팅하면? ${strength.value >= 30 ? '밸류도 블러프도 아닌 어중간한 베팅이 돼요.' : '리버에서 불필요한 돈을 잃을 수 있어요.'}`;
    }

    scenarios.push({
      question: `리버까지 왔어요.\n${hero}에서 오픈한 팟. 어떻게?`,
      options: shuffleArray(['베팅', '체크']),
      answer,
      explanation,
      quizType: 'river_dynamic',
      position: hero, vsPosition: villain, hand: notation,
      boardCards: board5, handCards: hand,
    });
  }

  return scenarios;
}

// --- Sizing Scenarios (Unit 20) ---
const SIZE_FRACTIONS: Record<string, number> = { '1/3 팟': 0.33, '1/2 팟': 0.5, '2/3 팟': 0.67, '3/4 팟': 0.75 };

export function generateSizingScenarios(count: number): (Scenario & { quizType?: string; position?: string; vsPosition?: string; hand?: string; boardCards?: Card[]; handCards?: Card[] })[] {
  const scenarios: (Scenario & { quizType?: string; position?: string; vsPosition?: string; hand?: string; boardCards?: Card[]; handCards?: Card[] })[] = [];
  const potSizes = [80, 100, 120, 150, 200];

  for (let i = 0; i < count; i++) {
    const { hero, villain } = OPEN_CALL_PAIRS[Math.floor(Math.random() * OPEN_CALL_PAIRS.length)];
    const flop = generateFlop([]);
    const hand = randomHand(flop);
    const flopTexture = analyzeBoardTexture(flop);
    const strength = evaluateHandStrength(hand, flop, flopTexture);
    const pot = potSizes[Math.floor(Math.random() * potSizes.length)];
    const notation = handToNotation(hand);

    let answer: string;
    let reason: string;
    if (flopTexture.isDry && !flopTexture.isPaired) {
      answer = '1/3 팟';
      reason = 'Dry 보드는 작은 사이즈로 충분. 상대가 안 맞았을 확률이 높아서 작게 베팅해도 폴드 유도 가능.';
    } else if (flopTexture.isWet || flopTexture.isMonotone) {
      answer = '2/3 팟';
      reason = 'Wet 보드는 드로우가 많아서 크게 베팅. 드로우에게 나쁜 팟 오즈를 줘야 해요.';
    } else if (strength.value >= 80) {
      answer = '3/4 팟';
      reason = '매우 강한 핸드! 크게 벳해서 밸류를 최대한 뽑으세요.';
    } else {
      answer = '1/2 팟';
      reason = '표준적인 상황. 1/2 팟이 밸런스 좋은 사이즈.';
    }

    const betAmount = Math.round(pot * SIZE_FRACTIONS[answer]);
    scenarios.push({
      question: `팟 ${pot}. ${hero} 오픈 → ${villain} 콜.\n플랍 베팅 사이즈는?`,
      options: shuffleArray(['1/3 팟', '1/2 팟', '2/3 팟', '3/4 팟']),
      answer,
      explanation: `🧠 생각 과정\n① 보드: ${flopTexture.tags.join(', ')}\n② 내 핸드: ${notation} → ${strength.name}\n③ 팟 ${pot} → ${answer} = ${betAmount}\n\n${reason}`,
      quizType: 'sizing_dynamic',
      position: hero, vsPosition: villain, hand: notation,
      boardCards: flop, handCards: hand,
    });
  }

  return scenarios;
}

// --- Pot Odds Scenarios (Unit 14) ---
export function generatePotOddsScenarios(count: number): (Scenario & { quizType?: string })[] {
  const scenarios: (Scenario & { quizType?: string })[] = [];
  const potSizes = [60, 80, 100, 120, 150, 200, 300];
  const drawTypes = [
    { name: '플러시 드로우 (9아웃)', pctRiver: 35 },
    { name: 'OESD (8아웃)', pctRiver: 32 },
    { name: '거트샷 (4아웃)', pctRiver: 17 },
    { name: '콤보 드로우 (15아웃)', pctRiver: 54 },
    { name: '투 오버카드 (6아웃)', pctRiver: 24 },
  ];

  for (let i = 0; i < count; i++) {
    const pot = potSizes[Math.floor(Math.random() * potSizes.length)];

    if (i % 2 === 0) {
      // Pot odds calculation
      const betMultipliers = [0.33, 0.5, 0.67, 0.75, 1.0, 1.5, 2.0];
      const mult = betMultipliers[Math.floor(Math.random() * betMultipliers.length)];
      const bet = Math.round(pot * mult);
      const totalPot = pot + bet + bet;
      const potOdds = Math.round((bet / totalPot) * 100);

      const correct = `${potOdds}%`;
      const wrongs: string[] = [];
      for (const d of [-8, 8, -15, 15, -5, 12]) {
        const w = potOdds + d;
        if (w > 0 && w < 100 && `${w}%` !== correct && !wrongs.includes(`${w}%`)) wrongs.push(`${w}%`);
      }

      scenarios.push({
        question: `팟 ${pot}, 상대 베팅 ${bet}. 팟 오즈는?`,
        options: shuffleArray([correct, ...wrongs.slice(0, 3)]),
        answer: correct,
        explanation: `${bet} / (${pot} + ${bet} + ${bet}) = ${bet}/${totalPot} = ${potOdds}%. 콜하려면 ${potOdds}% 이상 이길 확률이 필요.`,
        quizType: 'pot_odds',
      });
    } else {
      // Call/fold decision
      const draw = drawTypes[Math.floor(Math.random() * drawTypes.length)];
      const bet = Math.round(pot * (0.3 + Math.random() * 1.2));
      const totalPot = pot + bet + bet;
      const potOdds = Math.round((bet / totalPot) * 100);
      const shouldCall = draw.pctRiver >= potOdds;

      scenarios.push({
        question: `팟 ${pot}, 상대 베팅 ${bet} (팟 오즈 ${potOdds}%).\n${draw.name}. 콜? 폴드?`,
        options: shuffleArray(['콜', '폴드']),
        answer: shouldCall ? '콜' : '폴드',
        explanation: `${draw.name}: 리버까지 ${draw.pctRiver}%. 팟 오즈 ${potOdds}%. ${
          shouldCall ? `${draw.pctRiver}% > ${potOdds}% → 콜이 수익적!` : `${draw.pctRiver}% < ${potOdds}% → 폴드가 맞다.`
        }`,
        quizType: 'pot_odds',
      });
    }
  }

  return scenarios;
}
