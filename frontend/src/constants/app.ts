export const DEFAULT_SHOTS = 1024;

export const CAPTURE_IDS = {
  qft: 'qft-capture',
  qaoa: 'qaoa-capture',
  vqe: 'vqe-capture',
  djClassic: 'dj-classic-capture',
  djQuantum: 'dj-quantum-capture',
} as const;

export const HTML2CANVAS_CAPTURE_OPTIONS = {
  backgroundColor: '#FAFAFA',
  scale: 2,
  useCORS: true,
} as const;
