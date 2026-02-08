export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const SUIT_NAMES: Record<string, string> = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
export const DAILY_GOAL = 50;
export const POSITION_ORDER = ['UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'] as const;
export const POSITION_INFO: Record<string, string> = {
  'UTG': 'Under The Gun - EP, 가장 타이트하게',
  'UTG+1': 'UTG+1 - EP, 타이트하게',
  'UTG+2': 'UTG+2 - EP/MP',
  'LJ': 'Lojack - MP',
  'HJ': 'Hijack - MP/LP',
  'CO': 'Cutoff - LP, 버튼 앞',
  'BTN': 'Button - 최고의 포지션',
  'SB': 'Small Blind - OOP',
  'BB': 'Big Blind - OOP'
};

export type Card = { rank: string; suit: string };
export type HandNotation = string;
