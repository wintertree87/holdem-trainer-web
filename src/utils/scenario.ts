import { RFI_RANGES, FACING_RFI_RANGES, VS_3BET_RANGES } from '@/data/ranges';
import { RANKS } from '@/data/constants';
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

function generateRfiExplanation(hand: string, position: string, correctAction: string): string {
  const range = RFI_RANGES[position];
  const pct = range?.percent || '';
  if (correctAction === 'raise') return `${hand}은(는) ${position}의 RFI 레인지(${pct})에 포함됩니다. 레이즈!`;
  if (correctAction === 'limp') return `${hand}은(는) SB에서 림프하는 핸드입니다. 밸류가 부족하지만 버리기엔 아까워요.`;
  return `${hand}은(는) ${position}에서 오픈하기엔 너무 약합니다. 폴드가 맞아요.`;
}

function generateFacingExplanation(hand: string, myPos: string, vsPos: string, correctAction: string, range: any): string {
  const pct = range?.percent || '';
  if (correctAction === '3bet') {
    if (range.value?.includes(hand)) return `${hand}은(는) ${myPos}에서 ${vsPos} 오픈에 밸류 3bet 합니다. 강한 핸드로 팟을 키워요! (${pct})`;
    return `${hand}은(는) ${myPos}에서 ${vsPos} 오픈에 블러프 3bet 합니다. 폴드 에퀴티를 노려요. (${pct})`;
  }
  if (correctAction === 'call') return `${hand}은(는) ${myPos}에서 ${vsPos} 오픈에 콜합니다. 3bet하기엔 약하지만 폴드하기엔 강해요. (${pct})`;
  return `${hand}은(는) ${myPos}에서 ${vsPos} 오픈에 폴드합니다. 이 상황에서 참여하기엔 약해요.`;
}

function generateVs3betExplanation(hand: string, pos: string, correctAction: string, range: any): string {
  const pct = range?.percent || '';
  if (correctAction === '4bet') {
    if (range.fourBetValue?.includes(hand)) return `${hand}은(는) ${pos}에서 3bet을 받으면 밸류 4bet! 매우 강한 핸드입니다. (${pct})`;
    return `${hand}은(는) ${pos}에서 블러프 4bet 합니다. 에이스 블로커로 폴드를 유도해요. (${pct})`;
  }
  if (correctAction === 'call') return `${hand}은(는) ${pos}에서 3bet에 콜합니다. 4bet하기엔 약하지만 충분히 플레이 가능. (${pct})`;
  return `${hand}은(는) ${pos}에서 3bet을 받으면 폴드합니다. 오픈은 했지만 3bet에 버틸 만큼 강하지 않아요.`;
}
