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
  const tau = 2 * Math.PI;
  const normalized = angle % tau;
  return normalized < 0 ? normalized + tau : normalized;
}

export function getLaneYs(total: number) {
  const gap = total >= 5 ? 1.38 : 1.52;
  return Array.from({ length: total }, (_, index) => ((total - 1) / 2 - index) * gap);
}

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
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
  if (currentLine) lines.push(currentLine);
  return lines;
}
