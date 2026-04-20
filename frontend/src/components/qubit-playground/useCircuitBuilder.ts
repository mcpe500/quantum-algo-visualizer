import { useState, useMemo, useCallback } from 'react';
import type { Complex } from './types';
import type { BlochData } from './useQubitState';
import {
  H,
  X,
  Y,
  Z,
  S,
  T,
  Rx,
  Ry,
  Rz,
  CNOT,
  CPhase,
  SWAP,
  embedGate1Q,
  embedGate2Q,
  applyGateToState,
  getInitialState,
  blochCoords,
  marginalProb,
} from './constants';

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
  {
    gate: 'H',
    symbol: 'H',
    fullName: 'Hadamard',
    group: 'fixed',
    numQubits: 1,
    description: 'Membuat superposisi merata pada qubit target.',
    tone: 'blue',
  },
  {
    gate: 'X',
    symbol: 'X',
    fullName: 'Pauli-X',
    group: 'fixed',
    numQubits: 1,
    description: 'Membalik amplitudo basis |0⟩ dan |1⟩.',
    tone: 'blue',
  },
  {
    gate: 'Y',
    symbol: 'Y',
    fullName: 'Pauli-Y',
    group: 'fixed',
    numQubits: 1,
    description: 'Rotasi dengan fase imajiner pada sumbu Y.',
    tone: 'blue',
  },
  {
    gate: 'Z',
    symbol: 'Z',
    fullName: 'Pauli-Z',
    group: 'fixed',
    numQubits: 1,
    description: 'Membalik fase komponen |1⟩.',
    tone: 'blue',
  },
  {
    gate: 'S',
    symbol: 'S',
    fullName: 'Phase (S)',
    group: 'fixed',
    numQubits: 1,
    description: 'Menambahkan fase π/2 pada |1⟩.',
    tone: 'blue',
  },
  {
    gate: 'T',
    symbol: 'T',
    fullName: 'T Gate',
    group: 'fixed',
    numQubits: 1,
    description: 'Menambahkan fase π/4 pada |1⟩.',
    tone: 'blue',
  },
  {
    gate: 'Rx',
    symbol: 'Rx',
    fullName: 'Rotation-X',
    group: 'parametric',
    numQubits: 1,
    defaultAngle: Math.PI / 4,
    description: 'Memutar vektor Bloch terhadap sumbu X.',
    tone: 'green',
  },
  {
    gate: 'Ry',
    symbol: 'Ry',
    fullName: 'Rotation-Y',
    group: 'parametric',
    numQubits: 1,
    defaultAngle: Math.PI / 4,
    description: 'Memutar vektor Bloch terhadap sumbu Y.',
    tone: 'green',
  },
  {
    gate: 'Rz',
    symbol: 'Rz',
    fullName: 'Rotation-Z',
    group: 'parametric',
    numQubits: 1,
    defaultAngle: Math.PI / 4,
    description: 'Memutar fase relatif terhadap sumbu Z.',
    tone: 'green',
  },
  {
    gate: 'CNOT',
    symbol: 'CX',
    fullName: 'Controlled-NOT',
    group: 'twoQubit',
    numQubits: 2,
    description: 'Membalik target saat control bernilai |1⟩.',
    tone: 'purple',
  },
  {
    gate: 'SWAP',
    symbol: 'SWAP',
    fullName: 'Swap',
    group: 'twoQubit',
    numQubits: 2,
    description: 'Menukar keadaan dua qubit yang berdekatan.',
    tone: 'purple',
  },
  {
    gate: 'CPhase',
    symbol: 'CP',
    fullName: 'Controlled-Phase',
    group: 'twoQubit',
    numQubits: 2,
    defaultAngle: Math.PI / 4,
    description: 'Menambahkan fase terkontrol pada komponen |11⟩.',
    tone: 'purple',
  },
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

export interface CircuitTraceStep {
  placementId: string;
  label: string;
  ket: string;
  summary: string;
  statevector: Complex[];
  blochData: BlochData[];
  column: number;
  phenomena: string[];
}

export interface CircuitInsight {
  id: string;
  title: string;
  description: string;
  tone: 'cyan' | 'violet' | 'amber';
}

export interface CircuitPlaybackFrame {
  stepIndex: number;
  placementId: string | null;
  label: string;
  summary: string;
  ket: string;
  column: number | null;
  phenomena: string[];
  statevector: Complex[];
  blochData: BlochData[];
  blochCards: Array<BlochData & { label: string }>;
}

