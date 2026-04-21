import { useMemo } from 'react';
import { deriveNodesFromMatrix } from '../../utils/qaoaGraph';

interface AdjacencyMatrixGridProps {
  adjacencyMatrix: number[][];
  cellSize?: number;
}

export function AdjacencyMatrixGrid({
  adjacencyMatrix,
  cellSize = 72,
}: AdjacencyMatrixGridProps) {
  const matrix = adjacencyMatrix;
  const nodes = useMemo(() => deriveNodesFromMatrix(matrix), [matrix]);
  const n = matrix.length;

  return (
    <div className="inline-block">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `auto repeat(${n}, ${cellSize}px)`,
          gridTemplateRows: `auto repeat(${n}, ${cellSize}px)`,
        }}
      >
        <div className="w-8 h-8" />

        {nodes.map((node) => (
          <div
            key={`col-${node}`}
            className="grid w-full h-8 place-items-center"
          >
            <span className="block translate-y-[-0.02em] text-center text-sm font-bold text-slate-500 leading-none tabular-nums">{node}</span>
          </div>
        ))}

        {nodes.map((rowNode, i) => (
          <div key={rowNode} className="contents">
            <div className="grid w-8 h-full place-items-center pr-2">
              <span className="block translate-y-[-0.02em] text-center text-sm font-bold text-slate-500 leading-none tabular-nums">{rowNode}</span>
            </div>

            {nodes.map((_, j) => {
              const isDiagonal = i === j;
              const val = matrix[i][j];
              const isEdge = val === 1;

              return (
                <div
                  key={`cell-${i}-${j}`}
                  className={`
                    relative grid place-items-center rounded-lg font-mono font-bold text-lg leading-none text-center tabular-nums
                    transition-all duration-200 cursor-default select-none
                    hover:scale-105 hover:shadow-md
                    ${isDiagonal
                      ? 'bg-white border-2 border-slate-200 text-slate-300'
                      : isEdge
                        ? 'bg-blue-500 border-2 border-blue-500 text-white shadow-sm'
                        : 'bg-white border-2 border-slate-200 text-slate-400'
                    }
                  `}
                  style={{ width: cellSize, height: cellSize }}
                >
                  <span className="block translate-y-[-0.02em]">{val}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdjacencyMatrixGrid;
