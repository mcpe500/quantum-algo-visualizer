import React from 'react';
import type { CanvasNodeData, CanvasConnection } from './canvas-types';
import type { NodeResult } from './graphEngine';
import { RELATION_COLORS } from './canvas-types';
import { calculateBezierPath, calculateBezierMidpoint } from './canvasUtils';

interface ConnectionLineProps {
  connection: CanvasConnection;
  sourceNode: CanvasNodeData;
  targetNode: CanvasNodeData;
  isSelected: boolean;
  isFlowActive?: boolean;
  sourceResult?: NodeResult;
  onSelect: (connectionId: string) => void;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  sourceNode,
  targetNode,
  isSelected,
  isFlowActive = false,
  sourceResult,
  onSelect,
}) => {
  const path = calculateBezierPath(sourceNode, targetNode);
  const midpoint = calculateBezierMidpoint(sourceNode, targetNode);
  const strokeColorClass = RELATION_COLORS[connection.relationType] || 'stroke-slate-400';

  const isDashed = connection.relationType === 'contrast-with' || connection.relationType === 'compares';
  const isDotted = connection.relationType === 'related' || connection.relationType === 'same-concept';

  const dashArray = isDashed ? '8,4' : isDotted ? '3,3' : 'none';
  const flowValue = sourceResult?.valueDisplay && ['feeds-into', 'result', 'outputs-to'].includes(connection.relationType)
    ? `${connection.label} = ${sourceResult.valueDisplay}`
    : connection.label;
  const labelWidth = Math.max(80, Math.min(160, flowValue.length * 7 + 18));

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
        stroke={isSelected ? '#ffffff' : isFlowActive ? '#22d3ee' : undefined}
        strokeWidth={isSelected || isFlowActive ? 3 : 2}
        strokeDasharray={dashArray}
        className={isFlowActive ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : strokeColorClass}
        markerEnd="url(#arrowhead)"
      />
      {isFlowActive && (
        <circle r="4" fill="#67e8f9" opacity="0.95">
          <animateMotion dur="1.6s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      {flowValue && (
        <g transform={`translate(${midpoint.x}, ${midpoint.y})`}>
          <rect
            x={-labelWidth / 2}
            y={-10}
            width={labelWidth}
            height={20}
            fill="#1e293b"
            fillOpacity={0.9}
            rx={4}
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            className={`${isFlowActive ? 'fill-cyan-100' : 'fill-slate-300'} text-[10px] font-medium`}
          >
            {flowValue}
          </text>
        </g>
      )}
    </g>
  );
};
