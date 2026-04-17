export const PHASE_COLOR: Record<string, string> = {
  'pre-init': '#94A3B8',
  init: '#2563EB',
  prep: '#10B981',
  oracle: '#F59E0B',
  interference: '#8B5CF6',
  measure: '#EF4444',
};

export const PHASE_LABEL: Record<string, string> = {
  'pre-init': 'Keadaan Awal |0⟩',
  init: 'Inisialisasi Register',
  prep: 'Persiapan Ancilla',
  oracle: 'Oracle Nyata',
  interference: 'Interferensi',
  measure: 'Measurement',
};

export const SCENE_PHASE_LABEL: Record<string, string> = {
  'pre-init': '|0⟩',
  init: 'Init',
  prep: 'Prep anc',
  oracle: 'Oracle',
  interference: 'H akhir',
  measure: 'Ukur',
};

export const PROFILE_LABEL: Record<string, string> = {
  'constant-zero': 'CONSTANT 0',
  'constant-one': 'CONSTANT 1',
  balanced: 'BALANCED',
};

export const MARKER_STYLE: Record<string, string> = {
  H: 'bg-blue-100 text-blue-700 border-blue-300',
  X: 'bg-rose-100 text-rose-700 border-rose-300',
  M: 'bg-slate-100 text-slate-700 border-slate-300',
  '●': 'bg-violet-100 text-violet-700 border-violet-300',
  '⊕': 'bg-amber-100 text-amber-700 border-amber-300',
  '-': 'bg-slate-50 text-slate-400 border-slate-200',
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
