import type { DJAnimationStep } from '../../../types/dj';

export { wait, waitForAnimationFrame, waitForAnimationFrames, waitForCanvasReady } from '../../../shared/utils';
export { getColumnLayout, formatPercent, clamp, roundedRect, wrapText } from '../../../shared/utils';
import { getLaneYs as sharedGetLaneYs } from '../../../shared/utils';

export function getLaneYs(nQubits: number) {
  const total = nQubits + 1;
  return sharedGetLaneYs(total);
}

export function getQubitP1(probs: number[], labels: string[], qubitIdx: number, totalQubits: number) {
  let p1 = 0;
  for (let index = 0; index < probs.length; index += 1) {
    const bits = labels[index];
    if (bits && bits[totalQubits - 1 - qubitIdx] === '1') {
      p1 += probs[index];
    }
  }
  return p1;
}

export function formatCountsSummary(counts: Record<string, number>) {
  return Object.entries(counts)
    .slice(0, 3)
    .map(([state, count]) => `|${state}>:${count}`)
    .join('   ');
}

export function hasMarker(step: DJAnimationStep, marker: string, nQubits: number) {
  const wireHasMarker = Array.from({ length: nQubits }, (_, index) => step.wire_markers[String(index)] || '-')
    .some((value) => value === marker);
  return wireHasMarker || step.ancilla_marker === marker;
}
