import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Gauge, LoaderCircle, Lock, Move3D, Pause, Play, RotateCcw, SkipForward, Video } from 'lucide-react';
import type { DJAnimationPayload } from '../../types/dj';
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
import { wait, waitForAnimationFrames, waitForCanvasReady } from './animation/helpers';
import {
  ActiveMarkerStrip,
  DetailCard,
  FinalAmplitudePanel,
  MeasurementPanel,
  OracleConstructionPanel,
  PhaseStepper,
  ReadingGuideCard,
  StateSummaryPanel,
  TruthTablePanel,
} from './animation/panels';
import { StoryScene } from './animation/scene-primitives';
import { drawVideoFrame, getSupportedVideoMimeType } from './animation/video-overlay';

interface DJQuantumAnimationProps {
  data: DJAnimationPayload;
  onExportingChange?: (isExporting: boolean) => void;
}

export function DJQuantumAnimation({ data, onExportingChange }: DJQuantumAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_STEP_MS);
  const [cameraMode, setCameraMode] = useState<'fixed' | 'orbit'>('fixed');
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStepRef = useRef(currentStep);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const exportRendererCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportAnimationFrameRef = useRef<number | null>(null);

  const totalSteps = data.timeline.length;
  const activeStep = data.timeline[currentStep];
  const activePhase = activeStep.phase;
  const phaseColor = PHASE_COLOR[activePhase] || '#2563EB';
  const isLastStep = currentStep >= totalSteps - 1;
  const canvasHeight = data.n_qubits >= 4 || totalSteps > 18 ? 560 : 520;
  const supportedVideoMimeType = useMemo(() => getSupportedVideoMimeType(), []);
  const ffmpegReady = useMemo(() => isFFmpegSupported(), []);

  const stopTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    onExportingChange?.(isExporting);
  }, [isExporting, onExportingChange]);

  useEffect(() => {
    return () => {
      onExportingChange?.(false);
    };
  }, [onExportingChange]);

  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      timerRef.current = setInterval(() => {
        setCurrentStep((previous) => {
          if (previous >= totalSteps - 1) {
            setIsPlaying(false);
            return previous;
          }
          return previous + 1;
        });
      }, speed);
    } else {
      stopTimer();
      if (currentStep >= totalSteps - 1) setIsPlaying(false);
    }

    return stopTimer;
  }, [currentStep, isPlaying, speed, stopTimer, totalSteps]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    setExportError(null);
    stopTimer();
  }, [data.case_id, stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
      }
    };
  }, [stopTimer]);

  const handlePlay = () => {
    if (isExporting) return;
    if (isLastStep) setCurrentStep(0);
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (isExporting) return;
    setIsPlaying(false);
    stopTimer();
  };

  const handleStep = () => {
    if (isExporting) return;
    setIsPlaying(false);
    stopTimer();
    setCurrentStep((previous) => Math.min(previous + 1, totalSteps - 1));
  };

  const handleReset = () => {
    if (isExporting) return;
    setIsPlaying(false);
    stopTimer();
    setCurrentStep(0);
  };

  const handleJumpPhase = useCallback((phase: string) => {
    if (isExporting) return;
    const index = data.timeline.findIndex((step) => step.phase === phase);
    if (index >= 0) {
      setCurrentStep(index);
      setIsPlaying(false);
      stopTimer();
    }
  }, [data.timeline, isExporting, stopTimer]);

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
    const exportStepMs = Math.max(previousSpeed, EXPORT_STEP_MS_MIN);
    const compositorCanvas = document.createElement('canvas');
    const exportWidth = EXPORT_VIDEO_WIDTH;
    const exportHeight = EXPORT_VIDEO_HEIGHT;
    const compositorContext = compositorCanvas.getContext('2d', { alpha: false });

    if (!compositorContext) {
      setExportError('Gagal membuat canvas komposit untuk export video.');
      return;
    }

    compositorCanvas.width = exportWidth;
    compositorCanvas.height = exportHeight;

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
      const exportPhaseColor = PHASE_COLOR[exportStep.phase] || '#2563EB';

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
      stopTimer();
      setIsPlaying(false);
      setCurrentStep(0);
      setSpeed(exportStepMs);
      await waitForAnimationFrames(2);

      sourceCanvas = await waitForCanvasReady(
        exportRendererCanvasRef,
        EXPORT_VIDEO_WIDTH,
        EXPORT_VIDEO_HEIGHT,
      );
      await waitForAnimationFrames(3);

      drawCompositeFrame();
      recorder?.start(250);

      await wait(EXPORT_INTRO_MS);

      overlayMode = 'play';
      setCurrentStep(0);
      await waitForAnimationFrames(2);
      setIsPlaying(true);

      const playbackDurationMs = Math.max(totalSteps - 1, 0) * exportStepMs + Math.round(exportStepMs * 0.6);
      await wait(playbackDurationMs);

      setIsPlaying(false);
      stopTimer();
      setCurrentStep(totalSteps - 1);
      await waitForAnimationFrames(3);

      overlayMode = 'outro';
      await wait(EXPORT_OUTRO_MS);

      cancelled = true;
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
        exportAnimationFrameRef.current = null;
      }

      recorder?.stop();
      const webmBlob = await recorderPromise;

      if (target === 'mp4') {
        setIsConverting(true);
        const mp4Blob = await convertWebmToMp4(webmBlob);
        downloadBlob(mp4Blob, `dj_${data.case_id}_video-quantum.mp4`);
      } else {
        downloadBlob(webmBlob, `dj_${data.case_id}_video-quantum.webm`);
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
      setCurrentStep(previousStep);
      setIsPlaying(false);
      setIsConverting(false);
      await waitForAnimationFrames(2);

      if (previousPlaying && previousStep < totalSteps - 1) {
        setIsPlaying(true);
      }

      setIsExporting(false);
    }
  }, [data, isExporting, stopTimer, supportedVideoMimeType, totalSteps]);

  const handleExportVideo = useCallback(async () => {
    await runExportPipeline('webm');
  }, [runExportPipeline]);

  const handleExportMp4 = useCallback(async () => {
    if (isExporting) return;

    if (!ffmpegReady) {
      setExportError('Browser ini tidak mendukung konversi MP4 di sisi klien. Gunakan Chrome, Edge, atau Firefox terbaru.');
      return;
    }

    await runExportPipeline('mp4');
  }, [ffmpegReady, isExporting, runExportPipeline]);

  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-white overflow-hidden">
      <header className="px-5 pt-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Animasi Deutsch-Jozsa Three.js</p>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">{data.case_id} · circuit timeline dari dataset asli</h2>
            <p className="mt-2 text-[14px] leading-7 text-slate-600">
              Susunan kolom sirkuit dibangkitkan dari truth table JSON, trace kolom aktual, dan statevector tiap langkah. Tidak lagi memakai scaffold oracle tetap.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DetailCard label="Qubit" value={`${data.total_qubits}`} hint={`${data.n_qubits} input + 1 ancilla`} />
            <DetailCard label="Kolom" value={`${totalSteps}`} hint="Setiap kolom = 1 langkah visual aktual." />
            <DetailCard label="Oracle 1" value={`${data.oracle_summary.ones_count}`} hint="Jumlah input yang memicu f(x)=1." />
            <DetailCard label="Shots" value={`${data.measurement.shots}`} hint="Hasil measurement backend nyata." />
          </div>
        </div>
      </header>

      <PhaseStepper partitions={data.partitions} activePhase={activePhase} activeStep={activeStep} onJumpPhase={handleJumpPhase} disabled={isExporting || isConverting} />

      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-600">
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500" />|0⟩ (North)</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-orange-500" />|1⟩ (South)</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-violet-500" />Superposisi</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-600" />MCX control</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />MCX target</span>
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
                    backgroundColor: `${phaseColor}18`,
                    borderColor: `${phaseColor}55`,
                    color: phaseColor,
                  }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: phaseColor }} />
                  {PHASE_LABEL[activePhase] || activePhase}
                </div>
              </div>

              <div style={{ height: `${canvasHeight}px` }}>
                <Canvas
                  camera={{ position: [0, 0, 21.5], fov: 38, near: 0.1, far: 100 }}
                  style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
                  gl={{ antialias: true }}
                >
                  <StoryScene data={data} currentStep={currentStep} cameraMode={cameraMode} />
                </Canvas>
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Gate Aktif</p>
              <p className="mt-1 text-[18px] font-semibold text-slate-900">Step {activeStep.step} · {activeStep.operation}</p>
              {activeStep.comment && (
                <p className="mt-1 text-[14px] font-medium text-violet-600">{activeStep.comment}</p>
              )}
              <p className="mt-2 text-[14px] leading-7 text-slate-600">{activeStep.description}</p>
              {activeStep.focus_input_bits && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[13px] text-violet-700">
                  <span className="font-semibold">Fokus dataset:</span>
                  <span className="font-mono tracking-[0.2em]">{activeStep.focus_input_bits}</span>
                </div>
              )}
              <ActiveMarkerStrip step={activeStep} nQubits={data.n_qubits} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={isPlaying ? handlePause : handlePlay} disabled={isExporting} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-35">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>

              <button onClick={handleStep} disabled={isLastStep || isExporting} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35">
                <SkipForward className="h-4 w-4" />
              </button>

              <button onClick={handleReset} disabled={isExporting} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35">
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
                  className="h-1.5 flex-1 accent-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                />
                <span className="w-[62px] text-[11px] text-slate-600">{speed}ms</span>
              </div>

              <span className="font-mono text-[12px] text-slate-500">{currentStep + 1}/{totalSteps}</span>

              <button
                onClick={handleExportVideo}
                disabled={isExporting || !supportedVideoMimeType}
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-3.5 py-2 text-[12px] font-semibold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-45"
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
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / totalSteps) * 100}%`, backgroundColor: phaseColor }} />
            </div>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3 text-[12px] leading-6 text-slate-500">
              <p>
                WebM = instant. MP4 = rekam lalu konversi via FFmpeg.wasm (~5-15 detik). Keduanya merekam canvas 1920x1080.
              </p>
              {!supportedVideoMimeType && (
                <p className="text-rose-600">
                  Browser belum mendukung export video. Gunakan Chrome, Edge, atau Firefox terbaru.
                </p>
              )}
              {!ffmpegReady && (
                <p className="text-amber-600">
                  MP4 tidak tersedia di browser ini. Gunakan browser modern yang mendukung WebAssembly + Worker.
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
          <ReadingGuideCard step={activeStep} nQubits={data.n_qubits} totalSteps={totalSteps} />
          <StateSummaryPanel step={activeStep} nQubits={data.n_qubits} />
          <TruthTablePanel data={data} activeBits={activeStep.focus_input_bits} />
          <OracleConstructionPanel data={data} activeBits={activeStep.focus_input_bits} />
          <FinalAmplitudePanel data={data} />
          <MeasurementPanel data={data} />
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
            camera={{ position: [0, 0, 21.5], fov: 38, near: 0.1, far: 100 }}
            style={{ width: `${EXPORT_VIDEO_WIDTH}px`, height: `${EXPORT_VIDEO_HEIGHT}px` }}
            gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setPixelRatio(1);
              gl.setSize(EXPORT_VIDEO_WIDTH, EXPORT_VIDEO_HEIGHT, false);
              exportRendererCanvasRef.current = gl.domElement;
            }}
          >
            <StoryScene data={data} currentStep={currentStep} cameraMode={cameraMode} />
          </Canvas>
        </div>
      )}
    </div>
  );
}
