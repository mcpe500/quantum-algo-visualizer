import type { MutableRefObject } from 'react';

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

export function getLaneYs(nQubits: number) {
  const gap = nQubits >= 4 ? 1.38 : 1.52;
  return Array.from({ length: nQubits }, (_, index) => ((nQubits - 1) / 2 - index) * gap);
}

export function getColumnLayout(stepCount: number) {
  const span = stepCount <= 10 ? 14 : stepCount <= 18 ? 18 : stepCount <= 26 ? 21 : 24;
  const startX = -span / 2;
  const endX = span / 2;
  const gap = stepCount > 1 ? span / (stepCount - 1) : 0;
  const columnXs = Array.from({ length: stepCount }, (_, index) => (stepCount === 1 ? 0 : startX + index * gap));
  return { startX, endX, gap, columnXs };
}

export function formatPercent(value: number) {
  const percent = value * 100;
  if (percent >= 10) return `${percent.toFixed(1)}%`;
  return `${percent.toFixed(2)}%`;
}

export function formatRadians(radians: number) {
  const degrees = (radians * 180) / Math.PI;
  if (degrees >= 10) return `${degrees.toFixed(1)}°`;
  return `${degrees.toFixed(2)}°`;
}

export function formatComplex(c: { re: number; im: number }) {
  const real = c.re.toFixed(3);
  const imag = Math.abs(c.im).toFixed(3);
  const sign = c.im >= 0 ? '+' : '-';
  return `${real} ${sign} ${imag}i`;
}

export function radiansToDegrees(rad: number) {
  return (rad * 180) / Math.PI;
}

export function degreesToRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export function normalizeAngle(angle: number) {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
}