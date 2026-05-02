export interface QAOAGraph {
  adjacency_matrix: number[][];
  nodes?: number[];
  edges?: [number, number][];
}

import type { BaseCase, BaseBenchmarkResult, BaseBenchmarkParams, BaseTraceStage, BaseTracePartition } from './shared';

export interface QAOACase extends BaseCase {
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

export interface QAOACutBucket {
  cut: number;
  count: number;
  probability: number;
}

export interface QAOARunConfig {
  optimizer_method: string;
  optimizer_seed: number;
  simulator_seed: number;
  optimizer_maxiter: number;
  objective: string;
  shots: number;
}

export interface QAOAAggregateStats {
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface QAOAAggregateRecord {
  seed: number;
  expected_cut: number;
  expected_cut_ratio: number;
  iterations: number;
  optimal_gamma: number[];
  optimal_beta: number[];
  optimizer_success: boolean;
}

export interface QAOAAggregateResult {
  timestamp?: string;
  case_id: string;
  seed_start: number;
  seed_count: number;
  seeds: number[];
  optimizer_method: string;
  optimizer_maxiter: number;
  objective: string;
  expected_cut_stats: QAOAAggregateStats;
  expected_cut_ratio_stats: QAOAAggregateStats;
  iteration_stats: QAOAAggregateStats;
  success_rate: number;
  best_seed_record: QAOAAggregateRecord | null;
  worst_seed_record: QAOAAggregateRecord | null;
  records: QAOAAggregateRecord[];
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
  best_sampled_ratio: number;
  dominant_bitstring: string;
  dominant_cut: number;
  dominant_probability: number;
  expected_cut: number;
  expected_cut_ratio: number;
  circuit_depth: number;
  gate_count: number;
  p_layers: number;
  n_qubits: number;
  time_complexity: string;
  initial_gamma: number[];
  initial_beta: number[];
  optimal_gamma: number[];
  optimal_beta: number[];
  cut_distribution: QAOACutPoint[];
  cut_buckets: QAOACutBucket[];
  counts: Record<string, number>;
  expected_cut_history: number[];
  iterations: number;
  approx_ratio: number;
  optimal_solution_probability: number;
  run_config: QAOARunConfig;
  execution_time_ms: number;
}

export interface QAOAComparison {
  exact_cut: number;
  sa_cut: number;
  qaoa_cut: number;
  sa_approx_ratio: number;
  qaoa_approx_ratio: number;
  qaoa_expected_cut: number;
  qaoa_expected_cut_ratio: number;
  note: string;
}

export interface QAOABenchmarkResult extends BaseBenchmarkResult {
  problem: string;
  description: string;
  n_nodes: number;
  n_edges: number;
  edges: [number, number][];
  nodes: number[];
  adjacency_matrix: number[][];
  p_layers: number;
  exact: QAOAExactResult;
  classical: QAOAClassicalResult;
  quantum: QAOAQuantumResult;
  comparison: QAOAComparison;
  aggregate?: QAOAAggregateResult | null;
}

export type QAOATraceStage = BaseTraceStage;

export type QAOATracePartition = BaseTracePartition;

export interface QAOATrace {
  case_id: string;
  n_nodes: number;
  n_edges: number;
  p_layers: number;
  stages: QAOATraceStage[];
  partitions: QAOATracePartition[];
}

export interface QAOABenchmarkParams extends BaseBenchmarkParams {
  optimizer_seed?: number;
  simulator_seed?: number;
  maxiter?: number;
  include_aggregate?: boolean;
  aggregate_seed_start?: number;
  aggregate_seed_count?: number;
  aggregate_maxiter?: number;
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
