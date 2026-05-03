import { describe, it, expect } from 'vitest';
import { buildMatrixPreview, buildTraceCard, buildSummaryModel, buildQaoaSAVisualModel } from './visual-model';
import type { Matrix, SimulatedAnnealingResult, TraceStep } from './domain';

const mockMatrix: Matrix = [
  [0, 1, 0],
  [1, 0, 1],
  [0, 1, 0],
];

const mockTrace: TraceStep[] = [
  {
    step: 0,
    action: 'Kondisi Awal',
    temperature: 3.0,
    newTemperature: null,
    minTemperature: 0.1,
    currentState: '000',
    candidateState: '000',
    resultState: '000',
    currentCut: 0,
    candidateCut: 0,
    resultCut: 0,
    deltaCut: 0,
    randomValue: null,
    probability: null,
    accepted: true,
    status: 'START',
    color: 'slate',
    stopAfter: false,
    cutDetails: { cut: 0, expression: '0 = 0', details: [] },
  },
  {
    step: 1,
    action: 'Flip Node 0',
    flipNode: 0,
    temperature: 3.0,
    newTemperature: 1.5,
    minTemperature: 0.1,
    currentState: '000',
    candidateState: '100',
    resultState: '100',
    currentCut: 0,
    candidateCut: 1,
    resultCut: 1,
    deltaCut: 1,
    randomValue: null,
    probability: null,
    accepted: true,
    status: 'ACCEPT (LEBIH BAIK / SAMA)',
    color: 'emerald',
    stopAfter: false,
    cutDetails: { cut: 1, expression: '1 = 1', details: [{ u: 0, v: 1, weight: 1, isCut: true, contribution: 1 }] },
  },
];

const mockResult: SimulatedAnnealingResult = {
  trace: mockTrace,
  best: { state: '100', cut: 1, step: 1 },
  finalState: '100',
  finalCut: 1,
  stopReason: { type: 'maxStep', text: 'Max step reached' },
};

describe('buildMatrixPreview', () => {
  it('counts nodes and edges', () => {
    const preview = buildMatrixPreview(mockMatrix);
    expect(preview.nodeCount).toBe(3);
    expect(preview.edgeCount).toBe(2);
    expect(preview.edges).toHaveLength(2);
  });
});

describe('buildTraceCard', () => {
  it('marks first card as start', () => {
    const card = buildTraceCard(mockTrace[0], mockMatrix, 0, false);
    expect(card.isStart).toBe(true);
    expect(card.isLast).toBe(false);
  });

  it('marks last card correctly', () => {
    const card = buildTraceCard(mockTrace[1], mockMatrix, 1, true);
    expect(card.isLast).toBe(true);
    expect(card.isStart).toBe(false);
  });
});

describe('buildSummaryModel', () => {
  it('computes summary fields', () => {
    const summary = buildSummaryModel(mockResult);
    expect(summary.bestState).toBe('100');
    expect(summary.bestCut).toBe(1);
    expect(summary.totalSteps).toBe(2);
    expect(summary.stopReason.type).toBe('maxStep');
  });
});

describe('buildQaoaSAVisualModel', () => {
  it('builds full visual model', () => {
    const model = buildQaoaSAVisualModel(mockMatrix, mockResult, 'Test');
    expect(model.description).toBe('Test');
    expect(model.matrixPreview.nodeCount).toBe(3);
    expect(model.traceCards).toHaveLength(2);
    expect(model.summary.bestCut).toBe(1);
    expect(model.layout.rows).toBeDefined();
    expect(model.diagnostics).toEqual([]);
  });
});
