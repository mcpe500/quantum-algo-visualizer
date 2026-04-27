import type { CircuitGateName, CircuitPlacement } from './useCircuitBuilder';

export interface DecomposedGate {
  sourcePlacementId: string;
  gate: CircuitGateName | 'P' | 'CX';
  row: number;
  targetRow?: number;
  column: number;
  angle?: number;
  note: string;
}

export interface CircuitDecompositionReport {
  originalGateCount: number;
  decomposedGateCount: number;
  optimizedGateCount: number;
  optimizedGates: DecomposedGate[];
  cancelledPairs: number;
  expandedParameterizedGates: number;
  expandedMultiQubitGates: number;
}

const SELF_INVERSE_GATES = new Set<string>(['H', 'X', 'Y', 'Z', 'CX', 'SWAP']);

function cloneGate(placement: CircuitPlacement, note: string): DecomposedGate {
  return {
    sourcePlacementId: placement.id,
    gate: placement.gate,
    row: placement.row,
    targetRow: placement.targetRow,
    column: placement.column,
    angle: placement.angle,
    note,
  };
}

export function decomposeGate(placement: CircuitPlacement): DecomposedGate[] {
  const targetRow = placement.targetRow ?? placement.row + 1;
  switch (placement.gate) {
    case 'CPhase':
      return [
        { sourcePlacementId: placement.id, gate: 'P', row: targetRow, column: placement.column, angle: (placement.angle ?? Math.PI / 4) / 2, note: 'Phase pre-rotation on target.' },
        { sourcePlacementId: placement.id, gate: 'CX', row: placement.row, targetRow, column: placement.column, note: 'Entangling control-target bridge.' },
        { sourcePlacementId: placement.id, gate: 'P', row: targetRow, column: placement.column, angle: -(placement.angle ?? Math.PI / 4) / 2, note: 'Phase correction after bridge.' },
        { sourcePlacementId: placement.id, gate: 'CX', row: placement.row, targetRow, column: placement.column, note: 'Uncompute entangling bridge.' },
      ];
    case 'SWAP':
      return [
        { sourcePlacementId: placement.id, gate: 'CX', row: placement.row, targetRow, column: placement.column, note: 'SWAP decomposition step 1.' },
        { sourcePlacementId: placement.id, gate: 'CX', row: targetRow, targetRow: placement.row, column: placement.column, note: 'SWAP decomposition step 2.' },
        { sourcePlacementId: placement.id, gate: 'CX', row: placement.row, targetRow, column: placement.column, note: 'SWAP decomposition step 3.' },
      ];
    case 'Rx':
    case 'Ry':
    case 'Rz':
      return [{ ...cloneGate(placement, 'Parameterized rotation preserved with explicit angle.'), angle: placement.angle ?? Math.PI / 4 }];
    default:
      return [cloneGate(placement, 'Native gate preserved.')];
  }
}

function sameOperation(a: DecomposedGate, b: DecomposedGate): boolean {
  return a.gate === b.gate && a.row === b.row && a.targetRow === b.targetRow;
}

function isSelfInverseCancellation(a: DecomposedGate, b: DecomposedGate): boolean {
  return sameOperation(a, b) && SELF_INVERSE_GATES.has(String(a.gate));
}

function mergeParameterized(a: DecomposedGate, b: DecomposedGate): DecomposedGate | null {
  if (!sameOperation(a, b)) return null;
  if (a.gate !== 'Rx' && a.gate !== 'Ry' && a.gate !== 'Rz' && a.gate !== 'P') return null;
  const angle = (a.angle ?? 0) + (b.angle ?? 0);
  if (Math.abs(angle) < 1e-9) return null;
  return { ...b, angle, note: 'Merged adjacent parameterized rotations.' };
}

export function decomposeCircuit(placements: CircuitPlacement[]): CircuitDecompositionReport {
  const ordered = [...placements].sort((a, b) => a.column - b.column || a.row - b.row);
  const decomposed = ordered.flatMap(decomposeGate);
  const optimized: DecomposedGate[] = [];
  let cancelledPairs = 0;

  for (const gate of decomposed) {
    const previous = optimized[optimized.length - 1];
    if (previous && isSelfInverseCancellation(previous, gate)) {
      optimized.pop();
      cancelledPairs += 1;
      continue;
    }

    if (previous) {
      const merged = mergeParameterized(previous, gate);
      if (merged) {
        optimized[optimized.length - 1] = merged;
        continue;
      }
      if (
        merged === null
        && previous.angle !== undefined
        && gate.angle !== undefined
        && sameOperation(previous, gate)
        && Math.abs(previous.angle + gate.angle) < 1e-9
      ) {
        optimized.pop();
        cancelledPairs += 1;
        continue;
      }
    }

    optimized.push(gate);
  }

  return {
    originalGateCount: placements.length,
    decomposedGateCount: decomposed.length,
    optimizedGateCount: optimized.length,
    optimizedGates: optimized,
    cancelledPairs,
    expandedParameterizedGates: ordered.filter((gate) => gate.gate === 'Rx' || gate.gate === 'Ry' || gate.gate === 'Rz' || gate.gate === 'CPhase').length,
    expandedMultiQubitGates: ordered.filter((gate) => gate.gate === 'CPhase' || gate.gate === 'SWAP').length,
  };
}

export function formatDecompositionSummary(report: CircuitDecompositionReport): string {
  if (report.originalGateCount === 0) return 'No gates placed. Decomposition report empty.';
  return [
    `Original gates: ${report.originalGateCount}`,
    `After decomposition: ${report.decomposedGateCount}`,
    `After optimization: ${report.optimizedGateCount}`,
    `Cancelled pairs: ${report.cancelledPairs}`,
    `Parameterized expansions: ${report.expandedParameterizedGates}`,
    `Multi-qubit expansions: ${report.expandedMultiQubitGates}`,
  ].join('\n');
}
