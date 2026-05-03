/**
 * Circuit Lab — Circuit State Engine
 * Pure types and state factories.
 */

import type { Complex } from '../../../components/qubit-playground/types';
import type { BlochData } from '../../../components/qubit-playground/useQubitState';

export type CircuitGateName =
  | 'H'
  | 'X'
  | 'Y'
  | 'Z'
  | 'S'
  | 'T'
  | 'Rx'
  | 'Ry'
  | 'Rz'
  | 'CNOT'
  | 'SWAP'
  | 'CPhase';

export interface CircuitGateDefinition {
  gate: CircuitGateName;
  symbol: string;
  fullName: string;
  group: 'fixed' | 'parametric' | 'twoQubit';
  numQubits: 1 | 2;
  defaultAngle?: number;
  description: string;
  tone: 'blue' | 'green' | 'purple';
}

export const CIRCUIT_GATE_LIBRARY: CircuitGateDefinition[] = [
  { gate: 'H', symbol: 'H', fullName: 'Hadamard', group: 'fixed', numQubits: 1, description: 'Membuat superposisi merata pada qubit target.', tone: 'blue' },
  { gate: 'X', symbol: 'X', fullName: 'Pauli-X', group: 'fixed', numQubits: 1, description: 'Membalik amplitudo basis |0⟩ dan |1⟩.', tone: 'blue' },
  { gate: 'Y', symbol: 'Y', fullName: 'Pauli-Y', group: 'fixed', numQubits: 1, description: 'Rotasi dengan fase imajiner pada sumbu Y.', tone: 'blue' },
  { gate: 'Z', symbol: 'Z', fullName: 'Pauli-Z', group: 'fixed', numQubits: 1, description: 'Membalik fase komponen |1⟩.', tone: 'blue' },
  { gate: 'S', symbol: 'S', fullName: 'Phase (S)', group: 'fixed', numQubits: 1, description: 'Menambahkan fase π/2 pada |1⟩.', tone: 'blue' },
  { gate: 'T', symbol: 'T', fullName: 'T Gate', group: 'fixed', numQubits: 1, description: 'Menambahkan fase π/4 pada |1⟩.', tone: 'blue' },
  { gate: 'Rx', symbol: 'Rx', fullName: 'Rotation-X', group: 'parametric', numQubits: 1, defaultAngle: Math.PI / 4, description: 'Memutar vektor Bloch terhadap sumbu X.', tone: 'green' },
  { gate: 'Ry', symbol: 'Ry', fullName: 'Rotation-Y', group: 'parametric', numQubits: 1, defaultAngle: Math.PI / 4, description: 'Memutar vektor Bloch terhadap sumbu Y.', tone: 'green' },
  { gate: 'Rz', symbol: 'Rz', fullName: 'Rotation-Z', group: 'parametric', numQubits: 1, defaultAngle: Math.PI / 4, description: 'Memutar fase relatif terhadap sumbu Z.', tone: 'green' },
  { gate: 'CNOT', symbol: 'CX', fullName: 'Controlled-NOT', group: 'twoQubit', numQubits: 2, description: 'Membalik target saat control bernilai |1⟩.', tone: 'purple' },
  { gate: 'SWAP', symbol: 'SWAP', fullName: 'Swap', group: 'twoQubit', numQubits: 2, description: 'Menukar keadaan dua qubit yang berdekatan.', tone: 'purple' },
  { gate: 'CPhase', symbol: 'CP', fullName: 'Controlled-Phase', group: 'twoQubit', numQubits: 2, defaultAngle: Math.PI / 4, description: 'Menambahkan fase terkontrol pada komponen |11⟩.', tone: 'purple' },
];

export interface CircuitPlacement {
  id: string;
  gate: CircuitGateName;
  column: number;
  row: number;
  targetRow?: number;
  angle?: number;
}

export interface CircuitCellState {
  placement: CircuitPlacement;
  role: 'primary' | 'secondary';
}

export interface CircuitProjectData {
  version: 1;
  numQubits: number;
  columnCount: number;
  placements: CircuitPlacement[];
}

export type CircuitCodeExportFormat = 'json' | 'qiskit' | 'cirq' | 'projectq';

export function getGateDefinition(gate: CircuitGateName): CircuitGateDefinition {
  return CIRCUIT_GATE_LIBRARY.find((entry) => entry.gate === gate)!;
}

let placementCounter = 0;
export function createPlacementId(): string {
  placementCounter += 1;
  return `circuit-placement-${placementCounter}`;
}

export function clampQubits(value: number): number {
  return Math.max(1, Math.round(value));
}

export function clampColumns(value: number): number {
  return Math.max(4, Math.min(10, Math.round(value)));
}

export function clonePlacement(placement: CircuitPlacement): CircuitPlacement {
  return {
    id: placement.id,
    gate: placement.gate,
    column: placement.column,
    row: placement.row,
    targetRow: placement.targetRow,
    angle: placement.angle,
  };
}

export function sortPlacements(placements: CircuitPlacement[]): CircuitPlacement[] {
  return [...placements].sort((a, b) => a.column - b.column || a.row - b.row);
}

export function overlaps(a: CircuitPlacement, b: CircuitPlacement): boolean {
  if (a.column !== b.column) return false;
  const rowsA = new Set([a.row, a.targetRow].filter((value): value is number => value !== undefined));
  const rowsB = new Set([b.row, b.targetRow].filter((value): value is number => value !== undefined));
  return [...rowsA].some((row) => rowsB.has(row));
}
