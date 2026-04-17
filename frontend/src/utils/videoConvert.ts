import type { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoading;
}

export async function convertWebmToMp4(webmBlob: Blob): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();
  const { fetchFile } = await import('@ffmpeg/util');

  await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));

  await ffmpeg.exec([
    '-i', 'input.webm',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    'output.mp4',
  ]);

  const data = await ffmpeg.readFile('output.mp4');
  let mp4Buffer: ArrayBuffer;
  if (typeof data === 'string') {
    mp4Buffer = new TextEncoder().encode(data).buffer as ArrayBuffer;
  } else {
    const copy = new Uint8Array(data.length);
    copy.set(data);
    mp4Buffer = copy.buffer as ArrayBuffer;
  }

  await ffmpeg.deleteFile('input.webm');
  await ffmpeg.deleteFile('output.mp4');

  return new Blob([mp4Buffer], { type: 'video/mp4' });
}

export function isFFmpegSupported(): boolean {
  return typeof SharedArrayBuffer !== 'undefined';
}
