export interface VQECase {
  case_id: string;
  description: string;
  molecule: string;
  qubits: number;
  ansatz: {
    type: string;
    n_layers: number;
  };
  hamiltonian: {
    terms: Record<string, number>;
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

export interface VQEQuantumResult {
  method: string;
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
}

export interface VQEComparison {
  fci_energy: number;
  vqe_energy: number;
  energy_error: number;
  accuracy_percent: number;
  note: string;
}

export interface VQEBenchmarkResult {
  timestamp: string;
  case_id: string;
  molecule: string;
  description: string;
  n_qubits: number;
  shots: number;
  ansatz_type: string;
  n_layers: number;
  hamiltonian_terms: Record<string, number>;
  classical: VQEClassicalResult;
  quantum: VQEQuantumResult;
  comparison: VQEComparison;
}

export interface VQETraceStage {
  step: number;
  operation: string;
  wire_markers: Record<string, string>;
  phase: string;
}

export interface VQETracePartition {
  stageId: string;
  label: string;
  start: number;
  end: number;
}

export interface VQETrace {
  case_id: string;
  n_qubits: number;
  ansatz_type: string;
  n_layers: number;
  stages: VQETraceStage[];
  partitions: VQETracePartition[];
}

export interface VQEBenchmarkParams {
  case_id: string;
  shots: number;
}

export interface VQECircuitImage {
  case_id: string;
  n_qubits: number;
  ansatz_type: string;
  n_layers: number;
  image: string;
  depth: number;
  gate_count: number;
}
