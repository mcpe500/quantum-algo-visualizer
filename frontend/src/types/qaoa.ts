export interface QAOAGraph {
  adjacency_matrix: number[][];
  nodes?: number[];
  edges?: [number, number][];
}

export interface QAOACase {
  case_id: string;
  description: string;
  problem: string;
  graph: QAOAGraph;
  p_layers: number;
}

export interface QAOACutPoint {
  bitstring: string;
  count: number;
  probability: number;
  cut: number;
}

export interface QAOAExactResult {
  method: string;
  optimal_cut: number;
  optimal_partition: number[];
  execution_time_ms: number;
  time_complexity: string;
}

export interface QAOAClassicalResult {
  method: string;
  best_cut: number;
  best_partition: number[];
  execution_time_ms: number;
  approx_ratio: number;
  cut_history: number[];
}

export interface QAOAQuantumResult {
  method: string;
  best_cut: number;
  best_bitstring: string;
  expected_cut: number;
  circuit_depth: number;
  gate_count: number;
  p_layers: number;
  n_qubits: number;
  time_complexity: string;
  optimal_gamma: number[];
  optimal_beta: number[];
  cut_distribution: QAOACutPoint[];
  expected_cut_history: number[];
  iterations: number;
  approx_ratio: number;
  execution_time_ms: number;
}

export interface QAOAComparison {
  exact_cut: number;
  sa_cut: number;
  qaoa_cut: number;
  sa_approx_ratio: number;
  qaoa_approx_ratio: number;
  note: string;
}

export interface QAOABenchmarkResult {
  timestamp: string;
  case_id: string;
  problem: string;
  description: string;
  n_nodes: number;
  n_edges: number;
  edges: [number, number][];
  nodes: number[];
  adjacency_matrix: number[][];
  p_layers: number;
  shots: number;
  exact: QAOAExactResult;
  classical: QAOAClassicalResult;
  quantum: QAOAQuantumResult;
  comparison: QAOAComparison;
}

export interface QAOATraceStage {
  step: number;
  operation: string;
  wire_markers: Record<string, string>;
  phase: string;
}

export interface QAOATracePartition {
  stageId: string;
  label: string;
  start: number;
  end: number;
}

export interface QAOATrace {
  case_id: string;
  n_nodes: number;
  n_edges: number;
  p_layers: number;
  stages: QAOATraceStage[];
  partitions: QAOATracePartition[];
}

export interface QAOABenchmarkParams {
  case_id: string;
  shots: number;
}

export interface QAOACircuitImage {
  case_id: string;
  n_qubits: number;
  p_layers: number;
  image: string;
  depth: number;
  gate_count: number;
}

export interface QAOAComplexNumber {
  re: number;
  im: number;
}

export interface QAOAQubitAnimationSummary {
  qubit: number;
  p_zero: number;
  p_one: number;
  theta: number;
  phi: number;
}

export interface QAOAAnimationCheckpoint {
  key: string;
  kind: 'initial' | 'middle' | 'best';
  label: string;
  eval_index: number;
  gamma: number[];
  beta: number[];
  expected_cut: number;
  best_so_far: number;
  dominant_bitstring: string;
  dominant_cut: number;
  dominant_probability: number;
  dominant_partition: number[];
  best_bitstring: string;
  best_cut: number;
  best_partition: number[];
}

export interface QAOAAnimationPartition {
  key: string;
  checkpoint_key: string;
  checkpoint_label: string;
  phase: string;
  label: string;
  start: number;
  end: number;
  count: number;
}

export interface QAOAAnimationHamiltonianTerm {
  edge: [number, number];
  pauli: string;
  weight: number;
}

export interface QAOAAnimationStep {
  step: number;
  iteration: number;
  checkpoint_key: string;
  checkpoint_label: string;
  checkpoint_kind: 'initial' | 'middle' | 'best';
  phase: 'optimizer' | 'superposition' | 'cost' | 'mixer' | 'measurement' | 'update';
  operation: string;
  description: string;
  gamma: number[];
  beta: number[];
  expected_cut: number;
  best_so_far: number;
  statevector: QAOAComplexNumber[];
  qubit_summaries: QAOAQubitAnimationSummary[];
  measurement_distribution: QAOACutPoint[];
  layer?: number;
  edge?: [number, number];
  target_qubit?: number;
  candidate_bitstring?: string;
  cut_value?: number;
  dominant_probability?: number;
}

export interface QAOAAnimationPayload {
  timestamp: string;
  case_id: string;
  problem: string;
  description: string;
  n_nodes: number;
  n_edges: number;
  nodes: number[];
  edges: [number, number][];
  adjacency_matrix: number[][];
  p_layers: number;
  shots: number;
  hamiltonian: {
    label: string;
    formula: string;
    terms: QAOAAnimationHamiltonianTerm[];
  };
  checkpoints: QAOAAnimationCheckpoint[];
  partitions: QAOAAnimationPartition[];
  timeline: QAOAAnimationStep[];
  exact: QAOAExactResult;
  classical: QAOAClassicalResult;
  quantum: QAOAQuantumResult;
  comparison: QAOAComparison;
}