export interface CircuitProjectData {
  version: 1;
  numQubits: number;
  columnCount: number;
  placements: CircuitPlacement[];
}

export type CircuitCodeExportFormat = 'json' | 'qiskit' | 'cirq' | 'projectq';

const SINGLE_GATE_MATRICES: Record<Extract<CircuitGateName, 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T'>, Complex[][]> = {
  H,
  X,
  Y,
  Z,
  S,
  T,
};

const PARAMETRIC_GATE_MATRICES: Record<Extract<CircuitGateName, 'Rx' | 'Ry' | 'Rz'>, (angle: number) => Complex[][]> = {
  Rx,
  Ry,
  Rz,
};

const TWO_QUBIT_GATE_MATRICES: Record<Extract<CircuitGateName, 'CNOT' | 'SWAP' | 'CPhase'>, (angle?: number) => Complex[][]> = {
  CNOT: () => CNOT,
  SWAP: () => SWAP,
  CPhase: (angle = 0) => CPhase(angle),
};

const PARAMETRIC_GATES: CircuitGateName[] = ['Rx', 'Ry', 'Rz', 'CPhase'];
const PHASE_GATES: CircuitGateName[] = ['Z', 'S', 'T', 'Rz', 'CPhase'];
const TWO_QUBIT_GATES: CircuitGateName[] = ['CNOT', 'SWAP', 'CPhase'];
const EPSILON = 1e-3;

let placementCounter = 0;

function createPlacementId(): string {
  placementCounter += 1;
  return `circuit-placement-${placementCounter}`;
}

function clampQubits(value: number): number {
  return Math.max(1, Math.round(value));
}

function clampColumns(value: number): number {
  return Math.max(4, Math.min(10, Math.round(value)));
}

function getGateDefinition(gate: CircuitGateName): CircuitGateDefinition {
  return CIRCUIT_GATE_LIBRARY.find((entry) => entry.gate === gate)!;
}

function computeBlochData(statevector: Complex[], numQubits: number): BlochData[] {
  return Array.from({ length: numQubits }, (_, i) => {
    const coords = blochCoords(statevector, i, numQubits);
    const probs = marginalProb(statevector, i, numQubits);
    return { ...coords, pZero: probs.pZero, pOne: probs.pOne };
  });
}

function buildBlochCards(blochData: BlochData[]) {
  return blochData.map((entry, index) => ({ ...entry, label: `q${index}` }));
}

function clonePlacement(placement: CircuitPlacement): CircuitPlacement {
  return {
    id: placement.id,
    gate: placement.gate,
    column: placement.column,
    row: placement.row,
    targetRow: placement.targetRow,
    angle: placement.angle,
  };
}

function sortPlacements(placements: CircuitPlacement[]): CircuitPlacement[] {
  return [...placements].sort((a, b) => a.column - b.column || a.row - b.row);
}

function formatCodeNumber(value: number): string {
  return value.toFixed(6).replace(/\.0+$/, '').replace(/(\.[0-9]*[1-9])0+$/, '$1');
}

function buildQiskitSource(project: CircuitProjectData): string {
  const lines = [
    'from qiskit import QuantumCircuit',
    '',
    `qc = QuantumCircuit(${project.numQubits})`,
  ];

  let previousColumn = -1;
  for (const placement of project.placements) {
    if (placement.column !== previousColumn) {
      lines.push('', `# Column ${placement.column + 1}`);
      previousColumn = placement.column;
    }

    const targetRow = placement.targetRow ?? placement.row + 1;
    const angle = formatCodeNumber(placement.angle ?? getGateDefinition(placement.gate).defaultAngle ?? 0);

    switch (placement.gate) {
      case 'H':
        lines.push(`qc.h(${placement.row})`);
        break;
      case 'X':
        lines.push(`qc.x(${placement.row})`);
        break;
      case 'Y':
        lines.push(`qc.y(${placement.row})`);
        break;
      case 'Z':
        lines.push(`qc.z(${placement.row})`);
        break;
      case 'S':
        lines.push(`qc.s(${placement.row})`);
        break;
      case 'T':
        lines.push(`qc.t(${placement.row})`);
        break;
      case 'Rx':
        lines.push(`qc.rx(${angle}, ${placement.row})`);
        break;
      case 'Ry':
        lines.push(`qc.ry(${angle}, ${placement.row})`);
        break;
      case 'Rz':
        lines.push(`qc.rz(${angle}, ${placement.row})`);
        break;
      case 'CNOT':
        lines.push(`qc.cx(${placement.row}, ${targetRow})`);
        break;
      case 'SWAP':
        lines.push(`qc.swap(${placement.row}, ${targetRow})`);
        break;
      case 'CPhase':
        lines.push(`qc.cp(${angle}, ${placement.row}, ${targetRow})`);
        break;
    }
  }

  lines.push('', 'print(qc)');
  return lines.join('\n');
}

