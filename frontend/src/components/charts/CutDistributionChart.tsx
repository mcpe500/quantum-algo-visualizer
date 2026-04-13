interface CutDistributionItem {
  bitstring: string;
  probability: number;
  cut: number;
}

interface CutDistributionChartProps {
  data: CutDistributionItem[];
  title: string;
}

export function CutDistributionChart({
  data,
  title,
}: CutDistributionChartProps) {
  if (!data || data.length === 0) return null;
  const maxProb = Math.max(...data.map((d) => d.probability), 0.01);

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="space-y-1.5">
        {data.slice(0, 8).map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-gray-600 w-20 shrink-0">{item.bitstring}</span>
            <div className="flex-1 bg-gray-100 rounded-sm h-5 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-purple-400 rounded-sm"
                style={{ width: `${(item.probability / maxProb) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-end pr-1.5 font-mono text-gray-700">
                {(item.probability * 100).toFixed(1)}%
              </span>
            </div>
            <span className="text-gray-600 w-14 shrink-0 font-mono">cut: {item.cut}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
