export interface QAOAGraph {
  nodes: number[];
  edges: [number, number][];
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
