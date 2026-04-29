import { useCallback, useEffect, useRef, useState } from 'react';
import type { BaseAnimationPayload, BaseAnimationStep, CameraMode } from '../types/animation';

export interface AnimationEngineConfig<TData extends BaseAnimationPayload<TStep>, TStep extends BaseAnimationStep> {
  data: TData;
  defaultStepMs?: number;
  onExportingChange?: (isExporting: boolean) => void;
  findPhaseStepIndex?: (data: TData, phase: string) => number;
}

export interface AnimationEngineReturn<TData extends BaseAnimationPayload<TStep>, TStep extends BaseAnimationStep> {
  data: TData;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
  cameraMode: CameraMode;
  setCameraMode: React.Dispatch<React.SetStateAction<CameraMode>>;
  isExporting: boolean;
  setIsExporting: React.Dispatch<React.SetStateAction<boolean>>;
  isConverting: boolean;
  setIsConverting: React.Dispatch<React.SetStateAction<boolean>>;
  exportError: string | null;
  setExportError: React.Dispatch<React.SetStateAction<string | null>>;
  totalSteps: number;
  activeStep: TStep;
  isLastStep: boolean;
  handlePlay: () => void;
  handlePause: () => void;
  handleStep: () => void;
  handleReset: () => void;
  handleJumpPhase: (phase: string) => void;
  stopTimer: () => void;
  currentStepRef: React.MutableRefObject<number>;
  isPlayingRef: React.MutableRefObject<boolean>;
  speedRef: React.MutableRefObject<number>;
  exportRendererCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  exportAnimationFrameRef: React.MutableRefObject<number | null>;
  setExportRendererCanvas: (canvas: HTMLCanvasElement | null) => void;
  setExportAnimationFrame: (frameId: number | null) => void;
  cancelExportAnimationFrame: () => void;
}

export function useAnimationEngine<TData extends BaseAnimationPayload<TStep>, TStep extends BaseAnimationStep>(
  config: AnimationEngineConfig<TData, TStep>,
): AnimationEngineReturn<TData, TStep> {
  const { data, defaultStepMs = 1300, onExportingChange, findPhaseStepIndex } = config;

  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(defaultStepMs);
  const [cameraMode, setCameraMode] = useState<CameraMode>('fixed');
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
  const isLastStep = currentStep >= totalSteps - 1;

  const stopTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const setExportRendererCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    exportRendererCanvasRef.current = canvas;
  }, []);

  const setExportAnimationFrame = useCallback((frameId: number | null) => {
    exportAnimationFrameRef.current = frameId;
  }, []);

  const cancelExportAnimationFrame = useCallback(() => {
    if (exportAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(exportAnimationFrameRef.current);
      exportAnimationFrameRef.current = null;
    }
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
      if (currentStep >= totalSteps - 1) {
        queueMicrotask(() => setIsPlaying(false));
      }
    }

    return stopTimer;
  }, [currentStep, isPlaying, speed, stopTimer, totalSteps]);

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentStep(0);
      setIsPlaying(false);
      setExportError(null);
      stopTimer();
    });
  }, [data.case_id, stopTimer]);

  useEffect(() => {
    const animationFrameRef = exportAnimationFrameRef;
    return () => {
      stopTimer();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
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

  const handleJumpPhase = useCallback(
    (phase: string) => {
      if (isExporting) return;
      const index = findPhaseStepIndex
        ? findPhaseStepIndex(data, phase)
        : data.timeline.findIndex((step) => step.phase === phase);
      if (index >= 0) {
        setCurrentStep(index);
        setIsPlaying(false);
        stopTimer();
      }
    },
    [data, isExporting, stopTimer, findPhaseStepIndex],
  );

  return {
    data,
    currentStep,
    setCurrentStep,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    cameraMode,
    setCameraMode,
    isExporting,
    setIsExporting,
    isConverting,
    setIsConverting,
    exportError,
    setExportError,
    totalSteps,
    activeStep,
    isLastStep,
    handlePlay,
    handlePause,
    handleStep,
    handleReset,
    handleJumpPhase,
    stopTimer,
    currentStepRef,
    isPlayingRef,
    speedRef,
    exportRendererCanvasRef,
    exportAnimationFrameRef,
    setExportRendererCanvas,
    setExportAnimationFrame,
    cancelExportAnimationFrame,
  };
}
