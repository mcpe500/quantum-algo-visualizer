import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Gauge, LoaderCircle, Lock, Move3D, Pause, Play, RotateCcw, SkipForward, Video } from 'lucide-react';
import type { QAOAAnimationPayload } from '../../types/qaoa';
import { downloadBlob } from '../../utils/download';
import { convertWebmToMp4, isFFmpegSupported } from '../../utils/videoConvert';
import {
  DEFAULT_STEP_MS,
  EXPORT_FPS,
  EXPORT_INTRO_MS,
  EXPORT_OUTRO_MS,
  EXPORT_STEP_MS_MIN,
  EXPORT_VIDEO_BITRATE,
  EXPORT_VIDEO_HEIGHT,
  EXPORT_VIDEO_WIDTH,
  PHASE_COLOR,
  PHASE_LABEL,
  SPEED_SLIDER,
  type ExportOverlayMode,
} from './animation/constants';
import {
  getPhaseStepIndex,
  getCheckpointStepIndex,
  wait,
  waitForAnimationFrames,
  waitForCanvasReady,
} from './animation/helpers';
import {
  CheckpointRail,
  CutResultPanel,
  DetailCard,
  HybridLoopPanel,
  PhaseStepper,
  ProblemGraphPanel,
  ReadingGuideCard,
  CostMixerPanel,
} from './animation/panels';
import { QAOAStoryScene } from './animation/scene-primitives';
import { drawVideoFrame, getSupportedVideoMimeType } from './animation/video-overlay';
import {
  buildQaoaHybridTimelineModel,
  buildQaoaSceneModel,
  useQaoaHybridPlayback,
  buildVideoExportPlan,
  calculateExportDuration,
} from '../../engine/qaoa/hybrid-animation';

interface QAOAHybridAnimationProps {
  data: QAOAAnimationPayload;
}

