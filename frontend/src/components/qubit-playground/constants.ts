import type { Complex } from './types';

export interface GateDefinition {
  name: string;
  symbol: string;
  matrix: Complex[][];
  isParametric?: boolean;
  numQubits: number;
}

export interface ScenarioStep {
  gate: string;
  targets: number[];
  angle?: number;
}

// ============================================================================
// COMPLEX NUMBER OPERATIONS
// ============================================================================

export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function complexNorm(c: Complex): number {
  return Math.sqrt(c.re * c.re + c.im * c.im);
}

export function complexConj(c: Complex): Complex {
  return { re: c.re, im: -c.im };
}

export function complexSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function complexExp(c: Complex): Complex {
  const expRe = Math.exp(c.re);
  return { re: expRe * Math.cos(c.im), im: expRe * Math.sin(c.im) };
}

// ============================================================================
// GATE DEFINITIONS
// ============================================================================

const I: Complex[][] = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
];

export const H: Complex[][] = [
  [{ re: 1 / Math.sqrt(2), im: 0 }, { re: 1 / Math.sqrt(2), im: 0 }],
  [{ re: 1 / Math.sqrt(2), im: 0 }, { re: -1 / Math.sqrt(2), im: 0 }],
];

export const X: Complex[][] = [
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
];

export const Y: Complex[][] = [
  [{ re: 0, im: 0 }, { re: 0, im: -1 }],
  [{ re: 0, im: 1 }, { re: 0, im: 0 }],
];

export const Z: Complex[][] = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: -1, im: 0 }],
];

export const S: Complex[][] = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: 1 }],
];

export const T: Complex[][] = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [
    { re: 0, im: 0 },
    { re: 1 / Math.sqrt(2), im: 1 / Math.sqrt(2) },
  ],
];

export function Rx(theta: number): Complex[][] {
  const c = Math.cos(theta / 2);
  const s = Math.sin(theta / 2);
  return [
    [{ re: c, im: 0 }, { re: 0, im: -s }],
    [{ re: 0, im: -s }, { re: c, im: 0 }],
  ];
}

export function Ry(theta: number): Complex[][] {
  const c = Math.cos(theta / 2);
  const s = Math.sin(theta / 2);
  return [
    [{ re: c, im: 0 }, { re: -s, im: 0 }],
    [{ re: s, im: 0 }, { re: c, im: 0 }],
  ];
}

export function Rz(theta: number): Complex[][] {
  const e1 = complexExp({ re: 0, im: -theta / 2 });
  const e2 = complexExp({ re: 0, im: theta / 2 });
  return [
    [e1, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, e2],
  ];
}

export const CNOT: Complex[][] = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }],
];

export function CPhase(theta: number): Complex[][] {
  const phase = complexExp({ re: 0, im: theta });
  return [
    [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }],
    [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, phase],
  ];
}

export const SWAP: Complex[][] = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }],
];

export const SINGLE_GATES: { [key: string]: Complex[][] } = {
  H,
  X,
  Y,
  Z,
  S,
  T,
};

export const PARAMETRIC_GATES: { [key: string]: (theta: number) => Complex[][] } = {
  Rx,
  Ry,
  Rz,
};

export const TWO_QUBIT_GATES: { [key: string]: Complex[][] | ((theta: number) => Complex[][]) } = {
  CNOT,
  SWAP,
  CPhase,
};

// ============================================================================
// MATRIX OPERATIONS
// ============================================================================

export function matrixVecMul(matrix: Complex[][], vec: Complex[]): Complex[] {
  const n = vec.length;
  const result: Complex[] = new Array(n).fill(null).map(() => ({ re: 0, im: 0 }));

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (j < n) {
        result[i] = complexAdd(result[i], complexMul(matrix[i][j], vec[j]));
      }
    }
  }

  return result;
}

