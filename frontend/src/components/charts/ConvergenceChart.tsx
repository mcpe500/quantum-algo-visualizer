interface ConvergenceChartProps {
  data: number[];
  optimalValue: number;
  title: string;
  yLabel?: string;
  optimalLabel?: string;
  dataLabel?: string;
}

export function ConvergenceChart({
  data,
  optimalValue,
  title,
  yLabel,
  optimalLabel = 'Optimal',
  dataLabel = 'Value',
}: ConvergenceChartProps) {
  if (!data || data.length === 0) return null;

  const vw = 500;
  const vh = 200;
  const pad = { left: 54, right: 20, top: 18, bottom: 36 };
  const cw = vw - pad.left - pad.right;
  const ch = vh - pad.top - pad.bottom;

  const minV = Math.min(0, Math.min(...data) - 0.2);
  const maxV = Math.max(optimalValue + 0.5, Math.max(...data) + 0.3);
  const span = maxV - minV || 1;

  const tx = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * cw;
  const ty = (v: number) => pad.top + ch - ((v - minV) / span) * ch;

  const d = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${tx(i).toFixed(1)},${ty(v).toFixed(1)}`)
    .join(' ');

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((t) => minV + t * span);

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="bg-gray-50 rounded-lg overflow-auto">
        <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full" style={{ minWidth: 280 }}>
          {/* Grid */}
          {gridVals.map((val, i) => (
            <g key={i}>
              <line
                x1={pad.left}
                y1={ty(val)}
                x2={vw - pad.right}
                y2={ty(val)}
                stroke="#e5e7eb"
                strokeWidth={0.6}
              />
              <text x={pad.left - 5} y={ty(val) + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {val.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Optimal line */}
          <line
            x1={pad.left}
            y1={ty(optimalValue)}
            x2={vw - pad.right}
            y2={ty(optimalValue)}
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="5,3"
          />

          {/* Convergence path */}
          <path d={d} fill="none" stroke="#7c3aed" strokeWidth={2} />

          {/* Axes */}
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ch} stroke="#d1d5db" />
          <line
            x1={pad.left}
            y1={pad.top + ch}
            x2={vw - pad.right}
            y2={pad.top + ch}
            stroke="#d1d5db"
          />

          {/* X label */}
          <text x={vw / 2} y={vh - 6} textAnchor="middle" fontSize={11} fill="#6b7280">
            Iteration
          </text>

          {/* Y label */}
          {yLabel && (
            <text
              x={12}
              y={pad.top + ch / 2}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
              transform={`rotate(-90, 12, ${pad.top + ch / 2})`}
            >
              {yLabel}
            </text>
          )}

          {/* Legend */}
          <g>
            <line
              x1={vw - pad.right - 100}
              y1={pad.top + 10}
              x2={vw - pad.right - 80}
              y2={pad.top + 10}
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="5,3"
            />
            <text x={vw - pad.right - 76} y={pad.top + 14} fontSize={9} fill="#10b981">
              {optimalLabel}
            </text>
            <line
              x1={vw - pad.right - 100}
              y1={pad.top + 22}
              x2={vw - pad.right - 80}
              y2={pad.top + 22}
              stroke="#7c3aed"
              strokeWidth={2}
            />
            <text x={vw - pad.right - 76} y={pad.top + 26} fontSize={9} fill="#7c3aed">
              {dataLabel}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
