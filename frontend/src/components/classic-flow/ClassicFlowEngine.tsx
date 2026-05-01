import type { ReactNode } from 'react';

type ClassicFlowTone = 'slate' | 'blue' | 'purple' | 'emerald';
type ClassicFlowDirection = 'right' | 'down';
type ClassicFlowSize = 'sm' | 'md' | 'lg';

const TONE_CLASS: Record<ClassicFlowTone, { stroke: string; border: string; bg: string }> = {
  slate: { stroke: '#94A3B8', border: 'border-slate-200', bg: 'bg-white' },
  blue: { stroke: '#3B82F6', border: 'border-blue-300', bg: 'bg-white' },
  purple: { stroke: '#8B5CF6', border: 'border-purple-300', bg: 'bg-white' },
  emerald: { stroke: '#10B981', border: 'border-emerald-300', bg: 'bg-white' },
};

const RIGHT_SIZE: Record<ClassicFlowSize, { width: number; height: number; end: number; headStart: number }> = {
  sm: { width: 32, height: 14, end: 30, headStart: 26 },
  md: { width: 40, height: 16, end: 38, headStart: 34 },
  lg: { width: 60, height: 24, end: 56, headStart: 50 },
};

interface ClassicFlowArrowProps {
  direction?: ClassicFlowDirection;
  tone?: ClassicFlowTone;
  size?: ClassicFlowSize;
  boxed?: boolean;
  className?: string;
}

export function ClassicFlowArrow({
  direction = 'right',
  tone = 'slate',
  size = 'md',
  boxed = false,
  className = '',
}: ClassicFlowArrowProps) {
  const toneClass = TONE_CLASS[tone];

  if (direction === 'down') {
    return (
      <div className={`relative z-0 flex justify-center ${className}`} aria-hidden="true">
        <div className="h-8 w-[2px] rounded-full" style={{ backgroundColor: toneClass.stroke }} />
        <div
          className="absolute bottom-0 h-0 w-0 translate-y-[3px] border-x-[5px] border-t-[8px] border-x-transparent"
          style={{ borderTopColor: toneClass.stroke }}
        />
      </div>
    );
  }

  const dims = RIGHT_SIZE[size];
  const arrow = (
    <svg width={dims.width} height={dims.height} viewBox={`0 0 ${dims.width} ${dims.height}`} fill="none" aria-hidden="true">
      <path
        d={`M0 ${dims.height / 2} H${dims.end}`}
        stroke={toneClass.stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d={`M${dims.headStart} 4 L${dims.width} ${dims.height / 2} L${dims.headStart} ${dims.height - 4}`}
        stroke={toneClass.stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (!boxed) {
    return <div className={`flex shrink-0 items-center justify-center ${className}`}>{arrow}</div>;
  }

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full border-2 p-2 shadow-lg ${toneClass.border} ${toneClass.bg} ${className}`}>
      {arrow}
    </div>
  );
}

interface ClassicFlowRailProps {
  children: ReactNode;
  className?: string;
}

export function ClassicFlowRail({ children, className = '' }: ClassicFlowRailProps) {
  return <div className={`hidden shrink-0 items-center gap-6 lg:flex ${className}`}>{children}</div>;
}

interface ClassicFlowMobileArrowProps {
  className?: string;
}

export function ClassicFlowMobileArrow({ className = '' }: ClassicFlowMobileArrowProps) {
  return <ClassicFlowArrow direction="down" className={`lg:hidden ${className}`} />;
}

interface ClassicFlowSequenceProps {
  items: ReactNode[];
  tone?: ClassicFlowTone;
  size?: ClassicFlowSize;
  boxed?: boolean;
  className?: string;
}

export function ClassicFlowSequence({
  items,
  tone = 'slate',
  size = 'md',
  boxed = false,
  className = '',
}: ClassicFlowSequenceProps) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-6">
          {index > 0 && <ClassicFlowArrow tone={tone} size={size} boxed={boxed} />}
          {item}
        </div>
      ))}
    </div>
  );
}
