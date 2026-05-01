export interface BaseCase {
  case_id: string;
  description?: string;
}

export interface BaseBenchmarkResult {
  timestamp: string;
  case_id: string;
  shots: number;
}

export interface BaseBenchmarkParams {
  case_id: string;
  shots: number;
}

export interface BaseCircuitImage {
  case_id: string;
  image: string;
  depth: number;
  gate_count: number;
}

export interface BaseTraceStage {
  step: number;
  operation: string;
  wire_markers: Record<string, string>;
  phase: string;
}

export interface BaseTracePartition {
  stageId: string;
  label: string;
  start: number;
  end: number;
}

export interface BaseTrace {
  case_id: string;
  stages: BaseTraceStage[];
  partitions: BaseTracePartition[];
}
