import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Gauge, Lock, Move3D, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { QFTAnimationPayload } from '../../types/qft';
import {
  DEFAULT_STEP_MS,
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

interface QFTQuantumAnimationProps {
  data: QFTAnimationPayload;
}

export function QFTQuantumAnimation({ data }: QFTQuantumAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_STEP_MS);
  const [cameraMode, setCameraMode] = useState<'fixed' | 'orbit'>('fixed');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStepRef = useRef(currentStep);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);

  const totalSteps = data.timeline.length;
  const activeStep = data.timeline[currentStep];
  const activePhase = activeStep.phase;
  const phaseColor = PHASE_COLOR[activePhase] || '#7c3aed';
  const isLastStep = currentStep >= totalSteps - 1;
  const canvasHeight = data.n_qubits >= 4 || totalSteps > 18 ? 560 : 520;

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
      if (currentStep >= totalSteps - 1) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsPlaying(false);
      }
    }

    return stopTimer;
  }, [currentStep, isPlaying, speed, stopTimer, totalSteps]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentStep(0);
     
    setIsPlaying(false);
    stopTimer();
  }, [data.case_id, stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  const handlePlay = () => {
    if (isLastStep) setCurrentStep(0);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopTimer();
  };

  const handleStep = () => {
    setIsPlaying(false);
    stopTimer();
    setCurrentStep((previous) => Math.min(previous + 1, totalSteps - 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    stopTimer();
    setCurrentStep(0);
  };

  const handleJumpPhase = useCallback(
    (phase: string) => {
      const index = data.timeline.findIndex((step) => step.phase === phase);
      if (index >= 0) {
        setCurrentStep(index);
        setIsPlaying(false);
        stopTimer();
      }
    },
    [data.timeline, stopTimer],
  );

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
            <DetailCard label="Steps" value={`${totalSteps}`} hint="Setiap step = 1 operasi." />
            <DetailCard label="Signal" value={data.signal_type} hint="Time domain input." />
            <DetailCard label="Shots" value={`${data.measurement.shots}`} hint="Backend measurement." />
          </div>
        </div>
      </header>

      <PhaseStepper
        partitions={data.partitions}
        activePhase={activePhase}
        activeStep={activeStep}
        onJumpPhase={handleJumpPhase}
        disabled={false}
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
                onClick={() => setCameraMode((previous) => (previous === 'fixed' ? 'orbit' : 'fixed'))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
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
                  camera={{ position: [0, -0.5, 22], fov: 38, near: 0.1, far: 100 }}
                  style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
                  gl={{ antialias: true }}
                >
                  <QFTStoryScene data={data} currentStep={currentStep} cameraMode={cameraMode} />
                </Canvas>
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Step Aktif</p>
              <p className="mt-1 text-[18px] font-semibold text-slate-900">
                Step {activeStep.step} · {activeStep.operation}
              </p>
              <p className="mt-2 text-[14px] leading-7 text-slate-600">{activeStep.description}</p>
              {activeStep.qubit_phases && activeStep.qubit_phases.length > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[13px] text-teal-700">
                  <span className="font-semibold">Phase per qubit:</span>
                  <span className="font-mono tracking-wider">
                    {activeStep.qubit_phases.map((p, i) => `q${i}:${((p * 180) / Math.PI).toFixed(1)}°`).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>

              <button
                onClick={handleStep}
                disabled={isLastStep}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              <button
                onClick={handleReset}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50"
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
                  onChange={(event) => setSpeed(Number(event.target.value))}
                  className="h-1.5 flex-1 accent-teal-600"
                />
                <span className="w-[62px] text-[11px] text-slate-600">{speed}ms</span>
              </div>

              <span className="font-mono text-[12px] text-slate-500">
                {currentStep + 1}/{totalSteps}
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%`, backgroundColor: phaseColor }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="px-0">
            <ReadingGuideCard step={activeStep} nQubits={data.n_qubits} />
          </div>
          <div className="px-0">
            <SignalInputPanel data={data} />
          </div>
          <div className="px-0">
            <PhaseCascadePanel data={data} activeStep={activeStep} />
          </div>
          <div className="px-0">
            <FrequencySpectrumPanel data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}