import { RFI_RANGES, FACING_RFI_RANGES, VS_3BET_RANGES } from '@/data/ranges';

export function getCorrectAction_RFI(handNotation: string, position: string): string {
  const range = RFI_RANGES[position];
  if (!range) return 'fold';

  if (position === 'SB') {
    if (range.raiseValue?.includes(handNotation)) return 'raise';
    if (range.raiseBluff?.includes(handNotation)) return 'raise';
    if (range.limp?.includes(handNotation)) return 'limp';
    return 'fold';
  }
  return range.raise?.includes(handNotation) ? 'raise' : 'fold';
}

export function getCorrectAction_Facing(handNotation: string, myPos: string, vsPos: string): string {
  const key = `${myPos}_vs_${vsPos}`;
  const range = FACING_RFI_RANGES[key];
  if (!range) return 'fold';

  if (range.value?.includes(handNotation)) return '3bet';
  if (range.bluff?.includes(handNotation)) return '3bet';
  if (range.call?.includes(handNotation)) return 'call';
  return 'fold';
}

export function getCorrectAction_Vs3bet(handNotation: string, position: string): string {
  const key = position === 'SB' ? 'SB_vs_BB_3bet' : `${position}_vs_3bet`;
  const range = VS_3BET_RANGES[key];
  if (!range) return 'fold';

  if (range.fourBetValue?.includes(handNotation)) return '4bet';
  if (range.fourBetBluff?.includes(handNotation)) return '4bet';
  if (range.call?.includes(handNotation)) return 'call';
  return 'fold';
}
