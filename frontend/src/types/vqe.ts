import type { BaseCase, BaseBenchmarkResult, BaseBenchmarkParams, BaseTraceStage, BaseTracePartition } from './shared';

export interface VQECase extends BaseCase {
  molecule: string;
  qubits: number;
  ansatz: {
    type: string;
    n_layers: number;
  };
  hamiltonian: {
    terms: Record<string, number>;
  };
  raw_spec?: {
    problem_type?: string;
    molecule_spec?: {
      formula?: string;
      interatomic_distance_angstrom?: number;
      basis?: string;
      charge?: number;
      multiplicity?: number;
    };
    preprocessing?: {
      mapping?: string;
      initial_qubits?: number;
      qubit_reduction?: string;
      target_qubits?: number;
      hamiltonian_format?: string;
    };
    experiment?: {
      algorithm?: string;
      ansatz_type?: string;
      ansatz_family?: string;
      rotation_gate?: string;
      entanglement?: string;
      n_layers?: number;
      shots?: number;
      optimizer?: string;
      classical_reference?: string;
    };
  };
  transform?: {
    source?: string;
    mapping?: string;
    initial_qubits?: number;
    qubit_reduction?: string;
    target_qubits?: number;
    hamiltonian_format?: string;
    canonical_terms?: number;
    note?: string;
  };
}

export interface VQEClassicalResult {
  method: string;
  energy: number;
  execution_time_ms: number;
  time_complexity: string;
  matrix_size: string;
  note: string;
}

export interface ShotEvaluation {
  energy: number;
  std: number;
  shots: number;
  energy_error: number;
}

export interface VQEIterationSnapshot {
  iteration: number;
  energy: number;
  parameters: number[];
  circuit_image: string;
}

export interface VQEQuantumResult {
  method: string;
  optimizer_name: string;
  measurement_method: string;
  energy: number;
  iterations: number;
  circuit_depth: number;
  gate_count: number;
  time_complexity: string;
  convergence_history: number[];
  optimal_parameters: number[];
  execution_time_ms: number;
  energy_error: number;
  accuracy: number;
  shot_evaluation: ShotEvaluation | null;
  iteration_snapshots: VQEIterationSnapshot[];
}

export interface VQEComparison {
  fci_energy: number;
  vqe_energy: number;
  energy_error: number;
  accuracy_percent: number;
  note: string;
}

export interface VQEBenchmarkResult extends BaseBenchmarkResult {
  molecule: string;
  description: string;
  n_qubits: number;
  ansatz_type: string;
  n_layers: number;
  hamiltonian_terms: Record<string, number>;
  classical: VQEClassicalResult;
  quantum: VQEQuantumResult;
  comparison: VQEComparison;
}

export interface VQETraceStage extends BaseTraceStage {}

export interface VQETracePartition extends BaseTracePartition {}

export interface VQETrace {
  case_id: string;
  n_qubits: number;
  ansatz_type: string;
  n_layers: number;
  stages: VQETraceStage[];
  partitions: VQETracePartition[];
}

export interface VQEBenchmarkParams extends BaseBenchmarkParams {}

export interface VQECircuitImage {
  case_id: string;
  n_qubits: number;
  ansatz_type: string;
  n_layers: number;
  image: string;
  depth: number;
  gate_count: number;
}