export function tensorProduct(A: Complex[][], B: Complex[][]): Complex[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;

  const result: Complex[][] = [];
  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < rowsB; k++) {
      const row: Complex[] = [];
      for (let j = 0; j < colsA; j++) {
        for (let l = 0; l < colsB; l++) {
          row.push(complexMul(A[i][j], B[k][l]));
        }
      }
      result.push(row);
    }
  }

  return result;
}

export function embedGate1Q(gate: Complex[][], targetQubit: number, numQubits: number): Complex[][] {
  let result: Complex[][] = gate;

  for (let i = 0; i < numQubits; i++) {
    if (i === targetQubit) continue;
    result = tensorProduct(result, I);
  }

  return result;
}

export function embedGate2Q(
  gate: Complex[][],
  control: number,
  target: number,
  numQubits: number
): Complex[][] {
  const sortedIndices = [control, target].sort((a, b) => b - a);

  let result = gate;

  for (let i = numQubits - 1; i >= 0; i--) {
    if (i === sortedIndices[0] || i === sortedIndices[1]) continue;
    result = tensorProduct(result, I);
  }

  return result;
}

// ============================================================================
// STATE CALCULATIONS
// ============================================================================

export function applyGateToState(statevector: Complex[], gateMatrix: Complex[][]): Complex[] {
  return matrixVecMul(gateMatrix, statevector);
}

export function partialTrace(
  statevector: Complex[],
  qubitIndex: number,
  numQubits: number
): { theta: number; phi: number } {
  const dim = 2;
  const otherQubits = numQubits - 1;
  const stateLen = statevector.length;

  const rho = Array(dim)
    .fill(null)
    .map(() => Array(dim).fill(null).map(() => ({ re: 0, im: 0 })));

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      for (let k = 0; k < Math.pow(dim, otherQubits); k++) {
        const idx0 = getStateIndex([i, k], qubitIndex, numQubits, dim);
        const idx1 = getStateIndex([j, k], qubitIndex, numQubits, dim);

        const stateIdx0 = idx0 < stateLen ? idx0 : 0;
        const stateIdx1 = idx1 < stateLen ? idx1 : 0;

        const c0 = statevector[stateIdx0] || { re: 0, im: 0 };
        const c1 = complexConj(statevector[stateIdx1] || { re: 0, im: 0 });

        rho[i][j] = complexAdd(rho[i][j], complexMul(c0, c1));
      }
    }
  }

  const rho01Real = rho[0][1].re;
  const rho01Imag = rho[0][1].im;

  const pZero = rho[0][0].re;
  const pOne = rho[1][1].re;

  const traceVal = pZero + pOne;
  const normalizedPZero = traceVal > 0 ? pZero / traceVal : 0.5;

  const theta = 2 * Math.acos(Math.sqrt(Math.max(0, Math.min(1, normalizedPZero))));
  let phi = 0;
  if (Math.abs(rho01Real) > 1e-10 || Math.abs(rho01Imag) > 1e-10) {
    phi = Math.atan2(rho01Imag, rho01Real);
  }

  return { theta, phi };
}

function getStateIndex(indices: number[], qubitIndex: number, numQubits: number, dim: number): number {
  let result = 0;
  for (let q = numQubits - 1; q >= 0; q--) {
    if (q === qubitIndex) {
      result = result * dim + indices[0];
    } else {
      result = result * dim + indices[1];
    }
  }
  return result;
}

function getBit(index: number, qubitIndex: number, numQubits: number): number {
  return (index >> (numQubits - 1 - qubitIndex)) & 1;
}

export function marginalProb(
  statevector: Complex[],
  qubitIndex: number,
  numQubits: number
): { pZero: number; pOne: number } {
  let pZero = 0;
  let pOne = 0;

  for (let i = 0; i < statevector.length; i++) {
    const bit = getBit(i, qubitIndex, numQubits);
    const prob = statevector[i].re * statevector[i].re + statevector[i].im * statevector[i].im;

    if (bit === 0) {
      pZero += prob;
    } else {
      pOne += prob;
    }
  }

  return { pZero: Math.max(0, Math.min(1, pZero)), pOne: Math.max(0, Math.min(1, pOne)) };
}

