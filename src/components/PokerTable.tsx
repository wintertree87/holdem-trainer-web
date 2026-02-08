'use client';

const SEAT_POSITIONS: { pos: string; x: number; y: number }[] = [
  { pos: 'BTN', x: 85, y: 62 },
  { pos: 'SB',  x: 72, y: 18 },
  { pos: 'BB',  x: 50, y: 8 },
  { pos: 'UTG', x: 28, y: 18 },
  { pos: 'UTG+1', x: 15, y: 38 },
  { pos: 'UTG+2', x: 15, y: 62 },
  { pos: 'LJ',  x: 28, y: 82 },
  { pos: 'HJ',  x: 50, y: 92 },
  { pos: 'CO',  x: 72, y: 82 },
];

type Props = {
  heroPosition: string;
  villainPosition?: string | null;
  className?: string;
};

export default function PokerTable({ heroPosition, villainPosition, className = '' }: Props) {
  return (
    <div className={`relative w-full max-w-[280px] mx-auto ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full">
        {/* Table */}
        <ellipse cx="50" cy="50" rx="38" ry="30" fill="#1a5c2e" stroke="#2d8a4e" strokeWidth="2" />
        <ellipse cx="50" cy="50" rx="35" ry="27" fill="none" stroke="#2d8a4e" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />

        {/* Dealer chip */}
        {SEAT_POSITIONS.filter(s => s.pos === 'BTN').map(s => (
          <g key="dealer">
            <circle cx={s.x - 8} cy={s.y - 3} r="3" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />
            <text x={s.x - 8} y={s.y - 1.5} textAnchor="middle" fill="#78350f" fontSize="3" fontWeight="bold">D</text>
          </g>
        ))}

        {/* Seats */}
        {SEAT_POSITIONS.map(({ pos, x, y }) => {
          const isHero = pos === heroPosition;
          const isVillain = pos === villainPosition;
          const isActive = isHero || isVillain;

          return (
            <g key={pos}>
              {/* Seat circle */}
              <circle
                cx={x} cy={y} r={isActive ? 7 : 5.5}
                fill={isHero ? '#4f46e5' : isVillain ? '#dc2626' : '#1f2937'}
                stroke={isHero ? '#818cf8' : isVillain ? '#f87171' : '#374151'}
                strokeWidth={isActive ? 1.2 : 0.7}
                opacity={isActive ? 1 : 0.5}
              />
              {/* Glow for active */}
              {isActive && (
                <circle cx={x} cy={y} r={9} fill="none"
                  stroke={isHero ? '#818cf8' : '#f87171'}
                  strokeWidth="0.4" opacity="0.3"
                />
              )}
              {/* Label */}
              <text
                x={x} y={y + (pos.length > 3 ? 0.8 : 1)}
                textAnchor="middle"
                fill={isActive ? '#fff' : '#9ca3af'}
                fontSize={isActive ? (pos.length > 3 ? '3.2' : '3.8') : (pos.length > 3 ? '2.8' : '3.2')}
                fontWeight={isActive ? 'bold' : 'normal'}
              >
                {pos}
              </text>
              {/* Hero/Villain label */}
              {isHero && (
                <text x={x} y={y + 12} textAnchor="middle" fill="#818cf8" fontSize="2.8" fontWeight="bold">YOU</text>
              )}
              {isVillain && (
                <text x={x} y={y + 12} textAnchor="middle" fill="#f87171" fontSize="2.8" fontWeight="bold">VS</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
