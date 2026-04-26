/**
 * dataflowEngine.ts
 *
 * Topological execution engine for Formula Studio canvas.
 * Handles value propagation through connections between nodes.
 *
 * Architecture:
 * 1. Build adjacency list from connections
 * 2. Topological sort (Kahn's algorithm)
 * 3. Execute nodes in order
 * 4. Propagate values through connections
 * 5. Detect cycles and mark as error
 */

import type { CanvasNodeData, CanvasConnection } from './canvas-types';
import { FORMULA_REGISTRY } from '../registry';
import { FORMULA_COMPUTATION_MAP } from '../computation';
import {
  evaluateExpression,
  parseExpression,
  simplifyExpression,
  substituteSymbols,
  toInfix,
  toLatex,
} from '../engine';

export interface DataflowNodeResult {
  value?: number;
  valueDisplay?: string;
  simplified?: string;
  latex?: string;
  error?: string;
  status: 'computed' | 'pending' | 'error' | 'cyclic';
}

export interface DataflowGraph {
  executionOrder: string[];
  results: Map<string, DataflowNodeResult>;
  cycles: string[][];
  pendingNodes: string[];
}

interface Edge {
  from: string;
  to: string;
  fromPort: string;
  toPort: string;
  connectionId: string;
}

/** Build adjacency list from connections */
function buildAdjacencyList(
  nodes: CanvasNodeData[],
  connections: CanvasConnection[]
): Map<string, Edge[]> {
  const adj = new Map<string, Edge[]>();

  for (const node of nodes) {
    adj.set(node.id, []);
  }

  for (const conn of connections) {
    const connMeta = conn as unknown as Record<string, unknown>;
    const edges = adj.get(conn.fromId) ?? [];
    edges.push({
      from: conn.fromId,
      to: conn.toId,
      fromPort: (connMeta.fromPort as string | undefined) ?? 'default',
      toPort: (connMeta.toPort as string | undefined) ?? 'default',
      connectionId: conn.id,
    });
    adj.set(conn.fromId, edges);
  }

  return adj;
}

/** Detect cycles using DFS with color marking */
export function detectCycles(
  nodes: CanvasNodeData[],
  connections: CanvasConnection[]
): string[][] {
  const adj = buildAdjacencyList(nodes, connections);
  const cycles: string[][] = [];

  const color = new Map<string, 0 | 1 | 2>();

  for (const node of nodes) {
    color.set(node.id, 0);
  }

  function dfs(nodeId: string, path: string[]): void {
    color.set(nodeId, 1);

    const edges = adj.get(nodeId) ?? [];
    for (const edge of edges) {
      const neighbor = edge.to;

      if (color.get(neighbor) === 1) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
      } else if (color.get(neighbor) === 0) {
        dfs(neighbor, [...path, neighbor]);
      }
    }

    color.set(nodeId, 2);
  }

  for (const node of nodes) {
    if (color.get(node.id) === 0) {
      dfs(node.id, [node.id]);
    }
  }

  return cycles;
}

/** Topological sort using Kahn's algorithm */
export function topologicalSort(
  nodes: CanvasNodeData[],
  connections: CanvasConnection[]
): string[] | null {
  const adj = buildAdjacencyList(nodes, connections);
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
  }
  for (const edges of adj.values()) {
    for (const edge of edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const result: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const edges = adj.get(nodeId) ?? [];
    for (const edge of edges) {
      const newDegree = (inDegree.get(edge.to) ?? 0) - 1;
      inDegree.set(edge.to, newDegree);
      if (newDegree === 0) {
        queue.push(edge.to);
      }
    }
  }

  if (result.length !== nodes.length) {
    return null; // Cycle detected
  }

  return result;
}

/** Gather input values from connected predecessors */
function gatherInputs(
  nodeId: string,
  connections: CanvasConnection[],
  computedResults: Map<string, DataflowNodeResult>
): { values: Record<string, number>; missing: string[] } {
  const values: Record<string, number> = {};
  const missing: string[] = [];

  const incoming = connections.filter(c => c.toId === nodeId);

  for (const conn of incoming) {
    const connMeta = conn as unknown as Record<string, unknown>;
    const portName = (connMeta.toPort as string | undefined) ?? 'default';
    const sourceResult = computedResults.get(conn.fromId);

    if (sourceResult?.status === 'computed' && sourceResult.value !== undefined) {
      values[portName] = sourceResult.value;
    } else {
      missing.push(portName);
    }
  }

  return { values, missing };
}

/** Format number for display */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'NaN';
  if (Math.abs(value) >= 1e9 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(4);
  }
  return parseFloat(value.toPrecision(7)).toString();
}

/** Check if adding a connection would create a cycle */
export function wouldCreateCycle(
  fromId: string,
  toId: string,
  nodes: CanvasNodeData[],
  existingConnections: CanvasConnection[]
): boolean {
  const testConn: CanvasConnection = {
    id: 'temp',
    fromId,
    toId,
    relationType: 'test',
    label: '',
  };

  const cycles = detectCycles(nodes, [...existingConnections, testConn]);
  return cycles.length > 0;
}

/**
 * Compute entire graph with dataflow propagation.
 * Returns results for all nodes in execution order.
 */
