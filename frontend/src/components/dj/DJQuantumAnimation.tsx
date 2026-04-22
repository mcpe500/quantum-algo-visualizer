import { Canvas } from '@react-three/fiber';
import { Lock, Move3D } from 'lucide-react';
import type { DJAnimationPayload, DJAnimationStep } from '../../types/dj';
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
  ActiveMarkerStrip,
  DetailCard,
  MeasurementPanel,
  OracleConstructionPanel,
  PhaseStepper,
  ReadingGuideCard,
  TruthTablePanel,
} from './animation/panels';
import { getExportNarration } from './animation/narration';
import { StoryScene } from './animation/scene-primitives';

const djDrawVideoFrame = createVideoFrameRenderer<DJAnimationPayload, DJAnimationStep>({
  title: (data) => `Deutsch-Jozsa · ${data.case_id}`,
  legendPills: [
    { label: 'Qubit = Bloch sphere', fill: 'rgba(139, 92, 246, 0.20)' },
    { label: 'Gate terang = langkah aktif', fill: 'rgba(59, 130, 246, 0.16)' },
    { label: 'Ancilla = qubit bantu', fill: 'rgba(16, 185, 129, 0.16)' },
    { label: '● control / ⊕ target', fill: 'rgba(245, 158, 11, 0.16)' },
  ],
  getNarration: (mode, data, step) => getExportNarration(mode, data, step),
  getPhaseLabel: (phase) => PHASE_LABEL[phase] || phase,
});

interface DJQuantumAnimationProps {
  data: DJAnimationPayload;
  onExportingChange?: (isExporting: boolean) => void;
}

export function DJQuantumAnimation({ data, onExportingChange }: DJQuantumAnimationProps) {
  const engine = useAnimationEngine<DJAnimationPayload, DJAnimationStep>({
    data,
    defaultStepMs: DEFAULT_STEP_MS,
    onExportingChange,
  });

  const videoExport = useVideoExport<DJAnimationPayload, DJAnimationStep>({
    engine,
    drawVideoFrame: djDrawVideoFrame,
    exportConfig: {
      stepMsMin: EXPORT_STEP_MS_MIN,
      introMs: EXPORT_INTRO_MS,
      outroMs: EXPORT_OUTRO_MS,
      filenamePrefix: 'dj_',
      filenameSuffix: 'video-quantum',
    },
    getPhaseColor: (phase) => PHASE_COLOR[phase] || '#2563EB',
    sceneCamera: { position: [0, 0, 21.5], fov: 38 },
  });

  const activePhase = engine.activeStep.phase;
  const phaseColor = PHASE_COLOR[activePhase] || '#2563EB';
  const canvasHeight = data.n_qubits >= 4 || engine.totalSteps > 18 ? 560 : 520;

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
            <DetailCard label="Kolom" value={`${engine.totalSteps}`} hint="Setiap kolom = 1 langkah visual aktual." />
            <DetailCard label="Oracle 1" value={`${data.oracle_summary.ones_count}`} hint="Jumlah input yang memicu f(x)=1." />
            <DetailCard label="Shots" value={`${data.measurement.shots}`} hint="Hasil measurement backend nyata." />
          </div>
        </div>
      </header>

      <PhaseStepper partitions={data.partitions} activePhase={activePhase} activeStep={engine.activeStep} onJumpPhase={engine.handleJumpPhase} disabled={engine.isExporting || engine.isConverting} color="violet" startKey="start_col" activeLabel="Active Column" />

      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-[1fr_380px]">
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
                  camera={{ position: [0, 0, 21.5], fov: 38, near: 0.1, far: 100 }}
                  style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
                  gl={{ antialias: true }}
                >
                  <StoryScene data={data} currentStep={engine.currentStep} cameraMode={engine.cameraMode} />
                </Canvas>
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Gate Aktif</p>
              <p className="mt-1 text-[18px] font-semibold text-slate-900">Step {engine.activeStep.step} · {engine.activeStep.operation}</p>
              {engine.activeStep.comment && (
                <p className="mt-1 text-[14px] font-medium text-violet-600">{engine.activeStep.comment}</p>
              )}
              <p className="mt-2 text-[14px] leading-7 text-slate-600">{engine.activeStep.description}</p>
              {engine.activeStep.focus_input_bits && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[13px] text-violet-700">
                  <span className="font-semibold">Fokus dataset:</span>
                  <span className="font-mono tracking-[0.2em]">{engine.activeStep.focus_input_bits}</span>
                </div>
              )}
              <ActiveMarkerStrip step={engine.activeStep} nQubits={data.n_qubits} />
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
            sliderAccent="accent-violet-600"
            exportBtnBorder="border-violet-300"
            exportBtnBg="bg-violet-50"
            exportBtnText="text-violet-700"
            exportBtnHover="hover:bg-violet-100"
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
            <ReadingGuideCard step={engine.activeStep} nQubits={data.n_qubits} totalSteps={engine.totalSteps} />
          </div>
          <div className="px-0">
            <TruthTablePanel data={data} activeBits={engine.activeStep.focus_input_bits} />
          </div>
          <div className="px-0">
            <OracleConstructionPanel data={data} activeBits={engine.activeStep.focus_input_bits} />
          </div>
          <div className="px-0">
            <MeasurementPanel data={data} />
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
            camera={{ position: [0, 0, 21.5], fov: 38, near: 0.1, far: 100 }}
            style={{ width: `${EXPORT_VIDEO_WIDTH}px`, height: `${EXPORT_VIDEO_HEIGHT}px` }}
            gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setPixelRatio(1);
              gl.setSize(EXPORT_VIDEO_WIDTH, EXPORT_VIDEO_HEIGHT, false);
              engine.exportRendererCanvasRef.current = gl.domElement;
            }}
          >
            <StoryScene data={data} currentStep={engine.currentStep} cameraMode={engine.cameraMode} />
          </Canvas>
        </div>
      )}
    </div>
  );
}
