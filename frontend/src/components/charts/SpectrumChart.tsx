const CHART_SIZE = {
  width: 400,
  height: 150,
} as const;

const CHART_PADDING = 30;

interface SpectrumChartProps {
  data: { bin: number; magnitude: number }[];
  title?: string;
  highlightBins?: number[]; // Bins to highlight (dominant bins)
}

export function SpectrumChart({ data, title = 'FFT Spectrum', highlightBins = [] }: SpectrumChartProps) {
  if (!data || data.length === 0) return null;

  const width = CHART_SIZE.width;
  const height = CHART_SIZE.height;
  const padding = CHART_PADDING;

  const maxMag = Math.max(...data.map((d) => d.magnitude)) || 1;
  const barWidth = (width - 2 * padding) / data.length;
  const labelStep = Math.max(1, Math.ceil(data.length / 12));

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
        {data.map((d, i) => {
          const barHeight = (d.magnitude / maxMag) * (height - 2 * padding);
          const isHighlighted = highlightBins.includes(d.bin);
          return (
            <g key={d.bin}>
              <rect
                x={padding + i * barWidth}
                y={height - padding - barHeight}
                width={Math.max(1, barWidth - 1)}
                height={barHeight}
                fill={isHighlighted ? '#f59e0b' : '#2563EB'}
                opacity={isHighlighted ? 1 : 0.8}
              />
              {isHighlighted && (
                <text
                  x={padding + i * barWidth + barWidth / 2}
                  y={height - padding - barHeight - 5}
                  fontSize="8"
                  fill="#f59e0b"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {d.bin}
                </text>
              )}
              {i % labelStep === 0 && !isHighlighted && (
                <text
                  x={padding + i * barWidth + barWidth / 2}
                  y={height - padding + 12}
                  fontSize="8"
                  fill="#6b7280"
                  textAnchor="middle"
                >
                  {d.bin}
                </text>
              )}
            </g>
          );
        })}

        {/* Y axis label */}
        <text x={padding - 5} y={padding} fontSize="10" fill="#6b7280" textAnchor="end">
          {maxMag.toFixed(1)}
        </text>
        <text x={padding - 5} y={height - padding} fontSize="10" fill="#6b7280" textAnchor="end">0</text>
      </svg>
      
      {/* Legend */}
      {highlightBins.length > 0 && (
        <div className="flex items-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500 rounded-sm" />
            <span className="text-gray-600">Dominant Bin</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded-sm opacity-80" />
            <span className="text-gray-600">Other Bins</span>
          </div>
        </div>
      )}
    </div>
  );
}
