import { useCallback, useMemo } from 'react';
import { downloadBlob } from '../../utils/download';
import { convertWebmToMp4, isFFmpegSupported } from '../../utils/videoConvert';
import { EXPORT_FPS, EXPORT_VIDEO_BITRATE, EXPORT_VIDEO_HEIGHT, EXPORT_VIDEO_WIDTH } from '../constants/export';
import { wait, waitForAnimationFrames, waitForCanvasReady } from '../utils/animation-helpers';
import { getSupportedVideoMimeType } from '../utils/video-overlay';
import type { AnimationEngineReturn } from './useAnimationEngine';
import type { BaseAnimationPayload, BaseAnimationStep, ExportOverlayMode } from '../types/animation';

export interface VideoExportConfig<TData extends BaseAnimationPayload<TStep>, TStep extends BaseAnimationStep> {
  engine: AnimationEngineReturn<TData, TStep>;
  drawVideoFrame: (params: {
    ctx: CanvasRenderingContext2D;
    sourceCanvas: HTMLCanvasElement;
    data: TData;
    mode: ExportOverlayMode;
    step: TStep;
    phaseColor: string;
    totalSteps: number;
  }) => void;
  exportConfig: {
    stepMsMin: number;
    introMs: number;
    outroMs: number;
    filenamePrefix: string;
    filenameSuffix: string;
  };
  getPhaseColor: (phase: string) => string;
  sceneCamera: { position: [number, number, number]; fov: number };
  webmError?: string;
  mp4Error?: string;
}

export interface VideoExportReturn {
  handleExportVideo: () => Promise<void>;
  handleExportMp4: () => Promise<void>;
  supportedVideoMimeType: string | null;
  ffmpegReady: boolean;
}

