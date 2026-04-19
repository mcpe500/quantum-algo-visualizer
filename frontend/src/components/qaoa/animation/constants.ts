export const PHASE_COLOR: Record<string, string> = {
  optimizer: '#2563eb',
  superposition: '#7c3aed',
  cost: '#f97316',
  mixer: '#0d9488',
  measurement: '#16a34a',
  update: '#dc2626',
};

export const PHASE_LABEL: Record<string, string> = {
  optimizer: 'Optimizer',
  superposition: 'Superposition',
  cost: 'Cost',
  mixer: 'Mixer',
  measurement: 'Measurement',
  update: 'Update',
};

export const CHECKPOINT_LABEL: Record<string, string> = {
  initial: 'Awal',
  middle: 'Tengah',
  best: 'Terbaik',
};

export const DEFAULT_STEP_MS = 1350;

export const EXPORT_FPS = 30;
export const EXPORT_INTRO_MS = 1200;
export const EXPORT_OUTRO_MS = 1200;
export const EXPORT_STEP_MS_MIN = 850;
export const EXPORT_VIDEO_WIDTH = 1920;
export const EXPORT_VIDEO_HEIGHT = 1080;
export const EXPORT_VIDEO_BITRATE = 12_000_000;
export const VIDEO_MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const;

export const SPEED_SLIDER = {
  min: 300,
  max: 2200,
  step: 100,
} as const;

export const PHASE_ORDER = ['optimizer', 'superposition', 'cost', 'mixer', 'measurement', 'update'] as const;

export type ExportOverlayMode = 'intro' | 'play' | 'outro';
