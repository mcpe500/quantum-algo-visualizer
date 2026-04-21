import type { QFTAnimationPayload } from '../../../types/qft';

export interface PhaseCascadeSubStep {
  phase: 'init' | 'hadamard' | 'controlled_r' | 'swap';
  gate: string;
  angle: number;
  controlQubit?: number;
  detail: string;
}

export interface PhaseCascadeRow {
  qubitIndex: number;
  stepNumber: number;
  intro: string;
  subSteps: PhaseCascadeSubStep[];
  accumulatedPhase: number;
  gateSequence: string;
}

export interface PhaseCascadeModel {
  nQubits: number;
  signalType: string;
  intro: string;
  overviewBlock: {
    label: string;
    totalGates: number;
    complexity: string;
  };
  rows: PhaseCascadeRow[];
  activeQubit: number | null;
}

export function buildPhaseCascadeModel(
  data: QFTAnimationPayload,
  activeQubit: number | null,
): PhaseCascadeModel {
  const n = data.n_qubits;
  const rows: PhaseCascadeRow[] = [];

  for (let j = 0; j < n; j++) {
    const subSteps: PhaseCascadeSubStep[] = [];
    let accumulatedPhase = 0;

    subSteps.push({
      phase: 'init',
      gate: 'Load',
      angle: 0,
      detail: `Initialize qubit ${j} with signal amplitude`,
    });

    for (let k = j + 1; k < n; k++) {
      const angle = Math.PI / Math.pow(2, k - j);
      accumulatedPhase += angle;
      subSteps.push({
        phase: 'controlled_r',
        gate: `CR_${k - j + 1}`,
        angle: angle,
        controlQubit: k,
        detail: `Controlled rotation by π/2^${k - j} = ${((angle * 180) / Math.PI).toFixed(1)}°`,
      });
    }

    subSteps.push({
      phase: 'hadamard',
      gate: 'H',
      angle: 0,
      detail: 'Convert accumulated phase into Fourier-basis interference',
    });

    if (j < n / 2) {
      subSteps.push({
        phase: 'swap',
        gate: 'SWAP',
        angle: 0,
        detail: `Swap with qubit ${n - j - 1} for bit reversal`,
      });
    }

    const gateSequence = subSteps
      .map((s) => s.gate)
      .join(' → ');

    rows.push({
      qubitIndex: j,
      stepNumber: j + 1,
      intro: `Qubit ${j} menyerap akumulasi fase dari kontrol di atasnya, lalu Hadamard mengubah fase itu menjadi pola interferensi. Total fase relatif: ${((accumulatedPhase * 180) / Math.PI).toFixed(1)}°.`,
      subSteps,
      accumulatedPhase,
      gateSequence,
    });
  }

  const hadamardCount = n;
  const controlledRCount = (n * (n - 1)) / 2;
  const swapCount = Math.floor(n / 2);
  const totalGates = hadamardCount + controlledRCount + swapCount;

  return {
    nQubits: n,
    signalType: data.signal_type,
    intro: `${n}-qubit QFT transforms ${Math.pow(2, n)} time-domain samples into frequency spectrum via phase cascade. Total gates: ${hadamardCount} Hadamard + ${controlledRCount} controlled-phase + ${swapCount} SWAP.`,
    overviewBlock: {
      label: `${n}-Qubit QFT`,
      totalGates,
      complexity: `Quantum: O(log²N)=O(${n}²) vs Classical FFT: O(N log N)=O(${Math.pow(2, n)}·${n})`,
    },
    rows,
    activeQubit,
  };
}