function buildCirqSource(project: CircuitProjectData): string {
  const lines = [
    'import cirq',
    'import numpy as np',
    '',
    `q = cirq.LineQubit.range(${project.numQubits})`,
    'circuit = cirq.Circuit()',
  ];

  let previousColumn = -1;
  for (const placement of project.placements) {
    if (placement.column !== previousColumn) {
      lines.push('', `# Column ${placement.column + 1}`);
      previousColumn = placement.column;
    }

    const targetRow = placement.targetRow ?? placement.row + 1;
    const angle = formatCodeNumber(placement.angle ?? getGateDefinition(placement.gate).defaultAngle ?? 0);

    switch (placement.gate) {
      case 'H':
        lines.push(`circuit.append(cirq.H(q[${placement.row}]))`);
        break;
      case 'X':
        lines.push(`circuit.append(cirq.X(q[${placement.row}]))`);
        break;
      case 'Y':
        lines.push(`circuit.append(cirq.Y(q[${placement.row}]))`);
        break;
      case 'Z':
        lines.push(`circuit.append(cirq.Z(q[${placement.row}]))`);
        break;
      case 'S':
        lines.push(`circuit.append(cirq.S(q[${placement.row}]))`);
        break;
      case 'T':
        lines.push(`circuit.append(cirq.T(q[${placement.row}]))`);
        break;
      case 'Rx':
        lines.push(`circuit.append(cirq.rx(${angle}).on(q[${placement.row}]))`);
        break;
      case 'Ry':
        lines.push(`circuit.append(cirq.ry(${angle}).on(q[${placement.row}]))`);
        break;
      case 'Rz':
        lines.push(`circuit.append(cirq.rz(${angle}).on(q[${placement.row}]))`);
        break;
      case 'CNOT':
        lines.push(`circuit.append(cirq.CNOT(q[${placement.row}], q[${targetRow}]))`);
        break;
      case 'SWAP':
        lines.push(`circuit.append(cirq.SWAP(q[${placement.row}], q[${targetRow}]))`);
        break;
      case 'CPhase':
        lines.push(`circuit.append(cirq.CZPowGate(exponent=${angle} / np.pi).on(q[${placement.row}], q[${targetRow}]))`);
        break;
    }
  }

  lines.push('', 'print(circuit)');
  return lines.join('\n');
}

function buildProjectQSource(project: CircuitProjectData): string {
  const lines = [
    'from projectq import MainEngine',
    'from projectq.meta import Control',
    'from projectq.ops import H, X, Y, Z, S, T, Rx, Ry, Rz, CNOT, Swap, R',
    '',
    'eng = MainEngine()',
    `qubits = eng.allocate_qureg(${project.numQubits})`,
  ];

  let previousColumn = -1;
  for (const placement of project.placements) {
    if (placement.column !== previousColumn) {
      lines.push('', `# Column ${placement.column + 1}`);
      previousColumn = placement.column;
    }

    const targetRow = placement.targetRow ?? placement.row + 1;
    const angle = formatCodeNumber(placement.angle ?? getGateDefinition(placement.gate).defaultAngle ?? 0);

    switch (placement.gate) {
      case 'H':
        lines.push(`H | qubits[${placement.row}]`);
        break;
      case 'X':
        lines.push(`X | qubits[${placement.row}]`);
        break;
      case 'Y':
        lines.push(`Y | qubits[${placement.row}]`);
        break;
      case 'Z':
        lines.push(`Z | qubits[${placement.row}]`);
        break;
      case 'S':
        lines.push(`S | qubits[${placement.row}]`);
        break;
      case 'T':
        lines.push(`T | qubits[${placement.row}]`);
        break;
      case 'Rx':
        lines.push(`Rx(${angle}) | qubits[${placement.row}]`);
        break;
      case 'Ry':
        lines.push(`Ry(${angle}) | qubits[${placement.row}]`);
        break;
      case 'Rz':
        lines.push(`Rz(${angle}) | qubits[${placement.row}]`);
        break;
      case 'CNOT':
        lines.push(`CNOT | (qubits[${placement.row}], qubits[${targetRow}])`);
        break;
      case 'SWAP':
        lines.push(`Swap | (qubits[${placement.row}], qubits[${targetRow}])`);
        break;
      case 'CPhase':
        lines.push(`with Control(eng, qubits[${placement.row}]):`);
        lines.push(`    R(${angle}) | qubits[${targetRow}]`);
        break;
    }
  }

  lines.push('', 'eng.flush()');
  return lines.join('\n');
}