export function computeDataflowGraph(
  nodes: CanvasNodeData[],
  connections: CanvasConnection[],
  globalScope: Record<string, number> = {}
): DataflowGraph {
  if (nodes.length === 0) {
    return { executionOrder: [], results: new Map(), cycles: [], pendingNodes: [] };
  }

  // Step 1: Detect cycles
  const cycles = detectCycles(nodes, connections);
  if (cycles.length > 0) {
    const cycleNodes = new Set(cycles.flat());
    const results = new Map<string, DataflowNodeResult>();

    for (const node of nodes) {
      if (cycleNodes.has(node.id)) {
        results.set(node.id, {
          value: undefined,
          error: 'Node terlibat dalam siklus',
          status: 'cyclic',
        });
      }
    }

    return {
      executionOrder: [],
      results,
      cycles,
      pendingNodes: Array.from(cycleNodes),
    };
  }

  // Step 2: Get topological order
  const executionOrder = topologicalSort(nodes, connections);
  if (!executionOrder) {
    return {
      executionOrder: [],
      results: new Map(),
      cycles: [],
      pendingNodes: nodes.map(n => n.id),
    };
  }

  // Step 3: Execute in order
  const results = new Map<string, DataflowNodeResult>();
  const pendingNodes: string[] = [];

  for (const nodeId of executionOrder) {
    const node = nodes.find(n => n.id === nodeId)!;

    // Gather inputs from already-computed predecessors
    const { values: inputValues } = gatherInputs(nodeId, connections, results);

    // Merge with global scope for expression evaluation
    const scope = { ...globalScope, ...inputValues };

    // Compute the node
    const result = computeNode(node, scope);
    results.set(nodeId, result);

    if (result.status === 'pending') {
      pendingNodes.push(nodeId);
    }
  }

  return {
    executionOrder,
    results,
    cycles: [],
    pendingNodes,
  };
}

/** Compute a single node given its inputs */
function computeNode(
  node: CanvasNodeData,
  scope: Record<string, number>
): DataflowNodeResult {
  try {
    switch (node.kind) {
      case 'input': {
        const val = Number(node.varValue ?? '');
        if (!Number.isFinite(val)) {
          return {
            value: undefined,
            error: 'Nilai input tidak valid',
            status: 'error',
          };
        }
        return {
          value: val,
          valueDisplay: formatNumber(val),
          status: 'computed',
        };
      }

      case 'expression': {
        if (!node.nodeExpression?.trim()) {
          return {
            value: undefined,
            status: 'pending',
          };
        }

        const parseResult = parseExpression(node.nodeExpression.trim());
        if (!parseResult.ok) {
          return {
            value: undefined,
            error: `Parse error: ${parseResult.error.message}`,
            status: 'error',
          };
        }

        const substituted = substituteSymbols(parseResult.value, scope);
        const simplified = simplifyExpression(substituted);
        const evalResult = evaluateExpression(simplified, { variables: scope });

        if (!evalResult.ok) {
          const msg = evalResult.error.message;
          return {
            value: undefined,
            simplified: toInfix(simplified),
            error: msg.includes('Missing value') ? `Variabel belum terdefinisi` : msg,
            status: 'error',
          };
        }

        return {
          value: evalResult.value,
          valueDisplay: formatNumber(evalResult.value),
          simplified: toInfix(simplified),
          latex: toLatex(simplified),
          status: 'computed',
        };
      }

      case 'formula': {
        if (!node.formulaId) {
          return {
            value: undefined,
            error: 'Formula tidak valid',
            status: 'error',
          };
        }

        const formula = FORMULA_REGISTRY.find((f) => f.id === node.formulaId);
        const computation = formula?.computation ?? FORMULA_COMPUTATION_MAP[node.formulaId];

        if (!computation) {
          return {
            value: undefined,
            simplified: formula?.latex,
            status: 'pending',
          };
        }

        const required = computation.requiresParams ?? [];
        const missing = required.filter((p: string) => scope[p] === undefined);

        if (missing.length > 0) {
          return {
            value: undefined,
            simplified: formula?.latex,
            error: `Parameter diperlukan: ${missing.join(', ')}`,
            status: 'pending',
          };
        }

        try {
          const paramValues: Record<string, number> = {};
          for (const p of required) {
            paramValues[p] = scope[p] ?? 0;
          }
          const steps = computation.steps(paramValues);

          if (!steps || steps.length === 0) {
            return {
              value: undefined,
              simplified: formula?.latex,
              error: 'Komputasi tidak menghasilkan langkah',
              status: 'error',
            };
          }

          const finalStep = steps[steps.length - 1];

          if (finalStep.result === undefined) {
            return {
              value: undefined,
              simplified: formula?.latex,
              error: 'Langkah akhir tidak memiliki hasil',
              status: 'error',
            };
          }

          return {
            value: Number(finalStep.result),
            valueDisplay: finalStep.result.toString(),
            simplified: formula?.latex,
            status: 'computed',
          };
        } catch {
          return {
            value: undefined,
            simplified: formula?.latex,
            error: 'Kesalahan komputasi',
            status: 'error',
          };
        }
      }

      default:
        return {
          value: undefined,
          error: 'Tipe node tidak dikenal',
          status: 'error',
        };
    }
  } catch (err) {
    return {
      value: undefined,
      error: err instanceof Error ? err.message : 'Error tidak diketahui',
      status: 'error',
    };
  }
}
