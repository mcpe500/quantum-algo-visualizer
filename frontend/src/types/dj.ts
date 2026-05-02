import type { BaseCase, BaseBenchmarkResult, BaseBenchmarkParams, BaseTraceStage, BaseTracePartition } from './shared';

export interface DJCase extends BaseCase {
  n_qubits: number;
  expected_classification: 'CONSTANT' | 'BALANCED';
  oracle_definition: {
    truth_table: Record<string, number>;
  };
}

export interface DJQuantumResult {
  result: 'CONSTANT' | 'BALANCED';
  counts: Record<string, number>;
  execution_time_ms: number;
  circuit_depth: number;
  gate_count: number;
  num_qubits: number;
}

export interface DJClassicResult {
  result: 'CONSTANT' | 'BALANCED';
  num_evaluations: number;
  worst_case_evaluations: number;
  execution_time_ms: number;
  time_complexity: string;
}

export interface DJBenchmarkResult extends BaseBenchmarkResult {
  n_qubits: number;
  expected_classification: string;
  quantum: DJQuantumResult;
  classic: DJClassicResult;
  accuracy: {
    quantum_correct: boolean;
    classic_correct: boolean;
  };
  comparison: {
    quantum_calls: number;
    classic_calls: number;
    speedup_factor: number;
  };
}

export interface DJCircuit {
  n_qubits: number;
  depth: number;
  gate_count: number;
  gates: Array<{
    name: string;
    qubits: number[];
    params: unknown[];
  }>;
}

export type DJBenchmarkParams = BaseBenchmarkParams;

export interface DJTraceStage extends BaseTraceStage {
  ancilla_marker: string;
}

export type DJTracePartition = BaseTracePartition;

export interface DJQuantumTrace {
  case_id: string;
  n_qubits: number;
  classification: 'CONSTANT' | 'BALANCED';
  stages: DJTraceStage[];
  partitions: DJTracePartition[];
  pseudocode?: string[];
}

export interface DJAnimationSnapshot {
  phase: string;
  operation: string;
  description: string;
  probabilities: number[];
  labels: string[];
}

export interface DJAnimationPartition {
  phase: string;
  label: string;
  count: number;
  start_col: number;
  end_col: number;
}

export interface DJAnimationOracleSummary {
  profile: 'constant-zero' | 'constant-one' | 'balanced';
  total_inputs: number;
  ones_count: number;
  zeros_count: number;
}

export interface DJBlochState {
  qubit: number;
  theta: number;
  phi: number;
  bx: number;
  by: number;
  bz: number;
  label: string;
}

export interface DJAnimationStep extends DJAnimationSnapshot {
  step: number;
  kind: string;
  comment: string;
  wire_markers: Record<string, string>;
  ancilla_marker: string;
  focus_input_bits: string | null;
  bloch_states?: DJBlochState[];
}

export interface DJAnimationTruthEntry {
  input: string;
  output: number;
}

export interface DJAnimationMeasurement {
  counts: Record<string, number>;
  classification: 'CONSTANT' | 'BALANCED';
  shots: number;
}

export interface DJAnimationInputProb {
  input_bits: string;
  probability: number;
}

export interface DJAnimationPayload {
  case_id: string;
  n_qubits: number;
  total_qubits: number;
  expected_classification: 'CONSTANT' | 'BALANCED';
  truth_table: DJAnimationTruthEntry[];
  oracle_summary: DJAnimationOracleSummary;
  partitions: DJAnimationPartition[];
  timeline: DJAnimationStep[];
  snapshots: DJAnimationSnapshot[];
  measurement: DJAnimationMeasurement;
  input_probabilities: DJAnimationInputProb[];
}
