import { RANKS, SUITS, SUIT_NAMES, type Card } from '@/data/constants';

export function getHandNotation(card1: Card, card2: Card): string {
  const idx1 = RANKS.indexOf(card1.rank as typeof RANKS[number]);
  const idx2 = RANKS.indexOf(card2.rank as typeof RANKS[number]);
  const suited = card1.suit === card2.suit;
  if (card1.rank === card2.rank) return card1.rank + card2.rank;
  if (idx1 < idx2) return card1.rank + card2.rank + (suited ? 's' : 'o');
  return card2.rank + card1.rank + (suited ? 's' : 'o');
}

export function getHandDescription(notation: string): string {
  const names: Record<string, string> = {'A':'Ace','K':'King','Q':'Queen','J':'Jack','T':'Ten','9':'Nine','8':'Eight','7':'Seven','6':'Six','5':'Five','4':'Four','3':'Three','2':'Two'};
  if (notation.length === 2) return `Pocket ${names[notation[0]]}s`;
  return `${names[notation[0]]}-${names[notation[1]]} ${notation[2] === 's' ? 'Suited' : 'Offsuit'}`;
}

export function generateHand(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return [deck[0], deck[1]];
}

export function generateHandFromNotation(notation: string): Card[] {
  if (notation.length === 2) {
    return [{ rank: notation[0], suit: '♠' }, { rank: notation[0], suit: '♥' }];
  } else if (notation[2] === 's') {
    return [{ rank: notation[0], suit: '♠' }, { rank: notation[1], suit: '♠' }];
  } else {
    return [{ rank: notation[0], suit: '♠' }, { rank: notation[1], suit: '♥' }];
  }
}
