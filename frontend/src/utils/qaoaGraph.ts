export function deriveNodesFromMatrix(matrix: number[][]): number[] {
  return Array.from({ length: matrix.length }, (_, i) => i);
}

export function deriveEdgesFromMatrix(matrix: number[][]): [number, number][] {
  const n = matrix.length;
  const edges: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (matrix[i][j] === 1) edges.push([i, j]);
    }
  }
  return edges;
}

export function deriveGraphFromMatrix(matrix: number[][]) {
  return {
    nodes: deriveNodesFromMatrix(matrix),
    edges: deriveEdgesFromMatrix(matrix),
  };
}
