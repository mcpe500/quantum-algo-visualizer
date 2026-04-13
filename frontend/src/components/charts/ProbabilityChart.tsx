interface ProbabilityChartProps {
  data: { state: string; probability: number }[];
  title?: string;
}

export function ProbabilityChart({
  data,
  title = 'QFT Measurement Probabilities',
}: ProbabilityChartProps) {
  if (!data || data.length === 0) return null;

  const width = 300;
  const height = 120;
  const padding = 30;

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border border-gray-200 rounded bg-white"
      >
        {data.map((d, i) => {
          const barWidth = 30;
          const barHeight = d.probability * (height - 2 * padding);
          const x = padding + i * (barWidth + 10);
          const y = height - padding - barHeight;

          return (
            <g key={d.state}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="#7c3aed" opacity={0.8} />
              <text
                x={x + barWidth / 2}
                y={height - padding + 12}
                fontSize="10"
                fill="#6b7280"
                textAnchor="middle"
              >
                |{d.state}⟩
              </text>
              <text x={x + barWidth / 2} y={y - 5} fontSize="9" fill="#7c3aed" textAnchor="middle">
                {(d.probability * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