export function blochCoords(
  statevector: Complex[],
  qubitIndex: number,
  numQubits: number
): { x: number; y: number; z: number; theta: number; phi: number } {
  const { theta, phi } = partialTrace(statevector, qubitIndex, numQubits);

  const sinTheta = Math.sin(theta);
  const x = sinTheta * Math.cos(phi);
  const y = sinTheta * Math.sin(phi);
  const z = Math.cos(theta);

  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
    z: Math.max(-1, Math.min(1, z)),
    theta,
    phi,
  };
}

// ============================================================================
// INITIAL STATES
// ============================================================================

export function getInitialState(numQubits: number): Complex[] {
  const size = Math.pow(2, numQubits);
  const state: Complex[] = new Array(size).fill(null).map(() => ({ re: 0, im: 0 }));
  state[0] = { re: 1, im: 0 };
  return state;
}

// ============================================================================
// EDUCATIONAL SCENARIOS
// ============================================================================

export const SCENARIOS: { name: string; description: string; steps: ScenarioStep[] }[] = [
  {
    name: 'Phase Kickback',
    description: 'Demonstrates phase kickback effect used in Deutsch-Jozsa algorithm',
    steps: [
      { gate: 'X', targets: [1] },
      { gate: 'H', targets: [1] },
      { gate: 'CNOT', targets: [0, 1] },
    ],
  },
  {
    name: 'Bell State',
    description: 'Creates maximal entanglement between two qubits',
    steps: [
      { gate: 'H', targets: [0] },
      { gate: 'CNOT', targets: [0, 1] },
    ],
  },
  {
    name: 'QFT Core',
    description: 'Core interference pattern for Quantum Fourier Transform',
    steps: [
      { gate: 'H', targets: [0] },
      { gate: 'CPhase', targets: [0, 1], angle: Math.PI / 2 },
      { gate: 'H', targets: [1] },
    ],
  },
  {
    name: 'VQE Ansatz',
    description: 'Simple variational ansatz for VQE experiments',
    steps: [
      { gate: 'Ry', targets: [0], angle: Math.PI / 4 },
      { gate: 'Ry', targets: [1], angle: Math.PI / 4 },
      { gate: 'CNOT', targets: [0, 1] },
    ],
  },
  {
    name: 'QAOA Mixer',
    description: 'Mixer Hamiltonian evolution for QAOA',
    steps: [
      { gate: 'H', targets: [0] },
      { gate: 'H', targets: [1] },
      { gate: 'Rz', targets: [0], angle: Math.PI / 4 },
      { gate: 'CNOT', targets: [0, 1] },
    ],
  },
];

// ============================================================================
// GATE CATALOG
// ============================================================================

export const GATE_CATALOG: GateDefinition[] = [
  { name: 'H', symbol: 'H', matrix: H, numQubits: 1 },
  { name: 'X', symbol: 'X', matrix: X, numQubits: 1 },
  { name: 'Y', symbol: 'Y', matrix: Y, numQubits: 1 },
  { name: 'Z', symbol: 'Z', matrix: Z, numQubits: 1 },
  { name: 'S', symbol: 'S', matrix: S, numQubits: 1 },
  { name: 'T', symbol: 'T', matrix: T, numQubits: 1 },
  { name: 'Rx', symbol: 'Rx', matrix: Rx(0), isParametric: true, numQubits: 1 },
  { name: 'Ry', symbol: 'Ry', matrix: Ry(0), isParametric: true, numQubits: 1 },
  { name: 'Rz', symbol: 'Rz', matrix: Rz(0), isParametric: true, numQubits: 1 },
  { name: 'CNOT', symbol: 'CX', matrix: CNOT, numQubits: 2 },
  { name: 'CPhase', symbol: 'CP', matrix: CPhase(0), isParametric: true, numQubits: 2 },
  { name: 'SWAP', symbol: 'SWAP', matrix: SWAP, numQubits: 2 },
];