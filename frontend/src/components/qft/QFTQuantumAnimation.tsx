import { Canvas } from '@react-three/fiber';
import { Lock, Move3D } from 'lucide-react';
import type { QFTAnimationPayload, QFTAnimationStep } from '../../types/qft';
import { useAnimationEngine, useVideoExport } from '../../shared/hooks';
import { createVideoFrameRenderer } from '../../shared/utils/video-overlay';
import { EXPORT_VIDEO_HEIGHT, EXPORT_VIDEO_WIDTH } from '../../shared/constants/export';
import { PlaybackControls } from '../../shared/components/animation/PlaybackControls';
import {
  DEFAULT_STEP_MS,
  EXPORT_STEP_MS_MIN,
  EXPORT_INTRO_MS,
  EXPORT_OUTRO_MS,
  PHASE_COLOR,
  PHASE_LABEL,
  SPEED_SLIDER,
} from './animation/constants';
import {
  DetailCard,
  FrequencySpectrumPanel,
  PhaseCascadePanel,
  PhaseStepper,
  ReadingGuideCard,
  SignalInputPanel,
} from './animation/panels';
import { QFTStoryScene } from './animation/scene-primitives';

function getQFTNarration(mode: 'intro' | 'play' | 'outro', data: QFTAnimationPayload, step: QFTAnimationStep) {
  if (mode === 'intro') {
    return {
      headline: 'Cara baca animasi QFT',
      detail: 'Signal klasik di-encode ke statevector kuantum. Phase cascade mentransformasi ke domain frekuensi.',
      accent: `Signal: ${data.signal_type} · ${data.n_points_padded} poin → ${data.n_qubits} qubit`,
    };
  }
  if (mode === 'outro') {
    const dominant = data.qft.dominant_bins[0] ?? 0;
    const prob = data.qft.dominant_probabilities[0] ?? 0;
    return {
      headline: `Frequency bin |${dominant}⟩ dominant`,
      detail: `QFT mengukur distribusi probabilitas domain frekuensi. Bin dengan probabilitas tertinggi adalah |${dominant}⟩.`,
      accent: `P(|${dominant}⟩) = ${(prob * 100).toFixed(1)}% · ${data.measurement.shots} shots`,
    };
  }
  const phaseList = (step.qubit_phases || [])
    .slice(0, data.n_qubits)
    .map((p, i) => `q${i}:${((p * 180) / Math.PI).toFixed(1)}°`)
    .join(', ');
  return {
    headline: `${PHASE_LABEL[step.phase] || step.phase} · Step ${step.step}`,
    detail: step.description || `Operasi ${step.operation} pada step ${step.step}`,
    accent: phaseList || `Step ${step.step}/${data.timeline.length}`,
  };
}

const qftDrawVideoFrame = createVideoFrameRenderer<QFTAnimationPayload, QFTAnimationStep>({
  title: (data) => `QFT · ${data.case_id}`,
  legendPills: [
    { label: 'Signal → Phase', fill: 'rgba(59, 130, 246, 0.16)' },
    { label: 'Hadamard layer', fill: 'rgba(124, 58, 237, 0.16)' },
    { label: 'CPHASE cascade', fill: 'rgba(13, 148, 136, 0.16)' },
    { label: 'SWAP bit-reverse', fill: 'rgba(245, 158, 11, 0.16)' },
  ],
  getNarration: getQFTNarration,
  getPhaseLabel: (phase) => PHASE_LABEL[phase] || phase,
});

interface QFTQuantumAnimationProps {
  data: QFTAnimationPayload;
  onExportingChange?: (isExporting: boolean) => void;
}

