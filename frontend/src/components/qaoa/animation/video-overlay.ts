import type { QAOAAnimationPayload, QAOAAnimationStep } from '../../../types/qaoa';
import { PHASE_LABEL, VIDEO_MIME_TYPES, type ExportOverlayMode } from './constants';
import { getStepExplanation, getStepHeadline } from './narration';

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
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

function drawLegendPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  fill: string,
  textColor = '#E2E8F0',
) {
  ctx.font = '600 13px Inter, Segoe UI, Arial, sans-serif';
  const width = ctx.measureText(label).width + 26;
  roundedRect(ctx, x, y, width, 28, 999);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.fillText(label, x + 13, y + 19);
  return width;
}

export function getSupportedVideoMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return null;
  }

  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return VIDEO_MIME_TYPES[VIDEO_MIME_TYPES.length - 1];
  }

  return VIDEO_MIME_TYPES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

function getExportNarration(mode: ExportOverlayMode, data: QAOAAnimationPayload, step: QAOAAnimationStep) {
  if (mode === 'intro') {
    return {
      headline: 'Loop hybrid QAOA untuk Max-Cut',
      detail: `${data.case_id} memadukan optimizer klasik, cost Hamiltonian Ising, mixer ansatz, dan measurement ${data.shots} shots untuk mencari partisi cut terbaik.`,
      accent: `Checkpoint: ${step.checkpoint_label} | p = ${data.p_layers}`,
    };
  }

  if (mode === 'outro') {
    return {
      headline: 'Parameter terbaik dipilih sebagai solusi akhir',
      detail: `Bitstring dominan ${step.candidate_bitstring ?? '-'} menghasilkan cut ${step.cut_value ?? data.quantum.best_cut}. Nilai ini dibandingkan dengan exact optimum dan Simulated Annealing.`,
      accent: `Best so far: ${step.best_so_far.toFixed(3)} | Approx ratio: ${data.quantum.approx_ratio.toFixed(3)}`,
    };
  }

  return {
    headline: getStepHeadline(step),
    detail: getStepExplanation(step),
    accent: `Phase: ${PHASE_LABEL[step.phase] || step.phase} | Expected cut: ${step.expected_cut.toFixed(3)}`,
  };
}

export function drawVideoFrame({
  ctx,
  sourceCanvas,
  data,
  mode,
  step,
  phaseColor,
}: {
  ctx: CanvasRenderingContext2D;
  sourceCanvas: HTMLCanvasElement;
  data: QAOAAnimationPayload;
  mode: ExportOverlayMode;
  step: QAOAAnimationStep;
  phaseColor: string;
}) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const narration = getExportNarration(mode, data, step);
  const overlayPadding = Math.round(width * 0.038);
  const bottomPanelHeight = Math.round(height * 0.23);
  const topPanelHeight = Math.round(height * 0.15);
  const topY = overlayPadding;
  const bottomY = height - bottomPanelHeight - overlayPadding;
  const bodyMaxWidth = width - overlayPadding * 2 - 32;

  const baseGradient = ctx.createLinearGradient(0, 0, 0, height);
  baseGradient.addColorStop(0, '#F8FAFC');
  baseGradient.addColorStop(1, '#E2E8F0');

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  const topGradient = ctx.createLinearGradient(0, 0, 0, topPanelHeight + overlayPadding * 1.5);
  topGradient.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
  topGradient.addColorStop(1, 'rgba(15, 23, 42, 0.18)');
  ctx.fillStyle = topGradient;
  ctx.fillRect(0, 0, width, topPanelHeight + overlayPadding * 1.5);

  const bottomGradient = ctx.createLinearGradient(0, height, 0, height - bottomPanelHeight - overlayPadding * 2);
  bottomGradient.addColorStop(0, 'rgba(15, 23, 42, 0.94)');
  bottomGradient.addColorStop(1, 'rgba(15, 23, 42, 0.2)');
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(0, bottomY - overlayPadding, width, bottomPanelHeight + overlayPadding * 2);

  roundedRect(ctx, overlayPadding, topY, width - overlayPadding * 2, topPanelHeight, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();

  roundedRect(ctx, overlayPadding, bottomY, width - overlayPadding * 2, bottomPanelHeight, 24);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '600 18px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText('VIDEO QUANTUM', overlayPadding + 28, topY + 32);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 30px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText(`QAOA · ${data.case_id}`, overlayPadding + 28, topY + 68);

  let legendX = overlayPadding + 28;
  const legendY = topY + 88;
  legendX += drawLegendPill(ctx, legendX, legendY, 'Graph = problem input', 'rgba(37, 99, 235, 0.18)') + 10;
  legendX += drawLegendPill(ctx, legendX, legendY, 'Cost = edge aktif', 'rgba(249, 115, 22, 0.18)') + 10;
  legendX += drawLegendPill(ctx, legendX, legendY, 'Mixer = qubit rotasi', 'rgba(13, 148, 136, 0.18)') + 10;
  drawLegendPill(ctx, legendX, legendY, 'Measurement = partisi cut', 'rgba(22, 163, 74, 0.18)');

  roundedRect(ctx, width - overlayPadding - 250, topY + 22, 222, 44, 999);
  ctx.fillStyle = `${phaseColor}55`;
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 17px Inter, Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(PHASE_LABEL[step.phase] || step.phase, width - overlayPadding - 139, topY + 50);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 16px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText(`Step ${step.step + 1}/${data.timeline.length}`, overlayPadding + 28, bottomY + 34);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 28px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText(narration.headline, overlayPadding + 28, bottomY + 76);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '500 19px Inter, Segoe UI, Arial, sans-serif';
  const bodyLines = wrapText(ctx, narration.detail, bodyMaxWidth).slice(0, 3);
  bodyLines.forEach((line, index) => {
    ctx.fillText(line, overlayPadding + 28, bottomY + 114 + index * 28);
  });

  ctx.fillStyle = phaseColor;
  ctx.font = '600 17px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText(narration.accent, overlayPadding + 28, bottomY + bottomPanelHeight - 20);
}
