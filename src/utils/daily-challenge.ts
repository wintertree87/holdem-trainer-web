import { RFI_RANGES, FACING_RFI_RANGES, VS_3BET_RANGES } from '@/data/ranges';
import { RANKS } from '@/data/constants';
import { getCorrectAction_RFI, getCorrectAction_Facing, getCorrectAction_Vs3bet } from './correct-action';

// Seeded random number generator (Mulberry32)
function seededRandom(seed: number) {
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function dateToSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const ALL_HANDS: string[] = [];
for (let i = 0; i < RANKS.length; i++) {
  for (let j = i; j < RANKS.length; j++) {
    if (i === j) ALL_HANDS.push(RANKS[i] + RANKS[j]);
    else { ALL_HANDS.push(RANKS[i] + RANKS[j] + 's'); ALL_HANDS.push(RANKS[i] + RANKS[j] + 'o'); }
  }
}

const RFI_POSITIONS = ['UTG', 'UTG+1', 'LJ', 'HJ', 'CO', 'BTN', 'SB'];
const FACING_KEYS = Object.keys(FACING_RFI_RANGES);
const VS3BET_POSITIONS = ['UTG', 'LJ', 'HJ', 'CO', 'BTN', 'SB'];

export type DailyChallengeData = {
  quizType: string;
  position: string;
  vsPosition?: string;
  hand: string;
  correctAnswer: string;
  options: string[];
  explanation: string;
};

export function generateDailyChallenge(dateStr: string): DailyChallengeData {
  const seed = dateToSeed(dateStr);
  const rand1 = seededRandom(seed);
  const rand2 = seededRandom(seed + 1);
  const rand3 = seededRandom(seed + 2);

  // Pick quiz type: 50% RFI, 30% Facing, 20% vs3bet
  const typeRoll = rand1;

  if (typeRoll < 0.5) {
    // RFI
    const pos = RFI_POSITIONS[Math.floor(rand2 * RFI_POSITIONS.length)];
    const range = RFI_RANGES[pos];
    const raiseHands = range?.raise || [...(range?.raiseValue || []), ...(range?.raiseBluff || [])];
    // Pick a borderline hand (more interesting)
    const borderHands = raiseHands.slice(-Math.ceil(raiseHands.length * 0.4));
    const allCandidates = [...borderHands, ...ALL_HANDS.slice(0, 30)];
    const hand = allCandidates[Math.floor(rand3 * allCandidates.length)];

    const correctAction = getCorrectAction_RFI(hand, pos);
    const actionLabel = correctAction === 'raise' ? '레이즈' : correctAction === 'limp' ? '림프' : '폴드';
    const options = pos === 'SB' ? ['레이즈', '림프', '폴드'] : ['레이즈', '폴드'];

    return {
      quizType: 'rfi_dynamic',
      position: pos,
      hand,
      correctAnswer: actionLabel,
      options,
      explanation: `${hand} — ${pos}에서 ${actionLabel === '레이즈' ? '공격할 수 있는 패예요!' : actionLabel === '림프' ? '살짝 참여하는 게 좋아요.' : '이 자리에서는 접는 게 맞아요.'}`,
    };
  } else if (typeRoll < 0.8) {
    // Facing RFI
    const key = FACING_KEYS[Math.floor(rand2 * FACING_KEYS.length)];
    const parts = key.split('_vs_');
    const myPos = parts[0];
    const vsPos = parts[1];
    const range = FACING_RFI_RANGES[key];
    const actionHands = [...(range.value || []), ...(range.bluff || []), ...(range.call || [])];
    const borderHands = actionHands.slice(-Math.ceil(actionHands.length * 0.4));
    const allCandidates = [...borderHands, ...ALL_HANDS.slice(0, 30)];
    const hand = allCandidates[Math.floor(rand3 * allCandidates.length)];

    const correctAction = getCorrectAction_Facing(hand, myPos, vsPos);
    const actionLabel = correctAction === '3bet' ? '3bet' : correctAction === 'call' ? '콜' : '폴드';

    return {
      quizType: 'facing_dynamic',
      position: myPos,
      vsPosition: vsPos,
      hand,
      correctAnswer: actionLabel,
      options: ['3bet', '콜', '폴드'],
      explanation: `${vsPos}가 오픈한 상황에서 ${myPos}의 ${hand} — ${actionLabel === '3bet' ? '다시 올려서 압박!' : actionLabel === '콜' ? '따라가면서 기회를 노려요.' : '여기서는 접는 게 현명해요.'}`,
    };
  } else {
    // vs 3bet
    const pos = VS3BET_POSITIONS[Math.floor(rand2 * VS3BET_POSITIONS.length)];
    const key = pos === 'SB' ? 'SB_vs_BB_3bet' : `${pos}_vs_3bet`;
    const range = VS_3BET_RANGES[key];
    if (!range) {
      // Fallback to RFI
      return generateDailyChallenge(dateStr + '_fallback');
    }
    const actionHands = [...(range.fourBetValue || []), ...(range.fourBetBluff || []), ...(range.call || [])];
    const borderHands = actionHands.slice(-Math.ceil(actionHands.length * 0.4));
    const allCandidates = [...borderHands, ...ALL_HANDS.slice(0, 30)];
    const hand = allCandidates[Math.floor(rand3 * allCandidates.length)];

    const correctAction = getCorrectAction_Vs3bet(hand, pos);
    const actionLabel = correctAction === '4bet' ? '4bet' : correctAction === 'call' ? '콜' : '폴드';
    const vsPos = pos === 'SB' ? 'BB' : 'IP';

    return {
      quizType: 'vs3bet_dynamic',
      position: pos,
      vsPosition: vsPos,
      hand,
      correctAnswer: actionLabel,
      options: ['4bet', '콜', '폴드'],
      explanation: `${pos}에서 오픈 후 3bet 받은 ${hand} — ${actionLabel === '4bet' ? '한 번 더 올려서 밀어붙여요!' : actionLabel === '콜' ? '따라가면서 다음 카드를 봐요.' : '3bet 앞에서는 접어야 해요.'}`,
    };
  }
}
