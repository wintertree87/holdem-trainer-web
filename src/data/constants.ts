export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const SUIT_NAMES: Record<string, string> = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
export const DAILY_GOAL = 50;
export const POSITION_ORDER = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export const POSITION_INFO: Record<string, string> = {
  'UTG': '가장 앞자리. 뒤에 8명 남아서 좋은 패만 플레이',
  'UTG+1': '앞자리. 뒤에 7명 남아서 타이트하게',
  'UTG+2': '앞자리. 뒤에 6명, 아직 신중하게',
  'LJ': '중간자리. 뒤에 5명, 조금 넓게 가능',
  'HJ': '중간자리. 뒤에 4명, 꽤 넓게 가능',
  'CO': '뒷자리. 뒤에 3명만, 넓게 공격 가능',
  'BTN': '최고의 자리! 뒤에 2명만, 절반 이상의 패로 공격',
  'SB': '강제 베팅 자리. 불리하지만 전략적 플레이 가능',
  'BB': '강제 베팅 자리. 이미 돈을 넣어서 싸게 참여 가능'
};

export type Card = { rank: string; suit: string };
export type HandNotation = string;

export const RANK_VALUE: Record<string, number> = {
  'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};
