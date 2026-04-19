export interface Complex {
  re: number;
  im: number;
}

export interface QubitState {
  alpha: Complex;
  beta: Complex;
  theta: number;
  phi: number;
  label: string;
  ket: string;
}

export interface GateDefinition {
  name: string;
  symbol: string;
  matrix: Complex[][];
  description: string;
}

export const PI = Math.PI;
export const SQRT2 = Math.sqrt(2);

export const PRESET_STATES: QubitState[] = [
  {
    label: '|0⟩',
    ket: '|0⟩',
    theta: 0,
    phi: 0,
    alpha: { re: 1, im: 0 },
    beta: { re: 0, im: 0 },
  },
  {
    label: '|1⟩',
    ket: '|1⟩',
    theta: PI,
    phi: 0,
    alpha: { re: 0, im: 0 },
    beta: { re: 1, im: 0 },
  },
  {
    label: '|+⟩',
    ket: '(|0⟩ + |1⟩) / √2',
    theta: PI / 2,
    phi: 0,
    alpha: { re: 1 / SQRT2, im: 0 },
    beta: { re: 1 / SQRT2, im: 0 },
  },
  {
    label: '|−⟩',
    ket: '(|0⟩ − |1⟩) / √2',
    theta: PI / 2,
    phi: PI,
    alpha: { re: 1 / SQRT2, im: 0 },
    beta: { re: -1 / SQRT2, im: 0 },
  },
  {
    label: '|+i⟩',
    ket: '(|0⟩ + i|1⟩) / √2',
    theta: PI / 2,
    phi: PI / 2,
    alpha: { re: 1 / SQRT2, im: 0 },
    beta: { re: 0, im: 1 / SQRT2 },
  },
  {
    label: '|−i⟩',
    ket: '(|0⟩ − i|1⟩) / √2',
    theta: PI / 2,
    phi: 3 * PI / 2,
    alpha: { re: 1 / SQRT2, im: 0 },
    beta: { re: 0, im: -1 / SQRT2 },
  },
];

export const GATES: GateDefinition[] = [
  {
    name: 'Hadamard',
    symbol: 'H',
    matrix: [
      [{ re: 1 / SQRT2, im: 0 }, { re: 1 / SQRT2, im: 0 }],
      [{ re: 1 / SQRT2, im: 0 }, { re: -1 / SQRT2, im: 0 }],
    ],
    description: 'Creates superposition from |0⟩ or |1⟩',
  },
  {
    name: 'Pauli-X',
    symbol: 'X',
    matrix: [
      [{ re: 0, im: 0 }, { re: 1, im: 0 }],
      [{ re: 1, im: 0 }, { re: 0, im: 0 }],
    ],
    description: 'Bit flip — like classical NOT gate',
  },
  {
    name: 'Pauli-Y',
    symbol: 'Y',
    matrix: [
      [{ re: 0, im: 0 }, { re: 0, im: -1 }],
      [{ re: 0, im: 1 }, { re: 0, im: 0 }],
    ],
    description: 'Bit + phase flip',
  },
  {
    name: 'Pauli-Z',
    symbol: 'Z',
    matrix: [
      [{ re: 1, im: 0 }, { re: 0, im: 0 }],
      [{ re: 0, im: 0 }, { re: -1, im: 0 }],
    ],
    description: 'Phase flip — adds − sign to |1⟩',
  },
  {
    name: 'S Gate',
    symbol: 'S',
    matrix: [
      [{ re: 1, im: 0 }, { re: 0, im: 0 }],
      [{ re: 0, im: 0 }, { re: 0, im: 1 }],
    ],
    description: 'π/2 phase gate — S = Z^(1/2)',
  },
  {
    name: 'T Gate',
    symbol: 'T',
    matrix: [
      [{ re: 1, im: 0 }, { re: 0, im: 0 }],
      [{ re: 0, im: 0 }, { re: Math.cos(PI / 4), im: Math.sin(PI / 4) }],
    ],
    description: 'π/4 phase gate — T = Z^(1/4)',
  },
];

