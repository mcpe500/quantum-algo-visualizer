import type { ComputationConfig } from '../types';
import { createSymbolicComputationConfig } from '../engine';

export const FORMULA_COMPUTATION_MAP: Record<string, ComputationConfig> = {
  'dj-classical-bound': createSymbolicComputationConfig({
    requiresParams: ['n'],
    initialExpression: '2^(n-1)+1',
    stepsPlan: [
      { kind: 'parse', explanation: 'Ekspresi batas query klasik dibentuk dari 2^(n-1)+1.' },
      { kind: 'substitute', explanation: 'Substitusi nilai n ke dalam ekspresi.' },
      { kind: 'simplify', explanation: 'Sederhanakan bentuk aljabar setelah substitusi.' },
      { kind: 'evaluate', explanation: 'Hitung nilai batas query klasik.' },
    ],
  }),

  'qft-gate-count': createSymbolicComputationConfig({
    requiresParams: ['n'],
    initialExpression: 'n*(n+1)/2',
    stepsPlan: [
      { kind: 'parse', explanation: 'Jumlah gerbang QFT mengikuti ekspresi n*(n+1)/2.' },
      { kind: 'substitute', explanation: 'Substitusi jumlah qubit n.' },
      { kind: 'simplify', explanation: 'Sederhanakan hasil perkalian dan pembagian.' },
      { kind: 'evaluate', explanation: 'Hitung jumlah total gerbang.' },
    ],
  }),

  'acceptance-probability': createSymbolicComputationConfig({
    requiresParams: ['dE', 'T'],
    initialExpression: 'exp(-dE/T)',
    stepsPlan: [
      { kind: 'parse', explanation: 'Gunakan model Boltzmann P = exp(-dE/T).' },
      { kind: 'substitute', explanation: 'Substitusi nilai dE dan T dari eksperimen.' },
      { kind: 'simplify', explanation: 'Sederhanakan eksponen termal.' },
      { kind: 'evaluate', explanation: 'Hitung probabilitas acceptance.' },
    ],
  }),

  'maxcut-cost-function': createSymbolicComputationConfig({
    requiresParams: ['zi', 'zj'],
    initialExpression: '(1-zi*zj)/2',
    stepsPlan: [
      { kind: 'parse', explanation: 'Satu edge Max-Cut dinilai dengan (1 - zi*zj)/2.' },
      { kind: 'substitute', explanation: 'Substitusi spin node zi dan zj (±1).' },
      { kind: 'simplify', explanation: 'Sederhanakan ekspresi untuk edge ini.' },
      { kind: 'evaluate', explanation: 'Hitung kontribusi cost edge.' },
    ],
  }),

  'variational-energy': createSymbolicComputationConfig({
    requiresParams: ['c1', 'p1', 'c2', 'p2', 'c3', 'p3'],
    initialExpression: 'c1*p1 + c2*p2 + c3*p3',
    stepsPlan: [
      { kind: 'parse', explanation: 'Energi variational diproksikan sebagai penjumlahan c_l * <P_l>.' },
      { kind: 'substitute', explanation: 'Substitusi tiga suku koefisien dan ekspektasi Pauli.' },
      { kind: 'simplify', explanation: 'Sederhanakan hasil penjumlahan linear.' },
      { kind: 'evaluate', explanation: 'Hitung estimasi energi variational.' },
    ],
  }),

  'normalization-constant': createSymbolicComputationConfig({
    requiresParams: ['x0', 'x1', 'x2'],
    initialExpression: 'sqrt(x0^2 + x1^2 + x2^2)',
    stepsPlan: [
      { kind: 'parse', explanation: 'Konstanta normalisasi dihitung dari akar jumlah kuadrat komponen.' },
      { kind: 'substitute', explanation: 'Substitusi komponen amplitudo x0, x1, x2.' },
      { kind: 'simplify', explanation: 'Sederhanakan kuadrat dan penjumlahan komponen.' },
      { kind: 'evaluate', explanation: 'Hitung konstanta normalisasi C.' },
    ],
  }),

  'oracle-unitary': createSymbolicComputationConfig({
    requiresParams: ['x', 'y', 'f'],
    initialExpression: 'mod(x+y*f, 2)',
    stepsPlan: [
      { kind: 'parse', explanation: 'Operasi oracle unitary: |x⟩|y⟩ → |x⟩|y ⊕ f(x)⟩.' },
      { kind: 'substitute', explanation: 'Substitusi nilai x (input), y (ancilla), dan f(x) (output oracle).' },
      { kind: 'simplify', explanation: 'Sederhanakan ekspresi modulo 2.' },
      { kind: 'evaluate', explanation: 'Hitung output ancilla setelah operasi oracle.' },
    ],
  }),

  'dj-phase-kickback': createSymbolicComputationConfig({
    requiresParams: ['f'],
    initialExpression: '2*f - 1',
    stepsPlan: [
      { kind: 'parse', explanation: 'Phase kickback: untuk f(x)=0 menghasilkan fase +1, f(x)=1 menghasilkan fase -1.' },
      { kind: 'substitute', explanation: 'Substitusi nilai f(x) (output oracle, 0 atau 1).' },
      { kind: 'simplify', explanation: 'Sederhanakan ekspresi 2f-1.' },
      { kind: 'evaluate', explanation: 'Hitung eigenvalue fase: +1 atau -1.' },
    ],
  }),

  'plus-minus-states': createSymbolicComputationConfig({
    requiresParams: ['t'],
    initialExpression: '1/sqrt(2)',
    stepsPlan: [
      { kind: 'parse', explanation: 'Amplitudo keadaan |+⟩ dan |−⟩ sama yaitu 1/√2.' },
      { kind: 'substitute', explanation: 'Parameter t tidak mempengaruhi nilai amplitudo (0 atau 1 untuk jenis keadaan).' },
      { kind: 'simplify', explanation: 'Nilai 1/√2 adalah konstanta normalisasi.' },
      { kind: 'evaluate', explanation: 'Hitung nilai amplitudo: 0.7071...' },
    ],
  }),

  'qft-twiddle-factor': createSymbolicComputationConfig({
    requiresParams: ['j', 'k', 'n'],
    initialExpression: 'exp(-6.28318530718*j*k / 2^n)',
    stepsPlan: [
      { kind: 'parse', explanation: 'Twiddle factor: ω^jk = e^(-2πijk/N) dengan N=2^n.' },
      { kind: 'substitute', explanation: 'Substitusi indeks j, k, dan jumlah qubit n.' },
      { kind: 'simplify', explanation: 'Hitung eksponen dengan 2π ≈ 6.28318530718.' },
      { kind: 'evaluate', explanation: 'Hitung nilai fase twiddle factor.' },
    ],
  }),
};