function overlaps(a: CircuitPlacement, b: CircuitPlacement): boolean {
  if (a.column !== b.column) return false;
  const rowsA = new Set([a.row, a.targetRow].filter((value): value is number => value !== undefined));
  const rowsB = new Set([b.row, b.targetRow].filter((value): value is number => value !== undefined));
  return [...rowsA].some((row) => rowsB.has(row));
}

function probabilityOf(amplitude: Complex): number {
  return amplitude.re * amplitude.re + amplitude.im * amplitude.im;
}

function formatReal(value: number): string {
  return value.toFixed(3).replace(/\.0+$/, '').replace(/(\.[0-9]*[1-9])0+$/, '$1');
}

function formatAmplitude(re: number, im: number): string {
  const magnitude = Math.sqrt(re * re + im * im);
  if (magnitude < 0.01) return '0';

  const specialValues = [
    { re: 1, im: 0, label: '1' },
    { re: -1, im: 0, label: '-1' },
    { re: 0, im: 1, label: 'i' },
    { re: 0, im: -1, label: '-i' },
    { re: 1 / Math.sqrt(2), im: 0, label: '1/√2' },
    { re: -1 / Math.sqrt(2), im: 0, label: '-1/√2' },
    { re: 0, im: 1 / Math.sqrt(2), label: 'i/√2' },
    { re: 0, im: -1 / Math.sqrt(2), label: '-i/√2' },
  ];

  const match = specialValues.find(
    (value) => Math.abs(re - value.re) < 0.01 && Math.abs(im - value.im) < 0.01
  );
  if (match) return match.label;

  const reSmall = Math.abs(re) < 0.01;
  const imSmall = Math.abs(im) < 0.01;
  if (reSmall) {
    return `${im >= 0 ? '' : '-'}${formatReal(Math.abs(im))}i`;
  }
  if (imSmall) {
    return formatReal(re);
  }

  return `${formatReal(re)}${im >= 0 ? '+' : '-'}${formatReal(Math.abs(im))}i`;
}

function formatBasis(index: number, numQubits: number): string {
  return `|${index.toString(2).padStart(numQubits, '0')}⟩`;
}

function formatKet(statevector: Complex[], numQubits: number): string {
  const terms = statevector
    .map((amplitude, index) => ({ amplitude, index, probability: probabilityOf(amplitude) }))
    .filter((entry) => entry.probability > 1e-4)
    .sort((a, b) => b.probability - a.probability)
    .map(({ amplitude, index }) => `${formatAmplitude(amplitude.re, amplitude.im)}${formatBasis(index, numQubits)}`);

  return terms.length > 0 ? terms.join(' + ') : '0';
}

function formatAngle(angle: number): string {
  return angle.toFixed(3);
}

function isSuperposedQubit(bloch: BlochData): boolean {
  return bloch.pZero > 0.2 && bloch.pZero < 0.8;
}

function isNearMinusState(bloch: BlochData): boolean {
  return bloch.x < -0.75 && Math.abs(bloch.y) < 0.35 && Math.abs(bloch.z) < 0.35;
}

function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function complexSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

function complexAbs(value: Complex): number {
  return Math.sqrt(value.re * value.re + value.im * value.im);
}

function buildGateMatrix(placement: CircuitPlacement): Complex[][] {
  if (placement.gate in SINGLE_GATE_MATRICES) {
    return SINGLE_GATE_MATRICES[placement.gate as keyof typeof SINGLE_GATE_MATRICES];
  }

  if (placement.gate in PARAMETRIC_GATE_MATRICES) {
    const angle = placement.angle ?? getGateDefinition(placement.gate).defaultAngle ?? 0;
    return PARAMETRIC_GATE_MATRICES[placement.gate as keyof typeof PARAMETRIC_GATE_MATRICES](angle);
  }

  const angle = placement.angle ?? getGateDefinition(placement.gate).defaultAngle;
  return TWO_QUBIT_GATE_MATRICES[placement.gate as keyof typeof TWO_QUBIT_GATE_MATRICES](angle);
}

