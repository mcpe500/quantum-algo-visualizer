import { useState, useEffect, useCallback } from 'react';
import { djApi } from '../services/api';
import type {
  DJCase,
  DJBenchmarkResult,
  DJBenchmarkParams,
  DJQuantumTrace,
  DJAnimationPayload,
} from '../types/dj';
import type { DJCircuitImage } from '../services/api';
import type { ClassicalResult } from '../types/classical';
import { CAPTURE_IDS, DEFAULT_SHOTS } from '../constants/app';
import { fetchNullable } from '../utils/async';
import { useBaseAlgorithmBenchmark } from './useAlgorithmBenchmark';

export interface UseDJBenchmarkReturn {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: DJBenchmarkResult | null;
  circuitImage: DJCircuitImage | null;
  boxedCircuitImage: DJCircuitImage | null;
  trace: DJQuantumTrace | null;
  animationData: DJAnimationPayload | null;
  classicalResult: ClassicalResult | null;
  isLoading: boolean;
  error: string | null;
  selectedCaseData: DJCase | null;
  activeTab: 'problem' | 'classic' | 'quantum' | 'animation';
  isVideoExporting: boolean;
  setIsVideoExporting: (v: boolean) => void;
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'problem' | 'classic' | 'quantum' | 'animation') => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function useDJBenchmark(): UseDJBenchmarkReturn {
  const base = useBaseAlgorithmBenchmark<DJCase, DJBenchmarkParams, DJBenchmarkResult, DJCircuitImage>({
    api: {
      getCases: djApi.getCases,
      runBenchmark: djApi.runBenchmark,
      getCircuitImage: djApi.getCircuitImage,
    },
    getDefaultParams: (caseId) => ({ case_id: caseId, shots: DEFAULT_SHOTS }),
    getCaptureId: () => CAPTURE_IDS.djQuantum,
  });

  const [boxedCircuitImage, setBoxedCircuitImage] = useState<DJCircuitImage | null>(null);
  const [trace, setTrace] = useState<DJQuantumTrace | null>(null);
  const [animationData, setAnimationData] = useState<DJAnimationPayload | null>(null);
  const [classicalResult, setClassicalResult] = useState<ClassicalResult | null>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'classic' | 'quantum' | 'animation'>('problem');
  const [isVideoExporting, setIsVideoExporting] = useState(false);
  const { selectedCaseId, handleRun: runBaseBenchmark } = base;

  const loadBoxedCircuitImage = useCallback(async (caseId: string) => {
    if (!caseId) return;
    setBoxedCircuitImage(await fetchNullable(() => djApi.getCircuitImageBoxed(caseId)));
  }, []);

  const loadTrace = useCallback(async (caseId: string) => {
    if (!caseId) return;
    setTrace(await fetchNullable(() => djApi.getQuantumTrace(caseId)));
  }, []);

  const loadAnimation = useCallback(async (caseId: string) => {
    if (!caseId) return;
    setAnimationData(await fetchNullable(() => djApi.getAnimation(caseId, DEFAULT_SHOTS)));
  }, []);

  const loadClassical = useCallback(async (caseId: string) => {
    if (!caseId) return;
    const classical = await fetchNullable(() => djApi.runClassicalDJ(caseId));
    if (classical) {
      setClassicalResult(classical);
    }
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;
    queueMicrotask(() => {
      void loadClassical(selectedCaseId);
      void loadBoxedCircuitImage(selectedCaseId);
      void loadTrace(selectedCaseId);
      void loadAnimation(selectedCaseId);
    });
  }, [selectedCaseId, loadClassical, loadBoxedCircuitImage, loadTrace, loadAnimation]);

  const handleRun = useCallback(async () => {
    await runBaseBenchmark();
    if (selectedCaseId) {
      await loadClassical(selectedCaseId);
      await loadBoxedCircuitImage(selectedCaseId);
      void loadAnimation(selectedCaseId);
    }
  }, [runBaseBenchmark, selectedCaseId, loadClassical, loadBoxedCircuitImage, loadAnimation]);

  return {
    ...base,
    boxedCircuitImage,
    trace,
    animationData,
    classicalResult,
    activeTab,
    isVideoExporting,
    setIsVideoExporting,
    setActiveTab,
    handleRun,
  };
}