export function QAOAHybridAnimation({ data }: QAOAHybridAnimationProps) {
  const timelineModel = useMemo(() => buildQaoaHybridTimelineModel(data), [data]);
  const totalSteps = timelineModel.totalSteps;

  const {
    state: playback,
    speed,
    setSpeed,
    speedRef,
    play,
    pause,
    reset,
    stepForward,
    jump,
  } = useQaoaHybridPlayback(totalSteps, DEFAULT_STEP_MS);

  const currentStep = playback.currentStep;
  const isPlaying = playback.isPlaying;
  const [cameraMode, setCameraMode] = useState<'fixed' | 'orbit'>('fixed');
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportRendererCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportAnimationFrameRef = useRef<number | null>(null);
  const currentStepRef = useRef(currentStep);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const activeStep = data.timeline[currentStep];
  const activePhaseColor = PHASE_COLOR[activeStep.phase] || '#2563eb';
  const isLastStep = currentStep >= totalSteps - 1;
  const supportedVideoMimeType = useMemo(() => getSupportedVideoMimeType(), []);
  const ffmpegReady = useMemo(() => isFFmpegSupported(), []);

  const sceneModel = useMemo(() => buildQaoaSceneModel(data, currentStep), [data, currentStep]);

  useEffect(() => {
    queueMicrotask(() => {
      reset();
      setExportError(null);
    });
  }, [data.case_id, reset]);

  useEffect(() => {
    return () => {
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
      }
    };
  }, []);

  const handlePlay = () => {
    if (isExporting) return;
    if (isLastStep) reset();
    play();
  };

  const handlePause = () => {
    if (isExporting) return;
    pause();
  };

  const handleStep = () => {
    if (isExporting) return;
    pause();
    stepForward();
  };

  const handleReset = () => {
    if (isExporting) return;
    pause();
    reset();
  };

  const handleJumpCheckpoint = useCallback((checkpointKey: string) => {
    if (isExporting) return;
    const index = getCheckpointStepIndex(data, checkpointKey);
    if (index >= 0) {
      jump(index);
    }
  }, [data, isExporting, jump]);

  const handleJumpPhase = useCallback((phase: string) => {
    if (isExporting) return;
    const index = getPhaseStepIndex(data, activeStep.checkpoint_key, phase);
    if (index >= 0) {
      jump(index);
    }
  }, [activeStep.checkpoint_key, data, isExporting, jump]);

  const runExportPipeline = useCallback(async (target: 'webm' | 'mp4') => {
    if (isExporting) return;

    if (!supportedVideoMimeType || typeof MediaRecorder === 'undefined') {
      setExportError(
        target === 'webm'
          ? 'Browser ini belum mendukung export video WebM dari canvas. Gunakan Chrome, Edge, atau Firefox terbaru.'
          : 'Browser ini belum mendukung perekaman video. Gunakan Chrome, Edge, atau Firefox terbaru.',
      );
      return;
    }

    const previousStep = currentStepRef.current;
    const previousSpeed = speedRef.current;
    const previousPlaying = isPlayingRef.current;
    const exportPlan = buildVideoExportPlan(data.case_id, totalSteps, previousSpeed);
    const exportStepMs = exportPlan.stepMs;
    const compositorCanvas = document.createElement('canvas');
    const compositorContext = compositorCanvas.getContext('2d', { alpha: false });

    if (!compositorContext) {
      setExportError('Gagal membuat canvas komposit untuk export video.');
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
      setExportError(
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
        exportAnimationFrameRef.current = window.requestAnimationFrame(drawCompositeFrame);
        return;
      }

      const exportStep = data.timeline[currentStepRef.current] ?? data.timeline[0];
      const exportPhaseColor = PHASE_COLOR[exportStep.phase] || '#2563eb';

      drawVideoFrame({
        ctx: compositorContext,
        sourceCanvas,
        data,
        mode: overlayMode,
        step: exportStep,
        phaseColor: exportPhaseColor,
      });

      exportAnimationFrameRef.current = window.requestAnimationFrame(drawCompositeFrame);
    };

    setExportError(null);
    setIsExporting(true);
    setIsConverting(false);

    try {
      pause();
      reset();
      setSpeed(exportStepMs);
      await waitForAnimationFrames(2);

      sourceCanvas = await waitForCanvasReady(
        exportRendererCanvasRef,
        EXPORT_VIDEO_WIDTH,
        EXPORT_VIDEO_HEIGHT,
      );
      await waitForAnimationFrames(3);

      drawCompositeFrame();
      recorder.start(250);

      await wait(EXPORT_INTRO_MS);

      overlayMode = 'play';
      reset();
      await waitForAnimationFrames(2);
      play();

      const playbackDurationMs = calculateExportDuration(exportPlan) - EXPORT_INTRO_MS - EXPORT_OUTRO_MS;
      await wait(playbackDurationMs);

      pause();
      jump(totalSteps - 1);
      await waitForAnimationFrames(3);

      overlayMode = 'outro';
      await wait(EXPORT_OUTRO_MS);

      cancelled = true;
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
        exportAnimationFrameRef.current = null;
      }

      recorder.stop();
      const webmBlob = await recorderPromise;

      if (target === 'mp4') {
        setIsConverting(true);
        const mp4Blob = await convertWebmToMp4(webmBlob);
        downloadBlob(mp4Blob, `qaoa_${data.case_id}_video-hybrid.mp4`);
      } else {
        downloadBlob(webmBlob, `qaoa_${data.case_id}_video-hybrid.webm`);
      }
    } catch (error) {
      setExportError(
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
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
        exportAnimationFrameRef.current = null;
      }
      stream?.getTracks().forEach((track) => track.stop());
      exportRendererCanvasRef.current = null;

      setSpeed(previousSpeed);
      jump(previousStep);
      pause();
      setIsConverting(false);
      await waitForAnimationFrames(2);

      if (previousPlaying && previousStep < totalSteps - 1) {
        play();
      }

      setIsExporting(false);
    }
  }, [data, isExporting, pause, play, jump, reset, setSpeed, speedRef, supportedVideoMimeType, totalSteps]);

  const handleExportVideo = useCallback(async () => {
    await runExportPipeline('webm');
  }, [runExportPipeline]);

  const handleExportMp4 = useCallback(async () => {
    if (isExporting) return;
    if (!ffmpegReady) {
      setExportError('Browser ini tidak mendukung konversi MP4 di sisi klien. Gunakan browser modern yang mendukung WebAssembly + Worker.');
      return;
    }
    await runExportPipeline('mp4');
  }, [ffmpegReady, isExporting, runExportPipeline]);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-slate-300 bg-white">
      <header className="px-5 pt-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Animasi QAOA Three.js
        </p>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">
              {data.case_id} · Quantum Approximate Optimization Algorithm
            </h2>
            <p className="mt-2 text-[14px] leading-7 text-slate-600">
              Visualisasi loop hybrid QAOA untuk Max-Cut. Graph dari dataset dipetakan ke Hamiltonian Ising,
              optimizer klasik memilih parameter, sirkuit kuantum cost-mixer dievaluasi, lalu hasil
              measurement digunakan untuk memperbarui objective.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DetailCard label="Nodes" value={`${data.n_nodes}`} hint="Dari dataset JSON." />
            <DetailCard label="Edges" value={`${data.n_edges}`} hint="Masalah Max-Cut." />
            <DetailCard label="Layers" value={`${data.p_layers}`} hint="Ansatz QAOA." />
            <DetailCard label="Shots" value={`${data.shots}`} hint={`${data.shots} shots.`} />
          </div>
        </div>
      </header>

      <CheckpointRail
        checkpoints={data.checkpoints}
        activeCheckpointKey={activeStep.checkpoint_key}
        onJump={handleJumpCheckpoint}
      />

      <PhaseStepper data={data} activeStep={activeStep} onJump={handleJumpPhase} />

      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-600">
                {Object.entries(PHASE_LABEL).map(([phase, label]) => (
                  <span key={phase} className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PHASE_COLOR[phase] }} />
                    {label}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setCameraMode((previous) => (previous === 'fixed' ? 'orbit' : 'fixed'))}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {cameraMode === 'fixed' ? <Lock className="h-3.5 w-3.5" /> : <Move3D className="h-3.5 w-3.5" />}
                {cameraMode === 'fixed' ? 'Fixed Camera' : 'Orbit Camera'}
              </button>
            </div>

            <div className="relative border-t border-slate-200">
              <div className="absolute left-4 top-4 z-10">
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold shadow-sm"
                  style={{
                    backgroundColor: `${activePhaseColor}18`,
                    borderColor: `${activePhaseColor}55`,
                    color: activePhaseColor,
                  }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: activePhaseColor }} />
                  {activeStep.checkpoint_label} · {PHASE_LABEL[activeStep.phase] || activeStep.phase}
                </div>
              </div>

              <div style={{ height: '560px' }}>
                <Canvas
                  camera={{ position: sceneModel.camera.position, fov: 36, near: 0.1, far: 100 }}
                  style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
                  gl={{ antialias: true }}
                >
                  <QAOAStoryScene data={data} activeStep={activeStep} cameraMode={cameraMode} />
                </Canvas>
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Step Aktif</p>
              <p className="mt-1 text-[18px] font-semibold text-slate-900">
                Step {activeStep.step + 1} · {activeStep.operation}
              </p>
              <p className="mt-2 text-[14px] leading-7 text-slate-600">{activeStep.description}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[13px] text-blue-700">
                <span className="font-semibold">Expected cut:</span>
                <span className="font-mono">{activeStep.expected_cut.toFixed(3)}</span>
                <span className="font-semibold">Best so far:</span>
                <span className="font-mono">{activeStep.best_so_far.toFixed(3)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                disabled={isExporting}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>

              <button
                onClick={handleStep}
                disabled={isLastStep || isExporting}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              <button
                onClick={handleReset}
                disabled={isExporting}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <div className="ml-1 flex min-w-[220px] flex-1 items-center gap-2">
                <Gauge className="h-4 w-4 text-slate-500" />
                <input
                  type="range"
                  min={SPEED_SLIDER.min}
                  max={SPEED_SLIDER.max}
                  step={SPEED_SLIDER.step}
                  value={speed}
                  disabled={isExporting}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                  className="h-1.5 flex-1 accent-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                />
                <span className="w-[62px] text-[11px] text-slate-600">{speed}ms</span>
              </div>

              <span className="font-mono text-[12px] text-slate-500">
                {currentStep + 1}/{totalSteps}
              </span>

              <button
                onClick={handleExportVideo}
                disabled={isExporting || !supportedVideoMimeType}
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3.5 py-2 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isExporting && !isConverting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                {isExporting && !isConverting ? 'Merekam...' : 'WebM 1080p'}
              </button>

              <button
                onClick={handleExportMp4}
                disabled={isExporting || !supportedVideoMimeType || !ffmpegReady}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isConverting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                {isConverting ? 'Mengkonversi ke MP4...' : 'MP4 1080p'}
              </button>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%`, backgroundColor: activePhaseColor }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3 text-[12px] leading-6 text-slate-500">
              <p>
                WebM direkam langsung dari canvas 1920x1080. MP4 direkam sebagai WebM lalu dikonversi di browser memakai FFmpeg.wasm.
              </p>
              {!supportedVideoMimeType && (
                <p className="text-rose-600">
                  Browser belum mendukung export video. Gunakan Chrome, Edge, atau Firefox terbaru.
                </p>
              )}
              {!ffmpegReady && (
                <p className="text-amber-600">
                  MP4 tidak tersedia di browser ini. Gunakan browser modern yang mendukung WebAssembly dan Worker.
                </p>
              )}
              {exportError && (
                <p className="text-rose-600">
                  {exportError}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ReadingGuideCard step={activeStep} />
          <ProblemGraphPanel data={data} />
          <HybridLoopPanel data={data} activeStep={activeStep} />
          <CostMixerPanel activeStep={activeStep} />
          <CutResultPanel data={data} activeStep={activeStep} />
        </div>
      </div>

      {isExporting && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: '0',
            width: `${EXPORT_VIDEO_WIDTH}px`,
            height: `${EXPORT_VIDEO_HEIGHT}px`,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <Canvas
            dpr={1}
            camera={{ position: sceneModel.camera.position, fov: 36, near: 0.1, far: 100 }}
            style={{ width: `${EXPORT_VIDEO_WIDTH}px`, height: `${EXPORT_VIDEO_HEIGHT}px` }}
            gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setPixelRatio(1);
              gl.setSize(EXPORT_VIDEO_WIDTH, EXPORT_VIDEO_HEIGHT, false);
              exportRendererCanvasRef.current = gl.domElement;
            }}
          >
            <QAOAStoryScene data={data} activeStep={activeStep} cameraMode={cameraMode} />
          </Canvas>
        </div>
      )}
    </div>
  );
}