function buildPlacementLabel(placement: CircuitPlacement): string {
  const definition = getGateDefinition(placement.gate);
  if (definition.numQubits === 2) {
    return `${definition.fullName} · q${placement.row} → q${placement.targetRow}`;
  }
  return `${definition.fullName} · q${placement.row}`;
}

function buildSummary(placement: CircuitPlacement, blochData: BlochData[]): string {
  const angle = placement.angle ?? getGateDefinition(placement.gate).defaultAngle;

  switch (placement.gate) {
    case 'H':
      return `Hadamard membuka superposisi pada q${placement.row}.`;
    case 'X':
      return `Pauli-X membalik populasi basis pada q${placement.row}.`;
    case 'Y':
      return `Pauli-Y memutar amplitudo dan fase pada q${placement.row}.`;
    case 'Z':
      return `Pauli-Z membalik fase relatif komponen |1⟩ pada q${placement.row}.`;
    case 'S':
      return `S gate menambahkan fase π/2 pada q${placement.row}.`;
    case 'T':
      return `T gate menambahkan fase π/4 pada q${placement.row}.`;
    case 'Rx':
      return `Rx(${formatAngle(angle ?? 0)}) memutar keadaan pada q${placement.row} terhadap sumbu X.`;
    case 'Ry':
      return `Ry(${formatAngle(angle ?? 0)}) memutar amplitudo pada q${placement.row} terhadap sumbu Y.`;
    case 'Rz':
      return `Rz(${formatAngle(angle ?? 0)}) memutar fase pada q${placement.row}.`;
    case 'CNOT':
      return `Controlled-NOT mengaitkan q${placement.row} sebagai control dengan q${placement.targetRow} sebagai target.`;
    case 'SWAP':
      return `SWAP menukar distribusi keadaan antara q${placement.row} dan q${placement.targetRow}.`;
    case 'CPhase':
      return `CPhase(${formatAngle(angle ?? 0)}) menambahkan fase bersama saat q${placement.row} dan q${placement.targetRow} aktif.`;
    default:
      return `Keadaan setelah ${placement.gate} memiliki p(|0⟩) ${blochData[placement.row]?.pZero.toFixed(2) ?? '0.00'} pada q${placement.row}.`;
  }
}

function buildPhenomena(placement: CircuitPlacement, before: BlochData[], after: BlochData[]): string[] {
  const phenomena: string[] = [];

  if (after.some(isSuperposedQubit)) {
    phenomena.push('superposition');
  }
  if (PHASE_GATES.includes(placement.gate)) {
    phenomena.push('phase rotation');
  }
  if (TWO_QUBIT_GATES.includes(placement.gate)) {
    phenomena.push('two-qubit interaction');
  }
  if (
    (placement.gate === 'CNOT' || placement.gate === 'CPhase') &&
    placement.targetRow !== undefined &&
    isSuperposedQubit(before[placement.row]) &&
    isNearMinusState(before[placement.targetRow])
  ) {
    phenomena.push('phase kickback');
  }

  return phenomena;
}