export function useVideoExport<TData extends BaseAnimationPayload<TStep>, TStep extends BaseAnimationStep>(
  config: VideoExportConfig<TData, TStep>,
): VideoExportReturn {
  const { engine, drawVideoFrame, exportConfig, getPhaseColor, webmError, mp4Error } = config;

  const supportedVideoMimeType = useMemo(() => getSupportedVideoMimeType(), []);
  const ffmpegReady = useMemo(() => isFFmpegSupported(), []);

  const runExportPipeline = useCallback(
    async (target: 'webm' | 'mp4') => {
      if (engine.isExporting) return;

      if (!supportedVideoMimeType || typeof MediaRecorder === 'undefined') {
        engine.setExportError(
          target === 'webm'
            ? webmError ?? 'Browser ini belum mendukung export video WebM dari canvas. Gunakan Chrome, Edge, atau Firefox terbaru.'
            : mp4Error ?? 'Browser ini belum mendukung perekaman video. Gunakan Chrome, Edge, atau Firefox terbaru.',
        );
        return;
      }

      const previousStep = engine.currentStepRef.current;
      const previousSpeed = engine.speedRef.current;
      const previousPlaying = engine.isPlayingRef.current;
      const exportStepMs = Math.max(previousSpeed, exportConfig.stepMsMin);
      const compositorCanvas = document.createElement('canvas');
      const compositorContext = compositorCanvas.getContext('2d', { alpha: false });

      if (!compositorContext) {
        engine.setExportError('Gagal membuat canvas komposit untuk export video.');
        return;
      }

      compositorCanvas.width = EXPORT_VIDEO_WIDTH;
      compositorCanvas.height = EXPORT_VIDEO_HEIGHT;

      let overlayMode: ExportOverlayMode = 'intro';
      let recorder: MediaRecorder | null = null;
      let stream: MediaStream | null = null;
      let sourceCanvas: HTMLCanvasElement | null = null;
      const chunks: BlobPart[] = [];
      let cancelled = false;

      try {
        stream = compositorCanvas.captureStream(EXPORT_FPS);
        recorder = new MediaRecorder(stream, {
          mimeType: supportedVideoMimeType,
          videoBitsPerSecond: EXPORT_VIDEO_BITRATE,
        });
      } catch {
        engine.setExportError(
          target === 'webm'
            ? 'Recorder browser gagal diinisialisasi untuk export video WebM.'
            : 'Recorder browser gagal diinisialisasi.',
        );
        return;
      }

      const recorderPromise = new Promise<Blob>((resolve, reject) => {
        recorder!.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder!.onerror = () => {
          reject(new Error(target === 'webm' ? 'Recorder browser gagal membuat video WebM.' : 'Recorder browser gagal merekam video.'));
        };

        recorder!.onstop = () => {
          resolve(new Blob(chunks, { type: supportedVideoMimeType }));
        };
      });

      const drawCompositeFrame = () => {
        if (cancelled) return;
        if (!sourceCanvas) {
          engine.exportAnimationFrameRef.current = window.requestAnimationFrame(drawCompositeFrame);
          return;
        }
        const exportStep = engine.data.timeline[engine.currentStepRef.current] ?? engine.data.timeline[0];
        const exportPhaseColor = getPhaseColor(exportStep.phase);

        drawVideoFrame({
          ctx: compositorContext,
          sourceCanvas,
          data: engine.data,
          mode: overlayMode,
          step: exportStep,
          phaseColor: exportPhaseColor,
          totalSteps: engine.totalSteps,
        });

        engine.exportAnimationFrameRef.current = window.requestAnimationFrame(drawCompositeFrame);
      };

      engine.setExportError(null);
      engine.setIsExporting(true);
      engine.setIsConverting(false);

      try {
        engine.stopTimer();
        engine.setIsPlaying(false);
        engine.setCurrentStep(0);
        engine.setSpeed(exportStepMs);
        await waitForAnimationFrames(2);

        sourceCanvas = await waitForCanvasReady(
          engine.exportRendererCanvasRef,
          EXPORT_VIDEO_WIDTH,
          EXPORT_VIDEO_HEIGHT,
        );
        await waitForAnimationFrames(3);

        drawCompositeFrame();
        recorder?.start(250);

        await wait(exportConfig.introMs);

        overlayMode = 'play';
        engine.setCurrentStep(0);
        await waitForAnimationFrames(2);
        engine.setIsPlaying(true);

        const playbackDurationMs = Math.max(engine.totalSteps - 1, 0) * exportStepMs + Math.round(exportStepMs * 0.6);
        await wait(playbackDurationMs);

        engine.setIsPlaying(false);
        engine.stopTimer();
        engine.setCurrentStep(engine.totalSteps - 1);
        await waitForAnimationFrames(3);

        overlayMode = 'outro';
        await wait(exportConfig.outroMs);

        cancelled = true;
        if (engine.exportAnimationFrameRef.current !== null) {
          window.cancelAnimationFrame(engine.exportAnimationFrameRef.current);
          engine.exportAnimationFrameRef.current = null;
        }

        recorder?.stop();
        const webmBlob = await recorderPromise;

        if (target === 'mp4') {
          engine.setIsConverting(true);
          try {
            const mp4Blob = await convertWebmToMp4(webmBlob);
            downloadBlob(mp4Blob, `${exportConfig.filenamePrefix}${engine.data.case_id}_${exportConfig.filenameSuffix}.mp4`);
          } catch (conversionError) {
            downloadBlob(webmBlob, `${exportConfig.filenamePrefix}${engine.data.case_id}_${exportConfig.filenameSuffix}_fallback.webm`);
            throw new Error(
              conversionError instanceof Error
                ? `Konversi MP4 gagal (${conversionError.message}). WebM fallback sudah diunduh.`
                : 'Konversi MP4 gagal. WebM fallback sudah diunduh.',
            );
          }
        } else {
          downloadBlob(webmBlob, `${exportConfig.filenamePrefix}${engine.data.case_id}_${exportConfig.filenameSuffix}.webm`);
        }
      } catch (error) {
        engine.setExportError(
          error instanceof Error
            ? error.message
            : target === 'webm'
              ? 'Export video gagal dijalankan.'
              : 'Export MP4 gagal. Pastikan menggunakan Chrome atau Edge terbaru.',
        );
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
      } finally {
        cancelled = true;
        if (engine.exportAnimationFrameRef.current !== null) {
          window.cancelAnimationFrame(engine.exportAnimationFrameRef.current);
          engine.exportAnimationFrameRef.current = null;
        }
        stream?.getTracks().forEach((track) => track.stop());
        engine.exportRendererCanvasRef.current = null;

        engine.setSpeed(previousSpeed);
        engine.setCurrentStep(previousStep);
        engine.setIsPlaying(false);
        engine.setIsConverting(false);
        await waitForAnimationFrames(2);

        if (previousPlaying && previousStep < engine.totalSteps - 1) {
          engine.setIsPlaying(true);
        }

        engine.setIsExporting(false);
      }
    },
    [engine, drawVideoFrame, exportConfig, getPhaseColor, supportedVideoMimeType, webmError, mp4Error],
  );

  const handleExportVideo = useCallback(async () => {
    await runExportPipeline('webm');
  }, [runExportPipeline]);

  const handleExportMp4 = useCallback(async () => {
    if (engine.isExporting) return;

    if (!ffmpegReady) {
      engine.setExportError('Browser ini tidak mendukung konversi MP4 di sisi klien. Gunakan Chrome, Edge, atau Firefox terbaru.');
      return;
    }

    await runExportPipeline('mp4');
  }, [ffmpegReady, engine.isExporting, runExportPipeline, engine.setExportError]);

  return {
    handleExportVideo,
    handleExportMp4,
    supportedVideoMimeType,
    ffmpegReady,
  };
}
