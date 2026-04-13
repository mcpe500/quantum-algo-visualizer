export interface QFTCase {
  case_id: string;
  description: string;
  n_points: number;
  signal_data: number[];
  signal_type: string;
}

export interface FFTSpectrumPoint {
  bin: number;
  magnitude: number;
  phase: number;
}

export interface FFTResult {
  dominant_bins: number[];
  dominant_magnitudes: number[];
  execution_time_ms: number;
  n_points: number;
  time_complexity: string;
  spectrum: FFTSpectrumPoint[];
}

export interface QFTProbabilityPoint {
  state: string;
  count: number;
  probability: number;
}

export interface QFTResult {
  counts: Record<string, number>;
  execution_time_ms: number;
  circuit_depth: number;
  gate_count: number;
  num_qubits: number;
  time_complexity: string;
  n_points_original: number;
  n_points_padded: number;
  input_amplitudes: number[];
  probabilities: QFTProbabilityPoint[];
  note: string;
}

export interface QFTBenchmarkResult {
  timestamp: string;
  case_id: string;
  signal_type: string;
  n_points_original: number;
  n_points_padded: number;
  n_qubits: number;
  shots: number;
  input_signal: number[];
  padded_signal: number[];
  fft: FFTResult;
  qft: QFTResult;
  comparison: {
    fft_complexity: string;
    qft_complexity: string;
    speedup_factor: string;
    note: string;
  };
}

export interface QFTTraceStage {
  step: number;
  operation: string;
  wire_markers: Record<string, string>;
  phase: string;
}

export interface QFTTracePartition {
  stageId: string;
  label: string;
  start: number;
  end: number;
}

export interface QFTQuantumTrace {
  case_id: string;
  n_qubits: number;
  n_points_original: number;
  n_points_padded: number;
  stages: QFTTraceStage[];
  partitions: QFTTracePartition[];
}

export interface QFTBenchmarkParams {
  case_id: string;
  shots: number;
}
