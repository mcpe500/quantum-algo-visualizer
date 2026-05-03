/**
 * QAOA Hybrid Animation Timeline Model Engine.
 * Pure data transformation from animation payload to timeline model.
 */

import type { QAOAAnimationPayload, QAOAAnimationStep, QAOAAnimationCheckpoint, QAOAAnimationPartition } from '../../../types/qaoa';

export interface QaoaHybridCheckpointModel {
  key: string;
  kind: 'initial' | 'middle' | 'best';
  label: string;
  evalIndex: number;
  stepIndex: number;
  expectedCut: number;
  bestSoFar: number;
  dominantBitstring: string;
  dominantCut: number;
  dominantProbability: number;
  bestBitstring: string;
  bestCut: number;
}

export interface QaoaHybridPhaseModel {
  phase: string;
  label: string;
  stepIndices: number[];
}

export interface QaoaHybridStepModel {
  index: number;
  step: number;
  iteration: number;
  checkpointKey: string;
  checkpointLabel: string;
  checkpointKind: 'initial' | 'middle' | 'best';
  phase: string;
  operation: string;
  description: string;
}

export interface QaoaHybridTimelineModel {
  totalSteps: number;
  checkpoints: QaoaHybridCheckpointModel[];
  phases: QaoaHybridPhaseModel[];
  steps: QaoaHybridStepModel[];
}

function buildCheckpointModel(
  checkpoint: QAOAAnimationCheckpoint,
  stepIndex: number
): QaoaHybridCheckpointModel {
  return {
    key: checkpoint.key,
    kind: checkpoint.kind,
    label: checkpoint.label,
    evalIndex: checkpoint.eval_index,
    stepIndex,
    expectedCut: checkpoint.expected_cut,
    bestSoFar: checkpoint.best_so_far,
    dominantBitstring: checkpoint.dominant_bitstring,
    dominantCut: checkpoint.dominant_cut,
    dominantProbability: checkpoint.dominant_probability,
    bestBitstring: checkpoint.best_bitstring,
    bestCut: checkpoint.best_cut,
  };
}

function buildStepModel(step: QAOAAnimationStep, index: number): QaoaHybridStepModel {
  return {
    index,
    step: step.step,
    iteration: step.iteration,
    checkpointKey: step.checkpoint_key,
    checkpointLabel: step.checkpoint_label,
    checkpointKind: step.checkpoint_kind,
    phase: step.phase,
    operation: step.operation,
    description: step.description,
  };
}

export function buildQaoaHybridTimelineModel(data: QAOAAnimationPayload): QaoaHybridTimelineModel {
  const steps = data.timeline.map((step, index) => buildStepModel(step, index));

  const checkpointMap = new Map<string, number>();
  data.timeline.forEach((step, index) => {
    if (!checkpointMap.has(step.checkpoint_key)) {
      checkpointMap.set(step.checkpoint_key, index);
    }
  });

  const checkpoints = data.checkpoints.map((checkpoint) =>
    buildCheckpointModel(checkpoint, checkpointMap.get(checkpoint.key) ?? 0)
  );

  const phaseGroups = new Map<string, number[]>();
  data.timeline.forEach((step, index) => {
    const list = phaseGroups.get(step.phase) ?? [];
    list.push(index);
    phaseGroups.set(step.phase, list);
  });

  const phaseOrder = ['optimizer', 'superposition', 'cost', 'mixer', 'measurement', 'update'];
  const phases: QaoaHybridPhaseModel[] = phaseOrder
    .filter((phase) => phaseGroups.has(phase))
    .map((phase) => ({
      phase,
      label: phase.charAt(0).toUpperCase() + phase.slice(1),
      stepIndices: phaseGroups.get(phase) ?? [],
    }));

  return {
    totalSteps: data.timeline.length,
    checkpoints,
    phases,
    steps,
  };
}
