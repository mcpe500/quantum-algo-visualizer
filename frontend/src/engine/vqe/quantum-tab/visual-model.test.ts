import { describe, it, expect } from 'vitest';
import {
  buildVQEMetrics,
  buildVQEComparison,
  buildVQEEnergyModel,
  buildVQEPhaseBadgeModel,
  buildVQEQuantumTabModel,
} from './visual-model';
import type { VQEBenchmarkResult } from '../../../types/vqe';

const mockResult: VQEBenchmarkResult = {
  molecule: 'H2',
  description: 'Test',
  n_qubits: 4,
  ansatz_type: 'UCCSD',
  n_layers: 2,
  hamiltonian_terms: {},
  classical: {
    method: 'FCI',
    energy: -1.137,
    execution_time_ms: 100,
    time_complexity: 'O(2^n)',
    matrix_size: '16x16',
    note: 'Exact',
  },
  quantum: {
    method: 'VQE',
    optimizer_name: 'COBYLA',
    measurement_method: 'Statevector',
    energy: -1.13,
    iterations: 10,
    circuit_depth: 12,
    gate_count: 24,
    time_complexity: 'O(n^3)',
    convergence_history: [-1.0, -1.05, -1.1, -1.13],
    optimal_parameters: [0.1, 0.2, 0.3],
    execution_time_ms: 200,
    energy_error: 0.007,
    accuracy: 99.4,
    shot_evaluation: null,
    iteration_snapshots: [
      { iteration: 0, energy: -1.0, parameters: [0, 0, 0], circuit_image: '' },
      { iteration: 3, energy: -1.13, parameters: [0.1, 0.2, 0.3], circuit_image: '' },
    ],
  },
  comparison: {
    fci_energy: -1.137,
    vqe_energy: -1.13,
    energy_error: 0.007,
    accuracy_percent: 99.4,
    note: 'Close enough',
  },
};

describe('buildVQEMetrics', () => {
  it('extracts metrics', () => {
    const m = buildVQEMetrics(mockResult);
    expect(m.qubits).toBe(4);
    expect(m.iterations).toBe(10);
    expect(m.circuitDepth).toBe(12);
    expect(m.gateCount).toBe(24);
  });
});

describe('buildVQEComparison', () => {
  it('extracts comparison', () => {
    const c = buildVQEComparison(mockResult);
    expect(c.fciEnergy).toBe(-1.137);
    expect(c.vqeEnergy).toBe(-1.13);
    expect(c.accuracyPercent).toBe(99.4);
  });
});

describe('buildVQEEnergyModel', () => {
  it('uses snapshot energy when available', () => {
    const checkpoint = {
      snapshots: mockResult.quantum.iteration_snapshots,
      activeIndex: 1,
      hasSnapshots: true,
      safeActiveIndex: 1,
      currentSnapshot: mockResult.quantum.iteration_snapshots[1],
    };
    const e = buildVQEEnergyModel(mockResult, checkpoint);
    expect(e.displayEnergy).toBe(-1.13);
    expect(e.displayEnergyError).toBeCloseTo(0.007);
    expect(e.displayAccuracy).toBeGreaterThan(0);
  });

  it('falls back to result energy when no snapshot', () => {
    const checkpoint = {
      snapshots: [],
      activeIndex: 0,
      hasSnapshots: false,
      safeActiveIndex: 0,
      currentSnapshot: null,
    };
    const e = buildVQEEnergyModel(mockResult, checkpoint);
    expect(e.displayEnergy).toBe(-1.13);
  });
});

describe('buildVQEPhaseBadgeModel', () => {
  it('returns running when animating', () => {
    const badge = buildVQEPhaseBadgeModel(true, 0, 10);
    expect(badge.label).toBe('Running...');
    expect(badge.tone).toBe('purple');
  });

  it('returns initializing at step 0', () => {
    const badge = buildVQEPhaseBadgeModel(false, 0, 10);
    expect(badge.label).toBe('Initializing θ');
    expect(badge.tone).toBe('blue');
  });

  it('returns converged near end', () => {
    const badge = buildVQEPhaseBadgeModel(false, 8, 10);
    expect(badge.label).toBe('Converged!');
    expect(badge.tone).toBe('emerald');
  });

  it('returns optimizing in middle', () => {
    const badge = buildVQEPhaseBadgeModel(false, 4, 10);
    expect(badge.label).toBe('Optimizing');
    expect(badge.tone).toBe('amber');
  });
});

describe('buildVQEQuantumTabModel', () => {
  it('builds full model', () => {
    const model = buildVQEQuantumTabModel(mockResult, 1, 3, false);
    expect(model.metrics.qubits).toBe(4);
    expect(model.energy.displayEnergy).toBe(-1.13);
    expect(model.phaseBadge.label).toBe('Optimizing');
    expect(model.parameters.optimalParameters).toHaveLength(3);
  });
});
