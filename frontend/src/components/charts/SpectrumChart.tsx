interface SpectrumChartProps {
  data: { bin: number; magnitude: number }[];
  title?: string;
}

export function SpectrumChart({ data, title = 'FFT Spectrum' }: SpectrumChartProps) {
  if (!data || data.length === 0) return null;

  const width = 400;
  const height = 150;
  const padding = 30;

  const maxMag = Math.max(...data.map((d) => d.magnitude)) || 1;
  const barWidth = (width - 2 * padding) / Math.min(data.length, 16);

  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="border border-gray-200 rounded bg-white"
      >
        {/* Grid */}
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

        {/* Bars */}
        {data.slice(0, 16).map((d, i) => {
          const barHeight = (d.magnitude / maxMag) * (height - 2 * padding);
          return (
            <g key={d.bin}>
              <rect
                x={padding + i * barWidth}
                y={height - padding - barHeight}
                width={barWidth - 2}
                height={barHeight}
                fill="#2563EB"
                opacity={0.8}
              />
              <text
                x={padding + i * barWidth + barWidth / 2}
                y={height - padding + 12}
                fontSize="8"
                fill="#6b7280"
                textAnchor="middle"
              >
                {d.bin}
              </text>
            </g>
          );
        })}

        {/* Y axis label */}
        <text x={padding - 5} y={padding} fontSize="10" fill="#6b7280" textAnchor="end">
          {maxMag.toFixed(1)}
        </text>
        <text x={padding - 5} y={height - padding} fontSize="10" fill="#6b7280" textAnchor="end">0</text>
      </svg>
    </div>
  );
}
