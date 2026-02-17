/**
 * 챕터 실전 연습 설정
 * 유닛 학습 완료 후 해당 포지션에서 3핸드 봇 대전
 */

export type PracticeGameConfig = {
  unitId: number;
  heroPositions: string[];   // 히어로가 앉을 수 있는 포지션
  scenarioType: 'rfi' | 'facing' | 'vs3bet' | 'mixed';
  handsCount: number;
  description: string;
};

export const PRACTICE_GAME_CONFIGS: PracticeGameConfig[] = [
  {
    unitId: 4,
    heroPositions: ['UTG', 'LJ'],
    scenarioType: 'rfi',
    handsCount: 3,
    description: 'EP 오픈 레인지를 실전에서 연습',
  },
  {
    unitId: 5,
    heroPositions: ['HJ', 'CO', 'BTN'],
    scenarioType: 'rfi',
    handsCount: 3,
    description: 'LP 오픈 레인지를 실전에서 연습',
  },
  {
    unitId: 6,
    heroPositions: ['SB', 'BB'],
    scenarioType: 'rfi',
    handsCount: 3,
    description: 'SB/BB 전략을 실전에서 연습',
  },
  {
    unitId: 8,
    heroPositions: ['CO', 'BTN'],
    scenarioType: 'facing',
    handsCount: 3,
    description: '3벳 기초를 실전에서 연습',
  },
  {
    unitId: 9,
    heroPositions: ['CO', 'BTN', 'BB'],
    scenarioType: 'facing',
    handsCount: 3,
    description: 'Facing RFI 심화를 실전에서 연습',
  },
  {
    unitId: 10,
    heroPositions: ['UTG', 'CO', 'BTN'],
    scenarioType: 'vs3bet',
    handsCount: 3,
    description: 'vs 3bet 대응을 실전에서 연습',
  },
  {
    unitId: 12,
    heroPositions: ['CO', 'BTN'],
    scenarioType: 'mixed',
    handsCount: 3,
    description: '보드 텍스처 읽기를 실전에서 연습',
  },
  {
    unitId: 16,
    heroPositions: ['CO', 'BTN'],
    scenarioType: 'mixed',
    handsCount: 3,
    description: 'C-bet 전략을 실전에서 연습',
  },
];

export function getPracticeGameConfig(unitId: number): PracticeGameConfig | null {
  return PRACTICE_GAME_CONFIGS.find(c => c.unitId === unitId) ?? null;
}
