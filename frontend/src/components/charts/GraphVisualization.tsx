const GRAPH_SIZE = 220;
const SMALL_GRAPH_RADIUS = 70;
const MEDIUM_GRAPH_RADIUS = 65;
const LARGE_GRAPH_RADIUS = 55;
const NODE_RADIUS = 18;

interface GraphVisualizationProps {
  nodes: number[];
  edges: [number, number][];
  partition?: number[];
  title?: string;
}

export function GraphVisualization({
  nodes,
  edges,
  partition,
  title,
}: GraphVisualizationProps) {
  const size = GRAPH_SIZE;
  const cx = size / 2;
  const cy = size / 2;
  const r = nodes.length <= 3 ? SMALL_GRAPH_RADIUS : nodes.length <= 4 ? MEDIUM_GRAPH_RADIUS : LARGE_GRAPH_RADIUS;
  const nodeR = NODE_RADIUS;

  const pos = nodes.map((_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
  }));

  const isCut = (i: number, j: number) =>
    partition ? partition[i] !== partition[j] : false;

  const nodeColor = (i: number) => {
    if (!partition) return '#3b82f6';
    return partition[i] === 0 ? '#3b82f6' : '#f59e0b';
  };

  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>}
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48">
          {/* Edges */}
          {edges.map(([i, j], idx) => (
            <line
              key={idx}
              x1={pos[i].x}
              y1={pos[i].y}
              x2={pos[j].x}
              y2={pos[j].y}
              stroke={isCut(i, j) ? '#ef4444' : '#94a3b8'}
              strokeWidth={isCut(i, j) ? 2.5 : 1.5}
              strokeDasharray={isCut(i, j) ? '6,3' : undefined}
            />
          ))}
          {/* Nodes */}
          {nodes.map((node, i) => (
            <g key={i}>
              <circle
                cx={pos[i].x}
                cy={pos[i].y}
                r={nodeR}
                fill={nodeColor(i)}
                stroke="white"
                strokeWidth={2}
              />
              <text
                x={pos[i].x}
                y={pos[i].y + 5}
                textAnchor="middle"
                fill="white"
                fontSize={13}
                fontWeight="bold"
              >
                {node}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {partition && (
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            Partition 0
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            Partition 1
          </span>
        </div>
      )}
    </div>
  );
}
