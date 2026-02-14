export type GameTier = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockUnitId: number;  // skill tree unit ID that must be completed
  botLevel: string;
  xpBase: number;       // XP for completing a match
  xpWin: number;        // bonus XP for winning
};

export const GAME_TIERS: GameTier[] = [
  {
    id: 'rookie',
    name: '루키 매치',
    emoji: '⚔️',
    description: '기본 프리플랍을 배운 후 첫 실전',
    unlockUnitId: 3,
    botLevel: '입문',
    xpBase: 15,
    xpWin: 10,
  },
  {
    id: 'regular',
    name: '레귤러 매치',
    emoji: '🗡️',
    description: '3bet/4bet까지 아는 중급자 대전',
    unlockUnitId: 7,
    botLevel: '중급',
    xpBase: 20,
    xpWin: 15,
  },
  {
    id: 'shark',
    name: '샤크 매치',
    emoji: '🦈',
    description: '포스트플랍까지 마스터한 상급자 대전',
    unlockUnitId: 10,
    botLevel: '고급',
    xpBase: 25,
    xpWin: 20,
  },
];

export const HANDS_PER_MATCH = 10;
export const STARTING_STACK = 100; // bb