export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function applyGate(state: QubitState, gate: GateDefinition): QubitState {
  const newAlpha = complexAdd(
    complexMul(gate.matrix[0][0], state.alpha),
    complexMul(gate.matrix[0][1], state.beta)
  );
  const newBeta = complexAdd(
    complexMul(gate.matrix[1][0], state.alpha),
    complexMul(gate.matrix[1][1], state.beta)
  );

  const norm = Math.sqrt(newAlpha.re ** 2 + newAlpha.im ** 2 + newBeta.re ** 2 + newBeta.im ** 2);
  const normAlpha = { re: newAlpha.re / norm, im: newAlpha.im / norm };
  const normBeta = { re: newBeta.re / norm, im: newBeta.im / norm };

  const newTheta = 2 * Math.atan2(Math.sqrt(normBeta.re ** 2 + normBeta.im ** 2), Math.sqrt(normAlpha.re ** 2 + normAlpha.im ** 2));
  const phaseAlpha = Math.atan2(normAlpha.im, normAlpha.re);
  const phaseBeta = Math.atan2(normBeta.im, normBeta.re);
  const newPhi = phaseBeta - phaseAlpha;

  const pZero = normAlpha.re ** 2 + normAlpha.im ** 2;
  const pOne = normBeta.re ** 2 + normBeta.im ** 2;

  let newLabel = 'ψ';
  if (pZero > 0.999) newLabel = '|0⟩';
  else if (pOne > 0.999) newLabel = '|1⟩';
  else if (Math.abs(newTheta - PI / 2) < 0.05) {
    if (Math.abs(newPhi) < 0.05 || Math.abs(newPhi - 2 * PI) < 0.05) newLabel = '|+⟩';
    else if (Math.abs(newPhi - PI) < 0.05) newLabel = '|−⟩';
    else if (Math.abs(newPhi - PI / 2) < 0.05) newLabel = '|+i⟩';
    else if (Math.abs(newPhi - 3 * PI / 2) < 0.05) newLabel = '|−i⟩';
  }

  return {
    alpha: normAlpha,
    beta: normBeta,
    theta: newTheta,
    phi: ((newPhi % (2 * PI)) + 2 * PI) % (2 * PI),
    label: newLabel,
    ket: buildKetNotation(normAlpha, normBeta),
  };
}

function buildKetNotation(alpha: Complex, beta: Complex): string {
  const magAlpha = Math.sqrt(alpha.re ** 2 + alpha.im ** 2);
  const magBeta = Math.sqrt(beta.re ** 2 + beta.im ** 2);
  const phaseAlpha = Math.atan2(alpha.im, alpha.re);
  const phaseBeta = Math.atan2(beta.im, beta.re);

  const formatCoeff = (mag: number, phase: number, isBeta: boolean): string => {
    if (mag < 0.001) return '';
    const isNeg = isBeta && phase > PI;
    const absPhase = isNeg ? 2 * PI - phase : phase;
    let result = '';
    if (Math.abs(mag - 1 / SQRT2) < 0.01) result = '1/√2';
    else if (Math.abs(mag - 1) < 0.01) result = '1';
    else if (Math.abs(mag - 0.5) < 0.01) result = '1/2';
    else result = mag.toFixed(2);

    if (absPhase > 0.01 && absPhase < PI - 0.01) {
      const phaseStr = absPhase.toFixed(2);
      if (isNeg) {
        result = `(${result}·e^(-i·${phaseStr}))`;
      } else {
        result = `(${result}·e^(i·${phaseStr}))`;
      }
    }
    return result;
  };

  const aStr = formatCoeff(magAlpha, phaseAlpha, false);
  const bStr = formatCoeff(magBeta, phaseBeta, true);

  if (bStr === '') return aStr === '1' ? '|0⟩' : `${aStr}|0⟩`;
  if (aStr === '') return bStr === '1' ? '|1⟩' : `${bStr}|1⟩`;
  if (aStr === bStr) return `${aStr}(|0⟩ + |1⟩)`;
  if (aStr === `(${bStr})`) return `${bStr}(|0⟩ + |1⟩)`;
  return `α|0⟩ + β|1⟩`;
}

export function stateToBlochCoords(state: QubitState): { x: number; y: number; z: number } {
  const x = Math.sin(state.theta) * Math.cos(state.phi);
  const y = Math.sin(state.theta) * Math.sin(state.phi);
  const z = Math.cos(state.theta);
  return { x, y, z };
}
