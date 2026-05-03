/**
 * QAOA Hybrid Animation Export Plan Engine.
 * Builds a declarative export plan without browser APIs.
 */

export interface VideoExportPlan {
  caseId: string;
  totalSteps: number;
  fps: number;
  introMs: number;
  outroMs: number;
  stepMs: number;
  videoWidth: number;
  videoHeight: number;
  videoBitrate: number;
}

export function buildVideoExportPlan(
  caseId: string,
  totalSteps: number,
  speed: number,
  options: Partial<Pick<VideoExportPlan, 'fps' | 'introMs' | 'outroMs' | 'videoWidth' | 'videoHeight' | 'videoBitrate'>> = {}
): VideoExportPlan {
  const {
    fps = 30,
    introMs = 1200,
    outroMs = 1200,
    videoWidth = 1920,
    videoHeight = 1080,
    videoBitrate = 12_000_000,
  } = options;

  const stepMs = Math.max(speed, 850);

  return {
    caseId,
    totalSteps,
    fps,
    introMs,
    outroMs,
    stepMs,
    videoWidth,
    videoHeight,
    videoBitrate,
  };
}

export function calculateExportDuration(plan: VideoExportPlan): number {
  const playbackDuration = Math.max(plan.totalSteps - 1, 0) * plan.stepMs + Math.round(plan.stepMs * 0.6);
  return plan.introMs + playbackDuration + plan.outroMs;
}
