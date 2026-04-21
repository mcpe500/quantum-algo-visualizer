interface MiniGraphProps {
  nodes: number[];
  edges: [number, number][];
}

const MINI_SIZE = 120;
const MINI_RADIUS = 45;
const MINI_NODE_RADIUS = 14;

export function MiniGraph({ nodes, edges }: MiniGraphProps) {
  const cx = MINI_SIZE / 2;
  const cy = MINI_SIZE / 2;
  const r = MINI_RADIUS;

  const pos = nodes.map((_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
  }));

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox={`0 0 ${MINI_SIZE} ${MINI_SIZE}`}
        className="w-28 h-28"
      >
        {/* Edges */}
        {edges.map(([i, j], idx) => (
          <line
            key={idx}
            x1={pos[i].x}
            y1={pos[i].y}
            x2={pos[j].x}
            y2={pos[j].y}
            stroke="#94a3b8"
            strokeWidth={1.5}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle
              cx={pos[i].x}
              cy={pos[i].y}
              r={MINI_NODE_RADIUS}
              fill="#3b82f6"
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={pos[i].x}
              y={pos[i].y}
              textAnchor="middle"
              fill="white"
              fontSize={11}
              fontWeight="bold"
              fontFamily="Inter, system-ui, sans-serif"
              dy="0.35em"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {node}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default MiniGraph;
