import type { CanvasConnection, CanvasNodeData, CanvasState } from '../studio/canvas-types';

export interface FormulaStudioFlowStep {
  id: string;
  title: string;
  description: string;
  nodeIds: string[];
  connectionIds: string[];
}

export interface FormulaStudioScenario {
  id: string;
  title: string;
  algorithm: 'dj' | 'qft' | 'vqe' | 'qaoa';
  description: string;
  state: CanvasState;
  flowSteps: FormulaStudioFlowStep[];
}

function formulaNode(id: string, formulaId: string, x: number, y: number): CanvasNodeData {
  return {
    id,
    kind: 'formula',
    formulaId,
    position: { x, y },
    width: 280,
    height: 120,
  };
}

function inputNode(id: string, varName: string, varValue: string, x: number, y: number): CanvasNodeData {
  return {
    id,
    kind: 'input',
    position: { x, y },
    width: 220,
    height: 90,
    varName,
    varValue,
  };
}

function expressionNode(id: string, expression: string, x: number, y: number): CanvasNodeData {
  return {
    id,
    kind: 'expression',
    position: { x, y },
    width: 260,
    height: 110,
    nodeExpression: expression,
  };
}

function connection(id: string, fromId: string, toId: string, relationType: string, label: string, toPort?: string): CanvasConnection {
  return { id, fromId, toId, relationType, label, toPort };
}

function scenarioState(nodes: CanvasNodeData[], connections: CanvasConnection[]): CanvasState {
  return {
    nodes,
    connections,
    selectedNodeId: null,
    selectedConnectionId: null,
    panOffset: { x: 24, y: 24 },
    zoom: 0.9,
  };
}