export function useCircuitBuilder() {
  const [numQubits, setNumQubitsState] = useState<number>(2);
  const [columnCount, setColumnCount] = useState<number>(6);
  const [placements, setPlacements] = useState<CircuitPlacement[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const orderedPlacements = useMemo(() => sortPlacements(placements), [placements]);

  const selectedPlacement = useMemo(
    () => placements.find((placement) => placement.id === selectedPlacementId) ?? null,
    [placements, selectedPlacementId]
  );

  const canIncreaseQubits = true;
  const canDecreaseQubits = numQubits > 1;

  const setNumQubits = useCallback((value: number) => {
    const nextValue = clampQubits(value);
    setNumQubitsState(nextValue);
    setPlacements([]);
    setSelectedPlacementId(null);
  }, []);

  const increaseQubits = useCallback(() => {
    if (!canIncreaseQubits) return;
    setNumQubits(numQubits + 1);
  }, [canIncreaseQubits, numQubits, setNumQubits]);

  const decreaseQubits = useCallback(() => {
    if (!canDecreaseQubits) return;
    setNumQubits(numQubits - 1);
  }, [canDecreaseQubits, numQubits, setNumQubits]);

  const addColumn = useCallback(() => {
    setColumnCount((current) => clampColumns(current + 1));
  }, []);

  const removeColumn = useCallback(() => {
    const nextCount = clampColumns(columnCount - 1);
    if (nextCount === columnCount) return;

    const nextPlacements = placements.filter((placement) => placement.column < nextCount);
    setColumnCount(nextCount);
    setPlacements(nextPlacements);
    setSelectedPlacementId((currentSelectedId) =>
      currentSelectedId && nextPlacements.some((placement) => placement.id === currentSelectedId)
        ? currentSelectedId
        : null
    );
  }, [columnCount, placements]);

  const clearCircuit = useCallback(() => {
    setPlacements([]);
    setSelectedPlacementId(null);
  }, []);

  const canPlaceGate = useCallback(
    (gate: CircuitGateName, row: number) => {
      const definition = getGateDefinition(gate);
      if (row < 0 || row >= numQubits) return false;
      if (definition.numQubits === 2) {
        return numQubits >= 2;
      }
      return true;
    },
    [numQubits]
  );

  const upsertPlacement = useCallback(
    (nextPlacement: CircuitPlacement, placementIdToIgnore?: string) => {
      setPlacements((current) => {
        const filtered = current.filter((placement) => {
          if (placement.id === placementIdToIgnore) return false;
          return !overlaps(placement, nextPlacement);
        });
        return [...filtered, nextPlacement];
      });
      setSelectedPlacementId(nextPlacement.id);
      return true;
    },
    []
  );

  const placeGate = useCallback(
    (gate: CircuitGateName, row: number, column: number, targetRow?: number) => {
      if (!canPlaceGate(gate, row)) return false;
      if (column < 0 || column >= columnCount) return false;

      const definition = getGateDefinition(gate);
      let actualTargetRow: number | undefined = targetRow;
      if (definition.numQubits === 2 && actualTargetRow === undefined) {
        actualTargetRow = row < numQubits - 1 ? row + 1 : Math.max(0, row - 1);
      }
      const placement: CircuitPlacement = {
        id: createPlacementId(),
        gate,
        row,
        column,
        targetRow: actualTargetRow,
        angle: definition.defaultAngle,
      };

      upsertPlacement(placement);
      return true;
    },
    [canPlaceGate, columnCount, numQubits, upsertPlacement]
  );

  const movePlacement = useCallback(
    (placementId: string, row: number, column: number, targetRow?: number) => {
      const existing = placements.find((placement) => placement.id === placementId);
      if (!existing) return false;
      if (!canPlaceGate(existing.gate, row)) return false;
      if (column < 0 || column >= columnCount) return false;

      const definition = getGateDefinition(existing.gate);
      let actualTargetRow: number | undefined = targetRow ?? existing.targetRow;
      if (definition.numQubits === 2 && actualTargetRow === undefined) {
        actualTargetRow = row < numQubits - 1 ? row + 1 : Math.max(0, row - 1);
      }

      const movedPlacement: CircuitPlacement = {
        ...existing,
        row,
        column,
        targetRow: actualTargetRow,
      };

      upsertPlacement(movedPlacement, placementId);
      return true;
    },
    [placements, canPlaceGate, columnCount, numQubits, upsertPlacement]
  );

  const removePlacementAt = useCallback(
    (row: number, column: number) => {
      const removedPlacement = placements.find((placement) => {
        const touchesRow = placement.row === row || placement.targetRow === row;
        return placement.column === column && touchesRow;
      });
      if (!removedPlacement) return;

      setPlacements((current) => current.filter((placement) => placement.id !== removedPlacement.id));
      setSelectedPlacementId((current) => (current === removedPlacement.id ? null : current));
    },
    [placements]
  );

  const selectPlacement = useCallback((placementId: string | null) => {
    setSelectedPlacementId(placementId);
  }, []);

  const updateSelectedAngle = useCallback((angle: number) => {
    setPlacements((current) =>
      current.map((placement) => {
        if (placement.id !== selectedPlacementId) return placement;
        if (!PARAMETRIC_GATES.includes(placement.gate)) return placement;
        return { ...placement, angle };
      })
    );
  }, [selectedPlacementId]);

  const updateSelectedTargetRow = useCallback((targetRow: number) => {
    setPlacements((current) =>
      current.map((placement) => {
        if (placement.id !== selectedPlacementId) return placement;
        const definition = getGateDefinition(placement.gate);
        if (definition.numQubits !== 2) return placement;
        if (targetRow < 0 || targetRow >= numQubits) return placement;
        if (targetRow === placement.row) return placement;
        return { ...placement, targetRow };
      })
    );
  }, [selectedPlacementId, numQubits]);

  const getCellState = useCallback(
    (row: number, column: number): CircuitCellState | null => {
      const placement = placements.find(
        (entry) => entry.column === column && (entry.row === row || entry.targetRow === row)
      );
      if (!placement) return null;
      return {
        placement,
        role: placement.row === row ? 'primary' : 'secondary',
      };
    },
    [placements]
  );

  const exportProjectData = useCallback((): CircuitProjectData => {
    return {
      version: 1,
      numQubits,
      columnCount,
      placements: orderedPlacements.map(clonePlacement),
    };
  }, [columnCount, numQubits, orderedPlacements]);

  const exportCircuitCode = useCallback((format: CircuitCodeExportFormat): string => {
    const project = exportProjectData();

    switch (format) {
      case 'json':
        return JSON.stringify(project, null, 2);
      case 'qiskit':
        return buildQiskitSource(project);
      case 'cirq':
        return buildCirqSource(project);
      case 'projectq':
        return buildProjectQSource(project);
      default:
        return '';
    }
  }, [exportProjectData]);

  const simulation = useMemo(() => {
    const initialStatevector = getInitialState(numQubits).map((entry) => ({ ...entry }));
    const initialBlochData = computeBlochData(initialStatevector, numQubits);
    let currentState = initialStatevector.map((entry) => ({ ...entry }));

    const traceInternal: Array<CircuitTraceStep & { beforeBlochData: BlochData[]; placement: CircuitPlacement }> = [];

    for (const placement of orderedPlacements) {
      const beforeBlochData = computeBlochData(currentState, numQubits);
      const baseGate = buildGateMatrix(placement);
      const embedded = getGateDefinition(placement.gate).numQubits === 2
        ? embedGate2Q(baseGate, placement.row, placement.targetRow!, numQubits)
        : embedGate1Q(baseGate, placement.row, numQubits);

      currentState = applyGateToState(currentState, embedded);
      const stepBlochData = computeBlochData(currentState, numQubits);

      traceInternal.push({
        placementId: placement.id,
        label: buildPlacementLabel(placement),
        ket: formatKet(currentState, numQubits),
        summary: buildSummary(placement, stepBlochData),
        statevector: currentState.map((entry) => ({ ...entry })),
        blochData: stepBlochData,
        column: placement.column,
        phenomena: buildPhenomena(placement, beforeBlochData, stepBlochData),
        beforeBlochData,
        placement,
      });
    }

    const finalStatevector = currentState.map((entry) => ({ ...entry }));
    const finalBlochData = computeBlochData(finalStatevector, numQubits);
    const blochCards = buildBlochCards(finalBlochData);
    const playbackFrames: CircuitPlaybackFrame[] = [
      {
        stepIndex: 0,
        placementId: null,
        label: 'Initial state',
        summary: `Sistem dimulai dari |${'0'.repeat(numQubits)}⟩ sebelum gate pertama diterapkan.`,
        ket: formatKet(initialStatevector, numQubits),
        column: null,
        phenomena: [],
        statevector: initialStatevector.map((entry) => ({ ...entry })),
        blochData: initialBlochData.map((entry) => ({ ...entry })),
        blochCards: buildBlochCards(initialBlochData),
      },
      ...traceInternal.map((step, index) => ({
        stepIndex: index + 1,
        placementId: step.placementId,
        label: step.label,
        summary: step.summary,
        ket: step.ket,
        column: step.column,
        phenomena: [...step.phenomena],
        statevector: step.statevector.map((entry) => ({ ...entry })),
        blochData: step.blochData.map((entry) => ({ ...entry })),
        blochCards: buildBlochCards(step.blochData),
      })),
    ];

    const insightsMap = new Map<string, CircuitInsight>();
    const addInsight = (insight: CircuitInsight) => {
      if (!insightsMap.has(insight.title)) {
        insightsMap.set(insight.title, insight);
      }
    };

    if (orderedPlacements.length === 0) {
      addInsight({
        id: 'drag-gates',
        title: 'Mulai Dengan Menaruh Gate',
        description: 'Seret gate ke grid untuk melihat perubahan statevector, lintasan langkah, dan pola kuantum secara langsung.',
        tone: 'cyan',
      });
    } else {
      const allBlochSnapshots = [
        ...traceInternal.flatMap((step) => step.blochData),
        ...finalBlochData,
      ];

      if (allBlochSnapshots.some(isSuperposedQubit)) {
        addInsight({
          id: 'superposition',
          title: 'Superposisi Terdeteksi',
          description: 'Setidaknya satu qubit memiliki probabilitas |0⟩ dan |1⟩ yang sama-sama signifikan, sehingga state tidak lagi berada pada basis murni.',
          tone: 'cyan',
        });
      }

      if (orderedPlacements.some((placement) => PHASE_GATES.includes(placement.gate))) {
        addInsight({
          id: 'phase-rotation',
          title: 'Rotasi Fase Aktif',
          description: 'Rangkaian memuat gate fase yang tidak selalu mengubah probabilitas langsung, tetapi menggeser interferensi pada langkah berikutnya.',
          tone: 'amber',
        });
      }

      if (numQubits === 2 && finalStatevector.length === 4) {
        const [a, b, c, d] = finalStatevector;
        const determinant = complexSub(complexMul(a, d), complexMul(b, c));
        if (complexAbs(determinant) > EPSILON) {
          addInsight({
            id: 'entanglement',
            title: 'Entanglement Terdeteksi',
            description: 'Uji keadaan murni dua qubit menunjukkan state akhir tidak dapat dipisahkan menjadi hasil kali dua state tunggal.',
            tone: 'violet',
          });
        }
      }

      if (numQubits === 3) {
        const correlated = traceInternal.some((step) => {
          if (!TWO_QUBIT_GATES.includes(step.placement.gate)) return false;
          return step.blochData.some((bloch) => {
            const norm = Math.sqrt(bloch.x * bloch.x + bloch.y * bloch.y + bloch.z * bloch.z);
            return norm < 0.92;
          });
        });

        if (correlated) {
          addInsight({
            id: 'multi-qubit-correlation',
            title: 'Korelasi Multi-Qubit Meningkat',
            description: 'Sesudah interaksi dua qubit, ada qubit dengan vektor Bloch yang menyusut sehingga muncul indikasi korelasi nonlokal atau campuran parsial.',
            tone: 'violet',
          });
        }
      }

      traceInternal.forEach((step) => {
        const targetRow = step.placement.targetRow;
        if (
          (step.placement.gate === 'CNOT' || step.placement.gate === 'CPhase') &&
          targetRow !== undefined &&
          isSuperposedQubit(step.beforeBlochData[step.placement.row]) &&
          isNearMinusState(step.beforeBlochData[targetRow])
        ) {
          addInsight({
            id: 'phase-kickback',
            title: 'Heuristik Phase Kickback',
            description: `Sebelum ${step.placement.gate}, control q${step.placement.row} sudah berada dalam superposisi sementara target q${targetRow} mendekati |-⟩, sehingga fase dapat terpental kembali ke control.`,
            tone: 'violet',
          });
        }
      });
    }

    return {
      statevector: finalStatevector,
      blochData: finalBlochData,
      blochCards,
      trace: traceInternal.map(({ beforeBlochData: _beforeBlochData, placement: _placement, ...step }) => step),
      playbackFrames,
      insights: [...insightsMap.values()],
    };
  }, [numQubits, orderedPlacements]);

  return {
    numQubits,
    columnCount,
    placements,
    selectedPlacementId,
    selectedPlacement,
    canIncreaseQubits,
    canDecreaseQubits,
    statevector: simulation.statevector,
    blochData: simulation.blochData,
    blochCards: simulation.blochCards,
    trace: simulation.trace,
    playbackFrames: simulation.playbackFrames,
    insights: simulation.insights,
    setNumQubits,
    increaseQubits,
    decreaseQubits,
    addColumn,
    removeColumn,
    clearCircuit,
    placeGate,
    movePlacement,
    removePlacementAt,
    selectPlacement,
    updateSelectedAngle,
    updateSelectedTargetRow,
    canPlaceGate,
    getCellState,
    exportProjectData,
    exportCircuitCode,
  };
}

export type CircuitBuilderState = ReturnType<typeof useCircuitBuilder>;