export function QFTQuantumAnimation({ data, onExportingChange }: QFTQuantumAnimationProps) {
  const engine = useAnimationEngine<QFTAnimationPayload, QFTAnimationStep>({
    data,
    defaultStepMs: DEFAULT_STEP_MS,
    onExportingChange,
  });

  const videoExport = useVideoExport<QFTAnimationPayload, QFTAnimationStep>({
    engine,
    drawVideoFrame: qftDrawVideoFrame,
    exportConfig: {
      stepMsMin: EXPORT_STEP_MS_MIN,
      introMs: EXPORT_INTRO_MS,
      outroMs: EXPORT_OUTRO_MS,
      filenamePrefix: 'qft_',
      filenameSuffix: 'video-quantum',
    },
    getPhaseColor: (phase) => PHASE_COLOR[phase] || '#7c3aed',
    sceneCamera: { position: [0, -0.5, 22], fov: 38 },
  });

  const activePhase = engine.activeStep.phase;
  const phaseColor = PHASE_COLOR[activePhase] || '#7c3aed';
  const canvasHeight = data.n_qubits >= 4 || engine.totalSteps > 18 ? 560 : 520;

  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-white overflow-hidden">
      <header className="px-5 pt-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Animasi QFT Three.js
        </p>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">
              {data.case_id} · Quantum Fourier Transform
            </h2>
            <p className="mt-2 text-[14px] leading-7 text-slate-600">
              Visualisasi transformasi sinyal domain waktu ke domain frekuensi melalui phase cascade
              kuantum. Signal amplitude di-encode ke statevector, kemudian ditransformasi melalui
              Hadamard dan controlled-phase gates.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DetailCard label="Qubit" value={`${data.n_qubits}`} hint={`${data.n_points_padded} points`} />
            <DetailCard label="Steps" value={`${engine.totalSteps}`} hint="Setiap step = 1 operasi." />
            <DetailCard label="Signal" value={data.signal_type} hint="Time domain input." />
            <DetailCard label="Shots" value={`${data.measurement.shots}`} hint="Backend measurement." />
          </div>
        </div>
      </header>

      <PhaseStepper
        partitions={data.partitions}
        activePhase={activePhase}
        activeStep={engine.activeStep}
        onJumpPhase={engine.handleJumpPhase}
        disabled={engine.isExporting || engine.isConverting}
      />

      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-indigo-500" />
                  Signal Input
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  Hadamard (H)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-teal-500" />
                  Phase Cascade (CPHASE)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  SWAP
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Measurement
                </span>
              </div>

              <button
                onClick={() => engine.setCameraMode((previous) => (previous === 'fixed' ? 'orbit' : 'fixed'))}
                disabled={engine.isExporting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {engine.cameraMode === 'fixed' ? <Lock className="h-3.5 w-3.5" /> : <Move3D className="h-3.5 w-3.5" />}
                {engine.cameraMode === 'fixed' ? 'Fixed Camera' : 'Orbit Camera'}
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
                  camera={{ position: [0, -0.5, 22], fov: 38, near: 0.1, far: 100 }}
                  style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
                  gl={{ antialias: true }}
                >
                  <QFTStoryScene data={data} currentStep={engine.currentStep} cameraMode={engine.cameraMode} />
                </Canvas>
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Step Aktif</p>
              <p className="mt-1 text-[18px] font-semibold text-slate-900">
                Step {engine.activeStep.step} · {engine.activeStep.operation}
              </p>
              <p className="mt-2 text-[14px] leading-7 text-slate-600">{engine.activeStep.description}</p>
              {engine.activeStep.qubit_phases && engine.activeStep.qubit_phases.length > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[13px] text-teal-700">
                  <span className="font-semibold">Phase per qubit:</span>
                  <span className="font-mono tracking-wider">
                    {engine.activeStep.qubit_phases.map((p, i) => `q${i}:${((p * 180) / Math.PI).toFixed(1)}°`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <PlaybackControls
            isPlaying={engine.isPlaying}
            isLastStep={engine.isLastStep}
            isExporting={engine.isExporting}
            isConverting={engine.isConverting}
            speed={engine.speed}
            currentStep={engine.currentStep}
            totalSteps={engine.totalSteps}
            phaseColor={phaseColor}
            sliderAccent="accent-teal-600"
            exportBtnBorder="border-teal-300"
            exportBtnBg="bg-teal-50"
            exportBtnText="text-teal-700"
            exportBtnHover="hover:bg-teal-100"
            speedSlider={SPEED_SLIDER}
            supportedVideoMimeType={videoExport.supportedVideoMimeType}
            ffmpegReady={videoExport.ffmpegReady}
            onPlay={engine.handlePlay}
            onPause={engine.handlePause}
            onStep={engine.handleStep}
            onReset={engine.handleReset}
            onSpeedChange={(v) => engine.setSpeed(v)}
            onExportVideo={videoExport.handleExportVideo}
            onExportMp4={videoExport.handleExportMp4}
            exportError={engine.exportError}
          />
        </div>

        <div className="space-y-4">
          <div className="px-0">
            <ReadingGuideCard step={engine.activeStep} nQubits={data.n_qubits} />
          </div>
          <div className="px-0">
            <SignalInputPanel data={data} />
          </div>
          <div className="px-0">
            <PhaseCascadePanel data={data} activeStep={engine.activeStep} />
          </div>
          <div className="px-0">
            <FrequencySpectrumPanel data={data} />
          </div>
        </div>
      </div>

      {engine.isExporting && (
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
            camera={{ position: [0, -0.5, 22], fov: 38, near: 0.1, far: 100 }}
            style={{ width: `${EXPORT_VIDEO_WIDTH}px`, height: `${EXPORT_VIDEO_HEIGHT}px` }}
            gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setPixelRatio(1);
              gl.setSize(EXPORT_VIDEO_WIDTH, EXPORT_VIDEO_HEIGHT, false);
              engine.exportRendererCanvasRef.current = gl.domElement;
            }}
          >
            <QFTStoryScene data={data} currentStep={engine.currentStep} cameraMode={engine.cameraMode} />
          </Canvas>
        </div>
      )}
    </div>
  );
}
