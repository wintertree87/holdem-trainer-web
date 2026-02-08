import { RFI_RANGES } from '@/data/ranges';
import { RANKS } from '@/data/constants';
import { getCorrectAction_RFI } from './correct-action';

export function generateRfiScenarios(positions: string[], count: number) {
  const allHands: string[] = [];
  for (let i = 0; i < RANKS.length; i++) {
    for (let j = i; j < RANKS.length; j++) {
      if (i === j) allHands.push(RANKS[i] + RANKS[j]);
      else { allHands.push(RANKS[i] + RANKS[j] + 's'); allHands.push(RANKS[i] + RANKS[j] + 'o'); }
    }
  }

  const scenarios = [];
  for (let n = 0; n < count; n++) {
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const range = RFI_RANGES[pos];
    const raiseHands = range?.raise || [...(range?.raiseValue || []), ...(range?.raiseBluff || [])];
    const borderHands = raiseHands.slice(-Math.ceil(raiseHands.length * 0.3));

    let hand: string;
    if (Math.random() < 0.4 && borderHands.length > 0) hand = borderHands[Math.floor(Math.random() * borderHands.length)];
    else if (Math.random() < 0.5) hand = raiseHands[Math.floor(Math.random() * raiseHands.length)];
    else hand = allHands[Math.floor(Math.random() * allHands.length)];

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

function generateRfiExplanation(hand: string, position: string, correctAction: string): string {
  const range = RFI_RANGES[position];
  const pct = range?.percent || '';
  if (correctAction === 'raise') return `${hand}은(는) ${position}의 RFI 레인지(${pct})에 포함됩니다. 레이즈!`;
  if (correctAction === 'limp') return `${hand}은(는) SB에서 림프하는 핸드입니다. 밸류가 부족하지만 버리기엔 아까워요.`;
  return `${hand}은(는) ${position}에서 오픈하기엔 너무 약합니다. 폴드가 맞아요.`;
}
