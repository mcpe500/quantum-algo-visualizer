import type { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

const LOAD_TIMEOUT_MS = 45_000;
const EXEC_TIMEOUT_MS = 120_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');

    const ffmpeg = new FFmpeg();

    const baseCandidates = [
      'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm',
      'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm',
    ];

    let lastError: unknown = null;
    for (const baseURL of baseCandidates) {
      try {
        const coreURL = await withTimeout(
          toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          LOAD_TIMEOUT_MS,
          'Mengunduh mesin MP4 terlalu lama (core.js timeout).',
        );
        const wasmURL = await withTimeout(
          toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          LOAD_TIMEOUT_MS,
          'Mengunduh mesin MP4 terlalu lama (core.wasm timeout).',
        );

        await withTimeout(
          ffmpeg.load({
            coreURL,
            wasmURL,
          }),
          LOAD_TIMEOUT_MS,
          'Memuat mesin MP4 terlalu lama (timeout). Periksa koneksi internet.',
        );
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw lastError instanceof Error
        ? lastError
        : new Error('Gagal memuat mesin MP4 di browser.');
    }

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await ffmpegLoading;
  } catch (error) {
    ffmpegLoading = null;
    throw error;
  }
}

export async function convertWebmToMp4(webmBlob: Blob): Promise<Blob> {
  const ffmpeg = await loadFFmpeg();
  const { fetchFile } = await import('@ffmpeg/util');

  await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));

  try {
    await withTimeout(
      ffmpeg.exec(['-i', 'input.webm', '-pix_fmt', 'yuv420p', 'output.mp4']),
      EXEC_TIMEOUT_MS,
      'Konversi MP4 terlalu lama (timeout). Coba ulangi atau gunakan WebM.',
    );

    const data = await ffmpeg.readFile('output.mp4');
    let mp4Buffer: ArrayBuffer;
    if (typeof data === 'string') {
      mp4Buffer = new TextEncoder().encode(data).buffer as ArrayBuffer;
    } else {
      const copy = new Uint8Array(data.length);
      copy.set(data);
      mp4Buffer = copy.buffer as ArrayBuffer;
    }

    return new Blob([mp4Buffer], { type: 'video/mp4' });
  } finally {
    try {
      await ffmpeg.deleteFile('input.webm');
    } catch {
      // ignore cleanup error
    }
    try {
      await ffmpeg.deleteFile('output.mp4');
    } catch {
      // ignore cleanup error
    }
  }
}

export function isFFmpegSupported(): boolean {
  return typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined';
}
