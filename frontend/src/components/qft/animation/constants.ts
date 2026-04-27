export const PHASE_COLOR: Record<string, string> = {
  init: '#7c3aed',
  phase_cascade: '#0d9488',
  hadamard: '#2563eb',
  swap: '#f59e0b',
  measurement: '#ef4444',
};

export const PHASE_LABEL: Record<string, string> = {
  init: 'Inisialisasi Signal',
  phase_cascade: 'Phase Cascade',
  hadamard: 'Hadamard Layer',
  swap: 'SWAP Network',
  measurement: 'Measurement',
};

export const SCENE_PHASE_LABEL: Record<string, string> = {
  init: 'Init',
  phase_cascade: 'CPHASE',
  hadamard: 'H',
  swap: 'SWAP',
  measurement: 'M',
};

export const SIGNAL_TYPE_LABEL: Record<string, string> = {
  synthetic_periodic: 'Synthetic Periodic',
  impulse: 'Impulse',
  step: 'Step',
  custom: 'Custom',
};

export const EXPORT_FPS = 30;
export const DEFAULT_STEP_MS = 1300;
export const EXPORT_STEP_MS_MIN = 1400;
export const EXPORT_INTRO_MS = 1600;
export const EXPORT_OUTRO_MS = 2200;
export const EXPORT_VIDEO_WIDTH = 1920;
export const EXPORT_VIDEO_HEIGHT = 1080;
export const EXPORT_VIDEO_BITRATE = 16_000_000;

export const SPEED_SLIDER = {
  min: 250,
  max: 2000,
  step: 100,
} as const;

export const VIDEO_MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

export type ExportOverlayMode = 'intro' | 'play' | 'outro';
