export const EXPORT_FPS = 30;

export const EXPORT_VIDEO_WIDTH = 1920;

export const EXPORT_VIDEO_HEIGHT = 1080;

export const EXPORT_VIDEO_BITRATE = 16_000_000;

export const VIDEO_MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const;
