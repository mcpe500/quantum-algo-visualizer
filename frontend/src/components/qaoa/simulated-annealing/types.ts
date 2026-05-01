export type Matrix = number[][];

export interface Edge {
  u: number;
  v: number;
  weight: number;
}

export interface CutDetail {
  u: number;
  v: number;
  weight: number;
  isCut: boolean;
  contribution: number;
}

export interface CutDetailsResult {
  cut: number;
  expression: string;
  details: CutDetail[];
}

export type StatusColor = 'slate' | 'emerald' | 'yellow' | 'red';

export interface TraceStep {
  step: number;
  action: string;
  flipNode?: number;
  temperature: number;
  newTemperature: number | null;
  minTemperature: number;
  currentState: string;
  candidateState: string;
  resultState: string;
  currentCut: number;
  candidateCut: number;
  resultCut: number;
  deltaCut: number;
  randomValue: number | null;
  probability: number | null;
  accepted: boolean;
  status: string;
  color: StatusColor;
  stopAfter: boolean;
  cutDetails: CutDetailsResult;
}

export interface SimulatedAnnealingResult {
  trace: TraceStep[];
  best: {
    state: string;
    cut: number;
    step: number;
  };
  finalState: string;
  finalCut: number;
  stopReason: {
    type: 'temperature' | 'maxStep';
    text: string;
  };
}

export interface SimulationConfig {
  matrix: Matrix;
  initialTemperature: number;
  alpha: number;
  minTemperature: number;
  maxSteps: number;
  seed: number;
}

export interface JsonPayload {
  case_id?: string;
  description?: string;
  problem?: string;
  graph?: {
    adjacency_matrix?: unknown;
  };
  adjacency_matrix?: unknown;
}
