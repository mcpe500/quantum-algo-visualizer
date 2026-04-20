import type { QAOAAnimationCheckpoint, QAOAAnimationPayload, QAOAAnimationStep } from '../../../types/qaoa';
import { PHASE_ORDER } from './constants';

export { wait, waitForAnimationFrame, waitForAnimationFrames, waitForCanvasReady } from '../../../shared/utils';

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatRadians(value: number): string {
  return `${value.toFixed(3)} rad`;
}

export function getActiveCheckpoint(
  checkpoints: QAOAAnimationCheckpoint[],
  step: QAOAAnimationStep,
): QAOAAnimationCheckpoint | null {
  return checkpoints.find((checkpoint) => checkpoint.key === step.checkpoint_key) ?? null;
}

export function getCheckpointStepIndex(data: QAOAAnimationPayload, checkpointKey: string): number {
  return data.timeline.findIndex((step) => step.checkpoint_key === checkpointKey);
}

export function getPhaseStepIndex(
  data: QAOAAnimationPayload,
  checkpointKey: string,
  phase: string,
): number {
  return data.timeline.findIndex((step) => step.checkpoint_key === checkpointKey && step.phase === phase);
}

export function getPartitionFromBitstring(bitstring: string | undefined, nNodes: number): number[] {
  if (!bitstring) return Array.from({ length: nNodes }, () => 0);
  return Array.from({ length: nNodes }, (_, index) => Number(bitstring[nNodes - 1 - index] ?? 0));
}

export function getActivePhases(data: QAOAAnimationPayload, checkpointKey: string): string[] {
  const phases = new Set(
    data.timeline
      .filter((step) => step.checkpoint_key === checkpointKey)
      .map((step) => step.phase),
  );
  return PHASE_ORDER.filter((phase) => phases.has(phase));
}
