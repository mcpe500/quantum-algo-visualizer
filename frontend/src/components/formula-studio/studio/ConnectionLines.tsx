import React from 'react';
import type { CanvasConnection, CanvasNodeData } from './canvas-types';
import type { NodeResult } from './graphEngine';
import { ConnectionLine } from './ConnectionLine';

interface ConnectionLinesProps {
  connections: CanvasConnection[];
  nodes: CanvasNodeData[];
  selectedConnectionId: string | null;
  activeConnectionIds?: Set<string>;
  nodeResults?: Map<string, NodeResult>;
  onSelectConnection: (connectionId: string) => void;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  connections,
  nodes,
  selectedConnectionId,
  activeConnectionIds,
  nodeResults,
  onSelectConnection,
}) => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" className="fill-slate-400" />
        </marker>
      </defs>
      {connections.map((conn) => {
        const sourceNode = nodeMap.get(conn.fromId);
        const targetNode = nodeMap.get(conn.toId);
        if (!sourceNode || !targetNode) return null;

        return (
          <g key={conn.id} className="pointer-events-auto">
            <ConnectionLine
              connection={conn}
              sourceNode={sourceNode}
              targetNode={targetNode}
              isSelected={selectedConnectionId === conn.id}
              isFlowActive={activeConnectionIds?.has(conn.id)}
              sourceResult={nodeResults?.get(conn.fromId)}
              onSelect={onSelectConnection}
            />
          </g>
        );
      })}
    </svg>
  );
};
