import { VIDEO_MIME_TYPES } from '../constants/export';
import { roundedRect, wrapText } from './animation-helpers';

export function getSupportedVideoMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return null;
  }

  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return VIDEO_MIME_TYPES[VIDEO_MIME_TYPES.length - 1];
  }

  return VIDEO_MIME_TYPES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
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

export interface VideoOverlayConfig<TData = unknown, TStep = unknown> {
  title: (data: TData) => string;
  legendPills: Array<{ label: string; fill: string }>;
  topPanelRatio?: number;
  bottomPanelRatio?: number;
  topGradientFrom?: string;
  topGradientTo?: string;
  bottomGradientFrom?: string;
  bottomGradientTo?: string;
  topPanelFill?: string;
  bottomPanelFill?: string;
  topGradientMultiplier?: number;
  bottomGradientMultiplier?: number;
  stepOffset?: number;
  getNarration: (mode: 'intro' | 'play' | 'outro', data: TData, step: TStep) => { headline: string; detail: string; accent: string };
  getPhaseLabel: (phase: string) => string;
}

export function createVideoFrameRenderer<TData, TStep>(config: VideoOverlayConfig<TData, TStep>) {
  const topPanelRatio = config.topPanelRatio ?? 0.12;
  const bottomPanelRatio = config.bottomPanelRatio ?? 0.18;
  const topGradientFrom = config.topGradientFrom ?? 'rgba(15, 23, 42, 0.88)';
  const topGradientTo = config.topGradientTo ?? 'rgba(15, 23, 42, 0.08)';
  const bottomGradientFrom = config.bottomGradientFrom ?? 'rgba(15, 23, 42, 0.88)';
  const bottomGradientTo = config.bottomGradientTo ?? 'rgba(15, 23, 42, 0.04)';
  const topPanelFill = config.topPanelFill ?? 'rgba(255, 255, 255, 0.06)';
  const bottomPanelFill = config.bottomPanelFill ?? 'rgba(15, 23, 42, 0.60)';
  const topGradientMultiplier = config.topGradientMultiplier ?? 1.2;
  const bottomGradientMultiplier = config.bottomGradientMultiplier ?? 1.5;
  const stepOffset = config.stepOffset ?? 0;

  return function drawVideoFrame({
    ctx,
    sourceCanvas,
    data,
    mode,
    step,
    phaseColor,
    totalSteps,
  }: {
    ctx: CanvasRenderingContext2D;
    sourceCanvas: HTMLCanvasElement;
    data: TData;
    mode: 'intro' | 'play' | 'outro';
    step: TStep;
    phaseColor: string;
    totalSteps: number;
  }) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const narration = config.getNarration(mode, data, step);
    const overlayPadding = Math.round(width * 0.038);
    const bottomPanelHeight = Math.round(height * bottomPanelRatio);
    const topPanelHeight = Math.round(height * topPanelRatio);
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

    const topGradient = ctx.createLinearGradient(0, 0, 0, topPanelHeight + overlayPadding * topGradientMultiplier);
    topGradient.addColorStop(0, topGradientFrom);
    topGradient.addColorStop(1, topGradientTo);
    ctx.fillStyle = topGradient;
    ctx.fillRect(0, 0, width, topPanelHeight + overlayPadding * topGradientMultiplier);

    const bottomGradient = ctx.createLinearGradient(0, height, 0, height - bottomPanelHeight - overlayPadding * bottomGradientMultiplier);
    bottomGradient.addColorStop(0, bottomGradientFrom);
    bottomGradient.addColorStop(1, bottomGradientTo);
    ctx.fillStyle = bottomGradient;
    ctx.fillRect(0, bottomY - overlayPadding, width, bottomPanelHeight + overlayPadding * bottomGradientMultiplier);

    roundedRect(ctx, overlayPadding, topY, width - overlayPadding * 2, topPanelHeight, 20);
    ctx.fillStyle = topPanelFill;
    ctx.fill();

    roundedRect(ctx, overlayPadding, bottomY, width - overlayPadding * 2, bottomPanelHeight, 24);
    ctx.fillStyle = bottomPanelFill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '600 18px Inter, Segoe UI, Arial, sans-serif';
    ctx.fillText('VIDEO QUANTUM', overlayPadding + 28, topY + 32);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 30px Inter, Segoe UI, Arial, sans-serif';
    ctx.fillText(config.title(data), overlayPadding + 28, topY + 68);

    let legendX = overlayPadding + 28;
    const legendY = topY + 88;
    for (const pill of config.legendPills) {
      legendX += drawLegendPill(ctx, legendX, legendY, pill.label, pill.fill) + 10;
    }

    const stepNumber = stepOffset + ((step as Record<string, unknown>).step as number);
    const phaseLabel = config.getPhaseLabel((step as Record<string, unknown>).phase as string);

    roundedRect(ctx, width - overlayPadding - 250, topY + 22, 222, 44, 999);
    ctx.fillStyle = `${phaseColor}55`;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 17px Inter, Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(phaseLabel, width - overlayPadding - 139, topY + 50);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 16px Inter, Segoe UI, Arial, sans-serif';
    ctx.fillText(`Step ${stepNumber}/${totalSteps}`, overlayPadding + 28, bottomY + 34);

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
  };
}
