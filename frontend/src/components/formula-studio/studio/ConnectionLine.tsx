import React from 'react';
import type { CanvasNodeData, CanvasConnection } from './canvas-types';
import { RELATION_COLORS } from './canvas-types';
import { calculateBezierPath, calculateBezierMidpoint } from './canvasUtils';

interface ConnectionLineProps {
  connection: CanvasConnection;
  sourceNode: CanvasNodeData;
  targetNode: CanvasNodeData;
  isSelected: boolean;
  onSelect: (connectionId: string) => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
}) => {
  const path = calculateBezierPath(sourceNode, targetNode);
  const midpoint = calculateBezierMidpoint(sourceNode, targetNode);
  const strokeColorClass = RELATION_COLORS[connection.relationType] || 'stroke-slate-400';

  const isDashed = connection.relationType === 'contrast-with' || connection.relationType === 'compares';
  const isDotted = connection.relationType === 'related' || connection.relationType === 'same-concept';

  const dashArray = isDashed ? '8,4' : isDotted ? '3,3' : 'none';

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onSelect(connection.id);
      }}
      style={{ cursor: 'pointer' }}
    >
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="hover:stroke-slate-600/20"
      />
      <path
        d={path}
        fill="none"
        stroke={isSelected ? '#ffffff' : undefined}
        strokeWidth={isSelected ? 3 : 2}
        strokeDasharray={dashArray}
        className={strokeColorClass}
        markerEnd="url(#arrowhead)"
      />
      {connection.label && (
        <g transform={`translate(${midpoint.x}, ${midpoint.y})`}>
          <rect
            x={-40}
            y={-10}
            width={80}
            height={20}
            fill="#1e293b"
            fillOpacity={0.9}
            rx={4}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-300 text-[10px] font-medium"
          >
            {connection.label}
          </text>
        </g>
      )}
    </g>
  );
};
