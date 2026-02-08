import { RANKS, SUITS, type Card } from '@/data/constants';

export type BoardTexture = {
  tags: string[];
  isDry: boolean;
  isWet: boolean;
  isPaired: boolean;
  isMonotone: boolean;
  isTwoTone: boolean;
  isRainbow: boolean;
  hasHighCards: boolean;
  isConnected: boolean;
  favorsCbet: number;
};

export type HandStrength = {
  category: string;
  name: string;
  value: number;
  hasDraws: boolean;
  draws: string[];
  shouldCbet: boolean;
  reason: string;
};

export function generateFlop(excludeCards: Card[]): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      const isExcluded = excludeCards.some(c => c.rank === rank && c.suit === suit);
      if (!isExcluded) deck.push({ rank, suit });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return [deck[0], deck[1], deck[2]];
}

export function analyzeBoardTexture(board: Card[]): BoardTexture {
  const ranks = board.map(c => RANKS.indexOf(c.rank as typeof RANKS[number]));
  const suits = board.map(c => c.suit);
  const sortedRanks = [...ranks].sort((a, b) => a - b);

  const texture: BoardTexture = {
    tags: [], isDry: false, isWet: false, isPaired: false,
    isMonotone: false, isTwoTone: false, isRainbow: false,
    hasHighCards: false, isConnected: false, favorsCbet: 50,
  };

  if (ranks[0] === ranks[1] || ranks[1] === ranks[2] || ranks[0] === ranks[2]) {
    texture.isPaired = true; texture.tags.push('페어드'); texture.favorsCbet += 10;
  }

  const uniqueSuits = [...new Set(suits)];
  if (uniqueSuits.length === 1) {
    texture.isMonotone = true; texture.tags.push('모노톤'); texture.favorsCbet -= 15;
  } else if (uniqueSuits.length === 2) {
    texture.isTwoTone = true; texture.tags.push('투톤'); texture.favorsCbet -= 5;
  } else {
    texture.isRainbow = true; texture.tags.push('레인보우'); texture.favorsCbet += 5;
  }

  const highCardCount = ranks.filter(r => r <= 2).length;
  if (highCardCount >= 2) {
    texture.hasHighCards = true; texture.tags.push('하이'); texture.favorsCbet += 10;
  } else if (sortedRanks[0] >= 6) {
    texture.tags.push('로우'); texture.favorsCbet -= 10;
  }

  const totalGap = sortedRanks[2] - sortedRanks[0];
  if (totalGap <= 4 && !texture.isPaired) {
    texture.isConnected = true; texture.tags.push('커넥티드'); texture.favorsCbet -= 10;
  } else if (totalGap >= 8) {
    texture.tags.push('디스커넥티드'); texture.favorsCbet += 5;
  }

  texture.isDry = texture.favorsCbet >= 55;
  texture.isWet = texture.favorsCbet <= 45;
  if (texture.isDry) texture.tags.unshift('드라이');
  else if (texture.isWet) texture.tags.unshift('웻');
  texture.favorsCbet = Math.max(0, Math.min(100, texture.favorsCbet));

  return texture;
}

export function evaluateHandStrength(hand: Card[], board: Card[], boardTexture?: BoardTexture): HandStrength {
  const handRanks = hand.map(c => RANKS.indexOf(c.rank as typeof RANKS[number]));
  const boardRanks = board.map(c => RANKS.indexOf(c.rank as typeof RANKS[number]));
  const handSuits = hand.map(c => c.suit);
  const boardSuits = board.map(c => c.suit);

  const strength: HandStrength = {
    category: 'air', name: '에어', value: 0,
    hasDraws: false, draws: [], shouldCbet: false, reason: '',
  };

  const pairs: { rank: number; isTopPair: boolean }[] = [];
  for (const hr of handRanks) {
    for (const br of boardRanks) {
      if (hr === br) pairs.push({ rank: hr, isTopPair: br === Math.min(...boardRanks) });
    }
  }

  if (handRanks[0] === handRanks[1] && handRanks[0] < Math.min(...boardRanks)) {
    strength.category = 'overpair'; strength.name = '오버페어'; strength.value = 85;
    strength.shouldCbet = true; strength.reason = '오버페어는 밸류로 C-bet';
  } else if (pairs.length > 0 && pairs.some(p => p.isTopPair)) {
    const topPair = pairs.find(p => p.isTopPair)!;
    const kicker = Math.min(...handRanks.filter(r => r !== topPair.rank));
    if (kicker <= 2) { strength.category = 'tptk'; strength.name = '탑페어 탑키커'; strength.value = 80; }
    else if (kicker <= 4) { strength.category = 'tpgk'; strength.name = '탑페어 굿키커'; strength.value = 70; }
    else { strength.category = 'tpwk'; strength.name = '탑페어 약키커'; strength.value = 60; }
    strength.shouldCbet = true; strength.reason = '탑페어는 밸류로 C-bet';
  } else if (pairs.length > 0) {
    strength.category = 'middlepair'; strength.name = '미들/바텀 페어'; strength.value = 40;
    strength.shouldCbet = false; strength.reason = '약한 메이드는 체크로 팟 컨트롤';
  } else if (handRanks[0] === handRanks[1]) {
    strength.category = 'underpair'; strength.name = '언더페어'; strength.value = 35;
    strength.shouldCbet = false; strength.reason = '언더페어는 쇼다운 밸류로 체크';
  }

  for (const hs of handSuits) {
    const suitCount = boardSuits.filter(bs => bs === hs).length;
    if (suitCount >= 2 && !(handSuits[0] === handSuits[1] && handSuits[0] === hs)) {
      strength.hasDraws = true; strength.draws.push('플러시 드로우');
    }
  }

  const allRanks = [...new Set([...handRanks, ...boardRanks])].sort((a, b) => a - b);
  for (let i = 0; i <= 8; i++) {
    const w = [i, i + 1, i + 2, i + 3, i + 4];
    if (w.filter(r => allRanks.includes(r)).length === 4 && !strength.draws.includes('스트레이트 드로우')) {
      strength.hasDraws = true; strength.draws.push('스트레이트 드로우');
    }
  }

  if (strength.category === 'air') {
    const overcards = handRanks.filter(hr => hr < Math.min(...boardRanks));
    if (overcards.length === 2) {
      strength.name = '투 오버카드'; strength.value = 25;
      if (overcards.some(o => o <= 2)) { strength.shouldCbet = true; strength.reason = '오버카드 + 블로커로 블러프 C-bet'; }
    } else if (overcards.length === 1) { strength.name = '원 오버카드'; strength.value = 15; }
    if (strength.hasDraws) { strength.shouldCbet = true; strength.reason = '드로우로 세미블러프 C-bet'; strength.value += 20; }
    if (boardTexture?.isTwoTone) {
      for (const hs of handSuits) {
        if (boardSuits.filter(bs => bs === hs).length === 2) { strength.draws.push('백도어 FD'); strength.value += 5; }
      }
    }
  }

  if (strength.value === 0 && !strength.hasDraws) {
    strength.shouldCbet = (boardTexture?.favorsCbet ?? 50) >= 60;
    strength.reason = strength.shouldCbet ? '드라이 보드에서 에어로 블러프 C-bet' : '웻 보드에서 에어는 체크';
  }

  return strength;
}
