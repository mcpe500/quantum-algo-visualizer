/**
 * Visual model builders for QAOA Simulated Annealing engine.
 * Transforms domain data into visual models for rendering.
 */

import type { Matrix, TraceStep, SimulatedAnnealingResult, Edge } from './domain';
import type { QaoaSALayoutModel } from './layout';
import { buildSerpentineFlowLayout } from './layout';

function getEdges(matrix: Matrix): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = i + 1; j < matrix.length; j += 1) {
      const weight = Number(matrix[i][j]);
      if (weight !== 0) edges.push({ u: i, v: j, weight });
    }
  }
  return edges;
}

export interface MatrixPreview {
  matrix: Matrix;
  nodeCount: number;
  edgeCount: number;
  edges: Edge[];
  label: string;
}

export interface TraceCard {
  id: string;
  step: number;
  isStart: boolean;
  isLast: boolean;
  data: TraceStep;
  matrix: Matrix;
}

export interface SummaryModel {
  bestState: string;
  bestCut: number;
  bestStep: number;
  finalState: string;
  finalCut: number;
  totalSteps: number;
  stopReason: {
    type: 'temperature' | 'maxStep';
    text: string;
  };
  acceptanceRate: number;
}

export interface QaoaSAVisualModel {
  description?: string;
  matrixPreview: MatrixPreview;
  traceCards: TraceCard[];
  layout: QaoaSALayoutModel;
  summary: SummaryModel;
  diagnostics: import('../../core/diagnostics').EngineDiagnostic[];
}

export function buildMatrixPreview(matrix: Matrix): MatrixPreview {
  const nodeCount = matrix.length;
  const edges = getEdges(matrix);
  const label = edges.map(({ u, v, weight }) => `(${u},${v}${weight !== 1 ? `; w=${weight}` : ''})`).join(', ');

  return {
    matrix,
    nodeCount,
    edgeCount: edges.length,
    edges,
    label,
  };
}

export function buildTraceCard(step: TraceStep, matrix: Matrix, index: number, isLast: boolean): TraceCard {
  return {
    id: `trace-${index}`,
    step: step.step,
    isStart: index === 0,
    isLast,
    data: step,
    matrix,
  };
}

export function buildSummaryModel(simulation: SimulatedAnnealingResult): SummaryModel {
  const acceptedSteps = simulation.trace.filter((step) => step.accepted).length;
  const totalSteps = simulation.trace.length;
  const acceptanceRate = totalSteps > 0 ? (acceptedSteps / (totalSteps - 1)) * 100 : 0;

  return {
    bestState: simulation.best.state,
    bestCut: simulation.best.cut,
    bestStep: simulation.best.step,
    finalState: simulation.finalState,
    finalCut: simulation.finalCut,
    totalSteps: simulation.trace.length,
    stopReason: simulation.stopReason,
    acceptanceRate,
  };
}

export function buildQaoaSAVisualModel(
  matrix: Matrix,
  simulation: SimulatedAnnealingResult,
  description?: string
): QaoaSAVisualModel {
  const matrixPreview = buildMatrixPreview(matrix);
  const traceCards = simulation.trace.map((step, index) =>
    buildTraceCard(step, matrix, index, index === simulation.trace.length - 1)
  );
  const summary = buildSummaryModel(simulation);
  const layout = buildSerpentineFlowLayout(traceCards);

  return {
    description,
    matrixPreview,
    traceCards,
    layout,
    summary,
    diagnostics: [],
  };
}
