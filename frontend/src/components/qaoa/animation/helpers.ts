import type { MutableRefObject } from 'react';
import type { QAOAAnimationCheckpoint, QAOAAnimationPayload, QAOAAnimationStep } from '../../../types/qaoa';
import { PHASE_ORDER } from './constants';

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

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

export async function waitForAnimationFrames(count = 2) {
  for (let index = 0; index < count; index += 1) {
    await waitForAnimationFrame();
  }
}

export async function waitForCanvasReady(
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  minWidth: number,
  minHeight: number,
  timeoutMs = 5000,
) {
  const start = performance.now();

  while (performance.now() - start < timeoutMs) {
    const canvas = canvasRef.current;
    if (canvas && canvas.width >= minWidth && canvas.height >= minHeight) {
      return canvas;
    }
    await waitForAnimationFrame();
  }

  throw new Error('Canvas export 1080p belum siap. Coba ulangi beberapa saat lagi.');
}
