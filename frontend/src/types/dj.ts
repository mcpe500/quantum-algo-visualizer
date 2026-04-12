export interface DJCase {
  case_id: string;
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

export interface DJBenchmarkResult {
  timestamp: string;
  case_id: string;
  n_qubits: number;
  expected_classification: string;
  shots: number;
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

export interface DJBenchmarkParams {
  case_id: string;
  shots: number;
}
