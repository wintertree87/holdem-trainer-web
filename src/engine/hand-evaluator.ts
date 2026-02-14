import { RANK_VALUE, type Card } from '@/data/constants';

// Hand categories (higher = stronger)
export const HAND_CATEGORY = {
  HIGH_CARD: 0,
  ONE_PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
} as const;

export const HAND_NAMES: Record<number, string> = {
  0: '하이카드',
  1: '원페어',
  2: '투페어',
  3: '트리플',
  4: '스트레이트',
  5: '플러시',
  6: '풀하우스',
  7: '포카드',
  8: '스트레이트 플러시',
  9: '로얄 플러시',
};

export type HandRank = {
  category: number;
  tiebreakers: number[]; // descending importance
  name: string;
};

function cardValue(card: Card): number {
  return RANK_VALUE[card.rank] ?? 0;
}

// Evaluate exactly 5 cards
export function evaluate5(cards: Card[]): HandRank {
  const values = cards.map(cardValue).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);

  // Check straight (including A-low: A2345)
  let isStraight = false;
  let straightHigh = 0;

  // Normal straight check
  if (values[0] - values[4] === 4 && new Set(values).size === 5) {
    isStraight = true;
    straightHigh = values[0];
  }
  // A-low straight (A2345): values sorted desc would be [14,5,4,3,2]
  if (!isStraight && values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    isStraight = true;
    straightHigh = 5; // 5-high straight
  }

  // Count ranks
  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([v, c]) => ({ value: Number(v), count: c }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  // Straight flush / Royal flush
  if (isFlush && isStraight) {
    const cat = straightHigh === 14 ? HAND_CATEGORY.ROYAL_FLUSH : HAND_CATEGORY.STRAIGHT_FLUSH;
    return { category: cat, tiebreakers: [straightHigh], name: HAND_NAMES[cat] };
  }

  // Four of a kind
  if (groups[0].count === 4) {
    return {
      category: HAND_CATEGORY.FOUR_OF_A_KIND,
      tiebreakers: [groups[0].value, groups[1].value],
      name: HAND_NAMES[HAND_CATEGORY.FOUR_OF_A_KIND],
    };
  }

  // Full house
  if (groups[0].count === 3 && groups[1].count === 2) {
    return {
      category: HAND_CATEGORY.FULL_HOUSE,
      tiebreakers: [groups[0].value, groups[1].value],
      name: HAND_NAMES[HAND_CATEGORY.FULL_HOUSE],
    };
  }

  // Flush
  if (isFlush) {
    return { category: HAND_CATEGORY.FLUSH, tiebreakers: values, name: HAND_NAMES[HAND_CATEGORY.FLUSH] };
  }

  // Straight
  if (isStraight) {
    return { category: HAND_CATEGORY.STRAIGHT, tiebreakers: [straightHigh], name: HAND_NAMES[HAND_CATEGORY.STRAIGHT] };
  }

  // Three of a kind
  if (groups[0].count === 3) {
    const kickers = groups.filter(g => g.count === 1).map(g => g.value).sort((a, b) => b - a);
    return {
      category: HAND_CATEGORY.THREE_OF_A_KIND,
      tiebreakers: [groups[0].value, ...kickers],
      name: HAND_NAMES[HAND_CATEGORY.THREE_OF_A_KIND],
    };
  }

  // Two pair
  if (groups[0].count === 2 && groups[1].count === 2) {
    const pairs = [groups[0].value, groups[1].value].sort((a, b) => b - a);
    const kicker = groups[2].value;
    return {
      category: HAND_CATEGORY.TWO_PAIR,
      tiebreakers: [...pairs, kicker],
      name: HAND_NAMES[HAND_CATEGORY.TWO_PAIR],
    };
  }

  // One pair
  if (groups[0].count === 2) {
    const kickers = groups.filter(g => g.count === 1).map(g => g.value).sort((a, b) => b - a);
    return {
      category: HAND_CATEGORY.ONE_PAIR,
      tiebreakers: [groups[0].value, ...kickers],
      name: HAND_NAMES[HAND_CATEGORY.ONE_PAIR],
    };
  }

  // High card
  return { category: HAND_CATEGORY.HIGH_CARD, tiebreakers: values, name: HAND_NAMES[HAND_CATEGORY.HIGH_CARD] };
}

// Generate all C(n,5) combinations
function combinations5(cards: Card[]): Card[][] {
  const result: Card[][] = [];
  const n = cards.length;
  for (let i = 0; i < n - 4; i++)
    for (let j = i + 1; j < n - 3; j++)
      for (let k = j + 1; k < n - 2; k++)
        for (let l = k + 1; l < n - 1; l++)
          for (let m = l + 1; m < n; m++)
            result.push([cards[i], cards[j], cards[k], cards[l], cards[m]]);
  return result;
}

// Evaluate best hand from 5~7 cards
export function evaluateBestHand(cards: Card[]): HandRank {
  if (cards.length === 5) return evaluate5(cards);

  const combos = combinations5(cards);
  let best = evaluate5(combos[0]);
  for (let i = 1; i < combos.length; i++) {
    const current = evaluate5(combos[i]);
    if (compareHandRanks(current, best) > 0) {
      best = current;
    }
  }
  return best;
}

// Compare two HandRanks: >0 if a wins, <0 if b wins, 0 if tie
export function compareHandRanks(a: HandRank, b: HandRank): number {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.min(a.tiebreakers.length, b.tiebreakers.length); i++) {
    if (a.tiebreakers[i] !== b.tiebreakers[i]) return a.tiebreakers[i] - b.tiebreakers[i];
  }
  return 0;
}

// Compare two players' hands (each 2 hole cards + community cards)
export function compareHands(
  heroHand: Card[],
  botHand: Card[],
  community: Card[]
): 'hero' | 'bot' | 'tie' {
  const heroRank = evaluateBestHand([...heroHand, ...community]);
  const botRank = evaluateBestHand([...botHand, ...community]);
  const result = compareHandRanks(heroRank, botRank);
  if (result > 0) return 'hero';
  if (result < 0) return 'bot';
  return 'tie';
}
