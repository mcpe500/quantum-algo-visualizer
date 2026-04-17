const CHART_SIZE = {
  width: 400,
  height: 150,
} as const;

const CHART_PADDING = 30;

interface SignalChartProps {
  data: number[];
  color?: string;
  title?: string;
}

export function SignalChart({ data, color = '#2563EB', title = 'Signal' }: SignalChartProps) {
  if (!data || data.length === 0) return null;

  const width = CHART_SIZE.width;
  const height = CHART_SIZE.height;
  const padding = CHART_PADDING;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  const zeroLine =
    maxVal > 0 && minVal < 0
      ? height - padding - ((0 - minVal) / range) * (height - 2 * padding)
      : null;

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border border-gray-200 rounded bg-white"
      >
        {/* Grid lines */}
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {/* Zero line if applicable */}
        {zeroLine !== null && (
          <line
            x1={padding}
            y1={zeroLine}
            x2={width - padding}
            y2={zeroLine}
            stroke="#9ca3af"
            strokeWidth="1"
            strokeDasharray="4"
          />
        )}

        {/* Signal line */}
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />

        {/* Labels */}
        <text x={padding - 5} y={padding} fontSize="10" fill="#6b7280" textAnchor="end">
          {maxVal.toFixed(1)}
        </text>
        <text x={padding - 5} y={height - padding} fontSize="10" fill="#6b7280" textAnchor="end">
          {minVal.toFixed(1)}
        </text>
        <text x={padding} y={height - 10} fontSize="10" fill="#6b7280">0</text>
        <text x={width - padding} y={height - 10} fontSize="10" fill="#6b7280" textAnchor="end">
          {data.length}
        </text>
      </svg>
    </div>
  );
}
