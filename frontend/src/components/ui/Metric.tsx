interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

export function Metric({ label, value, unit, color = 'text-white' }: MetricProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500 mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono ${color}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}