export const FORMULA_STUDIO_SCENARIOS: FormulaStudioScenario[] = [
  {
    id: 'studio-dj-phase-kickback',
    title: 'Deutsch-Jozsa: Oracle → Phase Kickback',
    algorithm: 'dj',
    description: 'Canvas siap pakai untuk melihat alur oracle, ancilla |−⟩, phase kickback, dan batas query klasik.',
    state: scenarioState(
      [
        inputNode('dj-input-n', 'n', '4', 0, 40),
        inputNode('dj-input-x', 'x', '1', 0, 160),
        inputNode('dj-input-y', 'y', '0', 0, 280),
        inputNode('dj-input-f', 'f', '1', 0, 400),
        inputNode('dj-input-t', 't', '1', 0, 520),
        formulaNode('dj-hadamard', 'h-gate-matrix', 320, 40),
        formulaNode('dj-plus-minus', 'plus-minus-states', 320, 200),
        formulaNode('dj-oracle-function-node', 'dj-oracle-function', 320, 360),
        formulaNode('dj-oracle-unitary-node', 'oracle-unitary', 660, 240),
        formulaNode('dj-phase-node', 'dj-phase-kickback', 1000, 240),
        formulaNode('dj-classical-bound-node', 'dj-classical-bound', 660, 40),
        expressionNode('dj-speedup-expression', '2^(n-1)+1', 1000, 40),
      ],
      [
        connection('dj-c1', 'dj-input-n', 'dj-classical-bound-node', 'feeds-into', 'n', 'n'),
        connection('dj-c2', 'dj-classical-bound-node', 'dj-speedup-expression', 'result', 'batas query'),
        connection('dj-c3', 'dj-hadamard', 'dj-plus-minus', 'implements', 'membentuk |−⟩'),
        connection('dj-c4', 'dj-plus-minus', 'dj-oracle-unitary-node', 'uses', 'ancilla'),
        connection('dj-c5', 'dj-oracle-function-node', 'dj-oracle-unitary-node', 'encoded-in', 'f(x)'),
        connection('dj-c6', 'dj-oracle-unitary-node', 'dj-phase-node', 'implements', 'kickback'),
        connection('dj-c7', 'dj-input-f', 'dj-phase-node', 'feeds-into', 'f', 'f'),
        connection('dj-c8', 'dj-input-x', 'dj-oracle-unitary-node', 'feeds-into', 'x', 'x'),
        connection('dj-c9', 'dj-input-y', 'dj-oracle-unitary-node', 'feeds-into', 'y', 'y'),
        connection('dj-c10', 'dj-input-t', 'dj-plus-minus', 'feeds-into', 't', 't'),
      ]
    ),
    flowSteps: [
      { id: 'dj-flow-1', title: 'Parameter masuk', description: 'Nilai n, x, y, f, dan t menjadi sinyal numerik yang mengaktifkan node formula terkait.', nodeIds: ['dj-input-n', 'dj-input-x', 'dj-input-y', 'dj-input-f', 'dj-input-t'], connectionIds: ['dj-c1', 'dj-c7', 'dj-c8', 'dj-c9', 'dj-c10'] },
      { id: 'dj-flow-2', title: 'Ancilla disiapkan', description: 'Hadamard membentuk basis |+⟩ dan |−⟩. Node plus-minus menghitung amplitudo normalisasi 1/√2.', nodeIds: ['dj-hadamard', 'dj-plus-minus'], connectionIds: ['dj-c3', 'dj-c10'] },
      { id: 'dj-flow-3', title: 'Oracle reversibel bekerja', description: 'Fungsi klasik dikemas ke operator unitary sehingga nilai f(x) dapat masuk ke sirkuit kuantum.', nodeIds: ['dj-oracle-function-node', 'dj-oracle-unitary-node', 'dj-input-x', 'dj-input-y'], connectionIds: ['dj-c4', 'dj-c5', 'dj-c8', 'dj-c9'] },
      { id: 'dj-flow-4', title: 'Phase kickback terlihat', description: 'Nilai f mengubah tanda fase. Jika f=1, hasil fase menjadi -1; jika f=0, fase tetap +1.', nodeIds: ['dj-input-f', 'dj-phase-node'], connectionIds: ['dj-c6', 'dj-c7'] },
      { id: 'dj-flow-5', title: 'Batas query klasik dibandingkan', description: 'Nilai n mengalir ke rumus 2^(n-1)+1 sehingga Studio menampilkan batas query klasik untuk pembanding.', nodeIds: ['dj-input-n', 'dj-classical-bound-node', 'dj-speedup-expression'], connectionIds: ['dj-c1', 'dj-c2'] },
    ],
  },
  {
    id: 'studio-qft-circuit-flow',
    title: 'QFT: DFT → Twiddle Factor → Gate Count',
    algorithm: 'qft',
    description: 'Canvas siap pakai untuk membandingkan DFT klasik, definisi QFT, faktor fase, konstruksi sirkuit, dan jumlah gerbang.',
    state: scenarioState(
      [
        inputNode('qft-input-n', 'n', '4', 0, 80),
        inputNode('qft-input-j', 'j', '1', 0, 220),
        inputNode('qft-input-k', 'k', '2', 0, 340),
        formulaNode('qft-dft', 'dft-definition', 320, 60),
        formulaNode('qft-definition-node', 'qft-definition', 660, 60),
        formulaNode('qft-twiddle-node', 'qft-twiddle-factor', 660, 240),
        formulaNode('qft-crk-node', 'crk-gate-matrix', 1000, 240),
        formulaNode('qft-circuit-node', 'qft-circuit-construction', 1000, 60),
        formulaNode('qft-gate-count-node', 'qft-gate-count', 660, 420),
        expressionNode('qft-gate-expression', 'n*(n+1)/2', 1000, 420),
      ],
      [
        connection('qft-c1', 'qft-dft', 'qft-definition-node', 'quantum-version', 'versi kuantum'),
        connection('qft-c2', 'qft-definition-node', 'qft-twiddle-node', 'uses', 'fase'),
        connection('qft-c3', 'qft-twiddle-node', 'qft-crk-node', 'implements', 'rotasi'),
        connection('qft-c4', 'qft-crk-node', 'qft-circuit-node', 'used-in', 'sirkuit'),
        connection('qft-c5', 'qft-input-n', 'qft-gate-count-node', 'feeds-into', 'n', 'n'),
        connection('qft-c6', 'qft-input-j', 'qft-twiddle-node', 'feeds-into', 'j', 'j'),
        connection('qft-c7', 'qft-input-k', 'qft-twiddle-node', 'feeds-into', 'k', 'k'),
        connection('qft-c8', 'qft-gate-count-node', 'qft-gate-expression', 'result', 'jumlah'),
      ]
    ),
    flowSteps: [
      { id: 'qft-flow-1', title: 'DFT menjadi QFT', description: 'Studio menampilkan transisi konsep dari transformasi Fourier klasik ke transformasi pada basis kuantum.', nodeIds: ['qft-dft', 'qft-definition-node'], connectionIds: ['qft-c1'] },
      { id: 'qft-flow-2', title: 'Indeks fase masuk', description: 'Nilai j, k, dan n mengalir ke twiddle factor untuk membentuk fase kompleks QFT.', nodeIds: ['qft-input-j', 'qft-input-k', 'qft-input-n', 'qft-twiddle-node'], connectionIds: ['qft-c5', 'qft-c6', 'qft-c7'] },
      { id: 'qft-flow-3', title: 'Fase menjadi gerbang rotasi', description: 'Twiddle factor dipetakan ke controlled rotation sehingga flow konseptual berubah menjadi konstruksi sirkuit.', nodeIds: ['qft-twiddle-node', 'qft-crk-node', 'qft-circuit-node'], connectionIds: ['qft-c2', 'qft-c3', 'qft-c4'] },
      { id: 'qft-flow-4', title: 'Jumlah gerbang dihitung', description: 'Nilai n mengaktifkan formula n*(n+1)/2 untuk memperlihatkan kompleksitas gerbang QFT.', nodeIds: ['qft-input-n', 'qft-gate-count-node', 'qft-gate-expression'], connectionIds: ['qft-c5', 'qft-c8'] },
    ],
  },
  {
    id: 'studio-vqe-energy-estimation',
    title: 'VQE: Hamiltonian → Energi Variational',
    algorithm: 'vqe',
    description: 'Canvas siap pakai untuk melihat rantai Hamiltonian, ekspektasi energi, target ground state, dan baseline FCI.',
    state: scenarioState(
      [
        inputNode('vqe-input-c1', 'c1', '-1.05', 0, 20),
        inputNode('vqe-input-p1', 'p1', '0.75', 0, 130),
        inputNode('vqe-input-c2', 'c2', '0.4', 0, 240),
        inputNode('vqe-input-p2', 'p2', '-0.25', 0, 350),
        inputNode('vqe-input-c3', 'c3', '0.18', 0, 460),
        inputNode('vqe-input-p3', 'p3', '0.5', 0, 570),
        formulaNode('vqe-eigenvalue-node', 'eigenvalue-equation', 320, 80),
        formulaNode('vqe-hamiltonian-node', 'hamiltonian-decomposition', 660, 80),
        formulaNode('vqe-variational-node', 'variational-energy', 1000, 80),
        formulaNode('vqe-ground-node', 'ground-state-energy', 1340, 80),
        formulaNode('vqe-fci-node', 'fci-state-expansion', 1340, 280),
        expressionNode('vqe-energy-expression', 'c1*p1 + c2*p2 + c3*p3', 1000, 300),
      ],
      [
        connection('vqe-c1', 'vqe-eigenvalue-node', 'vqe-hamiltonian-node', 'derived-from', 'masalah eigen'),
        connection('vqe-c2', 'vqe-hamiltonian-node', 'vqe-variational-node', 'used-in', 'Pauli terms'),
        connection('vqe-c3', 'vqe-variational-node', 'vqe-ground-node', 'target', 'minimisasi'),
        connection('vqe-c4', 'vqe-fci-node', 'vqe-ground-node', 'compares', 'baseline'),
        connection('vqe-c5', 'vqe-variational-node', 'vqe-energy-expression', 'result', 'estimasi E'),
        connection('vqe-c6', 'vqe-input-c1', 'vqe-variational-node', 'feeds-into', 'c1', 'c1'),
        connection('vqe-c7', 'vqe-input-p1', 'vqe-variational-node', 'feeds-into', 'p1', 'p1'),
        connection('vqe-c8', 'vqe-input-c2', 'vqe-variational-node', 'feeds-into', 'c2', 'c2'),
        connection('vqe-c9', 'vqe-input-p2', 'vqe-variational-node', 'feeds-into', 'p2', 'p2'),
        connection('vqe-c10', 'vqe-input-c3', 'vqe-variational-node', 'feeds-into', 'c3', 'c3'),
        connection('vqe-c11', 'vqe-input-p3', 'vqe-variational-node', 'feeds-into', 'p3', 'p3'),
      ]
    ),
    flowSteps: [
      { id: 'vqe-flow-1', title: 'Masalah energi dibuka', description: 'Persamaan eigenvalue dan Hamiltonian menunjukkan sumber masalah fisika yang ingin diminimalkan.', nodeIds: ['vqe-eigenvalue-node', 'vqe-hamiltonian-node'], connectionIds: ['vqe-c1', 'vqe-c2'] },
      { id: 'vqe-flow-2', title: 'Koefisien dan ekspektasi masuk', description: 'Pasangan c dan p mengalir sebagai kontribusi Pauli ke perhitungan energi variational.', nodeIds: ['vqe-input-c1', 'vqe-input-p1', 'vqe-input-c2', 'vqe-input-p2', 'vqe-input-c3', 'vqe-input-p3', 'vqe-variational-node'], connectionIds: ['vqe-c6', 'vqe-c7', 'vqe-c8', 'vqe-c9', 'vqe-c10', 'vqe-c11'] },
      { id: 'vqe-flow-3', title: 'Energi dihitung', description: 'Formula variational energy menghasilkan estimasi energi dari penjumlahan c_l dikali ekspektasi Pauli.', nodeIds: ['vqe-variational-node', 'vqe-energy-expression'], connectionIds: ['vqe-c5'] },
      { id: 'vqe-flow-4', title: 'Target ground state dan baseline', description: 'Nilai energi diarahkan menuju ground state dan dibandingkan dengan FCI sebagai acuan klasik eksak.', nodeIds: ['vqe-variational-node', 'vqe-ground-node', 'vqe-fci-node'], connectionIds: ['vqe-c3', 'vqe-c4'] },
    ],
  },
  {
    id: 'studio-qaoa-maxcut-flow',
    title: 'QAOA: Max-Cut → Ansatz → Acceptance',
    algorithm: 'qaoa',
    description: 'Canvas siap pakai untuk melihat fungsi biaya Max-Cut, Hamiltonian cost, mixer, state QAOA, dan pembanding termal.',
    state: scenarioState(
      [
        inputNode('qaoa-input-zi', 'zi', '1', 0, 80),
        inputNode('qaoa-input-zj', 'zj', '-1', 0, 200),
        inputNode('qaoa-input-dE', 'dE', '0.8', 0, 360),
        inputNode('qaoa-input-T', 'T', '1.2', 0, 480),
        formulaNode('qaoa-maxcut-node', 'maxcut-cost-function', 320, 100),
        formulaNode('qaoa-cost-node', 'cost-hamiltonian', 660, 100),
        formulaNode('qaoa-mixer-node', 'mixer-hamiltonian', 660, 300),
        formulaNode('qaoa-state-node', 'qaoa-state-p1', 1000, 180),
        formulaNode('qaoa-acceptance-node', 'acceptance-probability', 1000, 420),
        expressionNode('qaoa-edge-expression', '(1-zi*zj)/2', 1340, 180),
      ],
      [
        connection('qaoa-c1', 'qaoa-input-zi', 'qaoa-maxcut-node', 'feeds-into', 'zi', 'zi'),
        connection('qaoa-c2', 'qaoa-input-zj', 'qaoa-maxcut-node', 'feeds-into', 'zj', 'zj'),
        connection('qaoa-c3', 'qaoa-maxcut-node', 'qaoa-cost-node', 'encoded-in', 'cost'),
        connection('qaoa-c4', 'qaoa-cost-node', 'qaoa-state-node', 'uses', 'U_C'),
        connection('qaoa-c5', 'qaoa-mixer-node', 'qaoa-state-node', 'uses', 'U_B'),
        connection('qaoa-c6', 'qaoa-input-dE', 'qaoa-acceptance-node', 'feeds-into', 'dE', 'dE'),
        connection('qaoa-c7', 'qaoa-input-T', 'qaoa-acceptance-node', 'feeds-into', 'T', 'T'),
        connection('qaoa-c8', 'qaoa-maxcut-node', 'qaoa-edge-expression', 'result', 'edge cost'),
        connection('qaoa-c9', 'qaoa-acceptance-node', 'qaoa-state-node', 'compares', 'termal'),
      ]
    ),
    flowSteps: [
      { id: 'qaoa-flow-1', title: 'Spin graf masuk ke Max-Cut', description: 'Nilai zi dan zj menentukan apakah satu edge graf terpotong atau tidak.', nodeIds: ['qaoa-input-zi', 'qaoa-input-zj', 'qaoa-maxcut-node'], connectionIds: ['qaoa-c1', 'qaoa-c2'] },
      { id: 'qaoa-flow-2', title: 'Cost dikodekan sebagai Hamiltonian', description: 'Cost Max-Cut mengalir ke cost Hamiltonian agar optimisasi klasik dapat direpresentasikan secara kuantum.', nodeIds: ['qaoa-maxcut-node', 'qaoa-cost-node'], connectionIds: ['qaoa-c3'] },
      { id: 'qaoa-flow-3', title: 'Cost dan mixer membentuk ansatz', description: 'Unitary cost dan mixer digabungkan untuk membentuk state QAOA pada level p=1.', nodeIds: ['qaoa-cost-node', 'qaoa-mixer-node', 'qaoa-state-node'], connectionIds: ['qaoa-c4', 'qaoa-c5'] },
      { id: 'qaoa-flow-4', title: 'Acceptance termal dibandingkan', description: 'dE dan T mengalir ke probabilitas acceptance sebagai pembanding optimisasi klasik berbasis temperatur.', nodeIds: ['qaoa-input-dE', 'qaoa-input-T', 'qaoa-acceptance-node', 'qaoa-state-node'], connectionIds: ['qaoa-c6', 'qaoa-c7', 'qaoa-c9'] },
      { id: 'qaoa-flow-5', title: 'Nilai edge terlihat', description: 'Ekspresi (1-zi*zj)/2 memperlihatkan hasil numerik edge Max-Cut dari input spin.', nodeIds: ['qaoa-maxcut-node', 'qaoa-edge-expression'], connectionIds: ['qaoa-c8'] },
    ],
  },
];
