import { radiansToDegrees, normalizeAngle } from '../../../shared/utils/animation-helpers';

interface PhaseWheelProps {
  accumulatedPhase: number;
  currentRotation?: number;
  size?: number;
  isActive?: boolean;
}

export function PhaseWheel({
  accumulatedPhase,
  currentRotation = 1,
  size = 60,
  isActive = false,
}: PhaseWheelProps) {
  const normalizedPhase = normalizeAngle(accumulatedPhase);
  const displayAngle = normalizedPhase * currentRotation;
  const needleAngle = displayAngle - 90;
  const needleX = Math.cos((needleAngle * Math.PI) / 180) * (size * 0.35);
  const needleY = Math.sin((needleAngle * Math.PI) / 180) * (size * 0.35);

  const segments = 8;
  const segmentAngle = 360 / segments;
  const arcGap = 2;
  const innerRadius = (size / 2) * 0.55;
  const outerRadius = (size / 2) * 0.75;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`${isActive ? 'drop-shadow-md' : 'opacity-70'}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(size / 2) * 0.9}
          fill={isActive ? '#f0fdf4' : '#f8fafc'}
          stroke={isActive ? '#10b981' : '#cbd5e1'}
          strokeWidth={isActive ? 2 : 1}
        />

        {Array.from({ length: segments }).map((_, i) => {
          const startAngle = i * segmentAngle - 90 + arcGap / 2;
          const endAngle = (i + 1) * segmentAngle - 90 - arcGap / 2;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const x1Inner = (size / 2) + innerRadius * Math.cos(startRad);
          const y1Inner = (size / 2) + innerRadius * Math.sin(startRad);
          const x2Inner = (size / 2) + innerRadius * Math.cos(endRad);
          const y2Inner = (size / 2) + innerRadius * Math.sin(endRad);
          const x1Outer = (size / 2) + outerRadius * Math.cos(startRad);
          const y1Outer = (size / 2) + outerRadius * Math.sin(startRad);
          const x2Outer = (size / 2) + outerRadius * Math.cos(endRad);
          const y2Outer = (size / 2) + outerRadius * Math.sin(endRad);

          const largeArc = endAngle - startAngle > 180 ? 1 : 0;

          const d = [
            `M ${x1Inner} ${y1Inner}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${x2Inner} ${y2Inner}`,
            `L ${x2Outer} ${y2Outer}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${x1Outer} ${y1Outer}`,
            'Z',
          ].join(' ');

          const hue = (i / segments) * 360;
          const fill = `hsl(${hue}, 70%, 60%)`;

          return <path key={i} d={d} fill={fill} opacity={0.3} />;
        })}

        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius - 2}
          fill="white"
          stroke="#e2e8f0"
          strokeWidth={1}
        />

        <line
          x1={size / 2}
          y1={size / 2}
          x2={size / 2 + needleX}
          y2={size / 2 + needleY}
          stroke={isActive ? '#10b981' : '#64748b'}
          strokeWidth={2}
          strokeLinecap="round"
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={3}
          fill={isActive ? '#10b981' : '#64748b'}
        />

        <text
          x={size / 2}
          y={size / 2 + innerRadius + 6}
          textAnchor="middle"
          fontSize={7}
          fill="#64748b"
          fontFamily="monospace"
        >
          {radiansToDegrees(normalizedPhase).toFixed(0)}°
        </text>
      </svg>
    </div>
  );
}

interface PhaseWheelStackProps {
  qubitPhases: number[];
  activeQubit?: number | null;
  size?: number;
}

export function PhaseWheelStack({
  qubitPhases,
  activeQubit = null,
  size = 50,
}: PhaseWheelStackProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {qubitPhases.map((phase, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-mono text-slate-500">q{i}</span>
          <PhaseWheel
            accumulatedPhase={phase}
            isActive={activeQubit === i}
            size={size}
          />
        </div>
      ))}
    </div>
  );
}