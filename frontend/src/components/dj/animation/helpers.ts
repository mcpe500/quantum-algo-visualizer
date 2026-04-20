import type { DJAnimationStep } from '../../../types/dj';

export { wait, waitForAnimationFrame, waitForAnimationFrames, waitForCanvasReady } from '../../../shared/utils';
export { getColumnLayout, formatPercent } from '../../../shared/utils';
export { clamp } from '../../../shared/utils';
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

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const nextRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + nextRadius, y);
  ctx.lineTo(x + width - nextRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + nextRadius);
  ctx.lineTo(x + width, y + height - nextRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - nextRadius, y + height);
  ctx.lineTo(x + nextRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - nextRadius);
  ctx.lineTo(x, y + nextRadius);
  ctx.quadraticCurveTo(x, y, x + nextRadius, y);
  ctx.closePath();
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate;
      continue;
    }
    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
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
