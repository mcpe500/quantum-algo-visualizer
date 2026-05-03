/**
 * VQE Quantum Tab visual model engine.
 * Transforms VQE benchmark result + UI state into a visual model for rendering.
 */

import type {
  VQEBenchmarkResult,
  VQEIterationSnapshot,
} from '../../../types/vqe';

export interface VQEMetricsModel {
  qubits: number;
  iterations: number;
  circuitDepth: number;
  gateCount: number;
}

export interface VQEComparisonModel {
  fciEnergy: number;
  vqeEnergy: number;
  energyError: number;
  accuracyPercent: number;
  note: string;
}

export interface VQEConvergenceModel {
  history: number[];
  optimalValue: number;
  animatedUpTo: number;
  totalIterations: number;
}

export interface VQECheckpointModel {
  snapshots: VQEIterationSnapshot[];
  activeIndex: number;
  hasSnapshots: boolean;
  safeActiveIndex: number;
  currentSnapshot: VQEIterationSnapshot | null;
}

export interface VQEEnergyModel {
  displayEnergy: number;
  displayEnergyError: number;
  displayAccuracy: number;
}

export interface VQEPhaseBadgeModel {
  label: string;
  tone: 'blue' | 'amber' | 'emerald' | 'purple';
}

export interface VQEParameterModel {
  optimalParameters: number[];
}

export interface VQEQuantumTabModel {
  metrics: VQEMetricsModel;
  comparison: VQEComparisonModel;
  convergence: VQEConvergenceModel;
  checkpoint: VQECheckpointModel;
  energy: VQEEnergyModel;
  parameters: VQEParameterModel;
  phaseBadge: VQEPhaseBadgeModel;
}

export function buildVQEMetrics(result: VQEBenchmarkResult): VQEMetricsModel {
  return {
    qubits: result.n_qubits,
    iterations: result.quantum.iterations,
    circuitDepth: result.quantum.circuit_depth,
    gateCount: result.quantum.gate_count,
  };
}

export function buildVQEComparison(result: VQEBenchmarkResult): VQEComparisonModel {
  return {
    fciEnergy: result.comparison.fci_energy,
    vqeEnergy: result.comparison.vqe_energy,
    energyError: result.comparison.energy_error,
    accuracyPercent: result.comparison.accuracy_percent,
    note: result.comparison.note,
  };
}

export function buildVQEConvergenceModel(
  result: VQEBenchmarkResult,
  animatedIteration: number
): VQEConvergenceModel {
  return {
    history: result.quantum.convergence_history,
    optimalValue: result.classical.energy,
    animatedUpTo: animatedIteration,
    totalIterations: result.quantum.convergence_history.length,
  };
}

export function buildVQECheckpointModel(
  result: VQEBenchmarkResult,
  activeCheckpoint: number
): VQECheckpointModel {
  const snapshots = result.quantum.iteration_snapshots || [];
  const hasSnapshots = snapshots.length > 0;
  const safeActiveIndex = Math.min(activeCheckpoint, Math.max(0, snapshots.length - 1));
  const currentSnapshot = hasSnapshots ? snapshots[safeActiveIndex] : null;

  return {
    snapshots,
    activeIndex: activeCheckpoint,
    hasSnapshots,
    safeActiveIndex,
    currentSnapshot,
  };
}

export function buildVQEEnergyModel(
  result: VQEBenchmarkResult,
  checkpoint: VQECheckpointModel
): VQEEnergyModel {
  const displayEnergy = checkpoint.currentSnapshot
    ? checkpoint.currentSnapshot.energy
    : result.quantum.energy;
  const displayEnergyError = Math.abs(displayEnergy - result.classical.energy);
  const displayAccuracy = Math.max(
    0,
    Math.min(100, (1 - displayEnergyError / Math.max(Math.abs(result.classical.energy), 1e-10)) * 100)
  );

  return {
    displayEnergy,
    displayEnergyError,
    displayAccuracy,
  };
}

export function buildVQEParameterModel(result: VQEBenchmarkResult): VQEParameterModel {
  return {
    optimalParameters: result.quantum.optimal_parameters,
  };
}

export function buildVQEPhaseBadgeModel(
  isAnimating: boolean,
  animatedIteration: number,
  totalIterations: number
): VQEPhaseBadgeModel {
  if (isAnimating) {
    return { label: 'Running...', tone: 'purple' };
  }
  if (animatedIteration === 0) {
    return { label: 'Initializing θ', tone: 'blue' };
  }
  if (animatedIteration >= totalIterations - 2) {
    return { label: 'Converged!', tone: 'emerald' };
  }
  return { label: 'Optimizing', tone: 'amber' };
}

export function buildVQEQuantumTabModel(
  result: VQEBenchmarkResult,
  activeCheckpoint: number,
  animatedIteration: number,
  isAnimating: boolean
): VQEQuantumTabModel {
  const checkpoint = buildVQECheckpointModel(result, activeCheckpoint);

  return {
    metrics: buildVQEMetrics(result),
    comparison: buildVQEComparison(result),
    convergence: buildVQEConvergenceModel(result, animatedIteration),
    checkpoint,
    energy: buildVQEEnergyModel(result, checkpoint),
    parameters: buildVQEParameterModel(result),
    phaseBadge: buildVQEPhaseBadgeModel(isAnimating, animatedIteration, result.quantum.convergence_history.length),
  };
}
