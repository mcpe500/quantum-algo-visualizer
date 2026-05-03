/**
 * Circuit Lab — Visual Model Engine
 * Pure builders for visual presentation derived from circuit state.
 */

import type { Complex } from '../../../components/qubit-playground/types';

export interface CircuitProbabilityEntry {
  basis: string;
  probability: number;
}

export function buildProbabilityEntries(statevector: Complex[], numQubits: number): CircuitProbabilityEntry[] {
  return statevector.map((amplitude, index) => ({
    basis: `|${index.toString(2).padStart(numQubits, '0')}⟩`,
    probability: amplitude.re ** 2 + amplitude.im ** 2,
  }));
}

export interface CircuitStepIndexMap {
  get(placementId: string): number | undefined;
  has(placementId: string): boolean;
}

export function buildStepIndexByPlacementId(
  frames: Array<{ placementId: string | null; stepIndex: number }>
): CircuitStepIndexMap {
  const map = new Map<string, number>();
  frames.forEach((frame) => {
    if (frame.placementId) {
      map.set(frame.placementId, frame.stepIndex);
    }
  });
  return {
    get: (id: string) => map.get(id),
    has: (id: string) => map.has(id),
  };
}

export interface CircuitLayoutModel {
  occupiedColumns: number;
}

export function buildCircuitLayoutModel(placements: Array<{ column: number }>): CircuitLayoutModel {
  return {
    occupiedColumns: new Set(placements.map((p) => p.column)).size,
  };
}
