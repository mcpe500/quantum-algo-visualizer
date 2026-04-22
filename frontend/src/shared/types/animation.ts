export interface BaseAnimationStep {
  step: number;
  phase: string;
  operation: string;
  description: string;
}

export interface BaseAnimationPayload<TStep extends BaseAnimationStep> {
  case_id: string;
  timeline: TStep[];
}

export interface ExportConfig {
  fps: number;
  width: number;
  height: number;
  bitrate: number;
  stepMsMin: number;
  introMs: number;
  outroMs: number;
  defaultStepMs: number;
  filenamePrefix: string;
  filenameSuffix: string;
  speedSlider: {
    min: number;
    max: number;
    step: number;
  };
}

export type ExportOverlayMode = 'intro' | 'play' | 'outro';

export type CameraMode = 'fixed' | 'orbit';
