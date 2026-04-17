interface CutHistoryChartProps {
  data: number[];
  optimalCut: number;
  title: string;
}

const CHART_SIZE = {
  width: 460,
  height: 170,
} as const;

const CHART_PADDING = {
  left: 40,
  right: 20,
  top: 15,
  bottom: 32,
} as const;

export function CutHistoryChart({
  data,
  optimalCut,
  title,
}: CutHistoryChartProps) {
  if (!data || data.length === 0) return null;

  const vw = CHART_SIZE.width;
  const vh = CHART_SIZE.height;
  const pad = CHART_PADDING;
  const cw = vw - pad.left - pad.right;
  const ch = vh - pad.top - pad.bottom;

  const minV = 0;
  const maxV = Math.max(optimalCut + 0.5, Math.max(...data) + 0.5);

  const tx = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * cw;
  const ty = (v: number) => pad.top + ch - ((v - minV) / (maxV - minV)) * ch;

  const d = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${tx(i).toFixed(1)},${ty(v).toFixed(1)}`)
    .join(' ');

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="bg-gray-50 rounded-lg overflow-auto">
        <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full" style={{ minWidth: 260 }}>
          {/* Optimal line */}
          <line
            x1={pad.left}
            y1={ty(optimalCut)}
            x2={vw - pad.right}
            y2={ty(optimalCut)}
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="5,3"
          />
          <text x={vw - pad.right + 2} y={ty(optimalCut) + 4} fontSize={9} fill="#10b981">
            opt
          </text>

          {/* SA path */}
          <path d={d} fill="none" stroke="#3b82f6" strokeWidth={1.5} />

          {/* Axes */}
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ch} stroke="#d1d5db" />
          <line
            x1={pad.left}
            y1={pad.top + ch}
            x2={vw - pad.right}
            y2={pad.top + ch}
            stroke="#d1d5db"
          />

          {/* Y ticks */}
          {[0, optimalCut].map((v) => (
            <text key={v} x={pad.left - 4} y={ty(v) + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
              {v}
            </text>
          ))}

          {/* X label */}
          <text x={vw / 2} y={vh - 5} textAnchor="middle" fontSize={10} fill="#6b7280">
            Iteration
          </text>
        </svg>
      </div>
    </div>
  );
}
