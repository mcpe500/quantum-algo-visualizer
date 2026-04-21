import { formatPercent } from '../utils/animation-helpers';

interface ProbabilityBarItem {
  key: string;
  label: string;
  probability: number;
}

interface ProbabilityBarListProps {
  items: ProbabilityBarItem[];
  barColor?: string;
}

export function ProbabilityBarList({
  items,
  barColor = 'bg-indigo-500',
}: ProbabilityBarListProps) {
  return (
    <div className="space-y-2">
      {items.map((entry) => (
        <div key={entry.key}>
          <div className="flex items-center justify-between text-[11px] text-slate-700">
            <span className="font-mono font-semibold tracking-wider">{entry.label}</span>
            <span className="text-slate-500">{formatPercent(entry.probability)}</span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${barColor}`}
              style={{ width: `${Math.max(entry.probability * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
