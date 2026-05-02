import { useState, useEffect, useCallback } from 'react';
import { qaoaApi } from '../services/api';
import type {
  QAOACase,
  QAOAAnimationPayload,
  QAOABenchmarkResult,
  QAOABenchmarkParams,
  QAOATrace,
} from '../types/qaoa';
import type { QAOACircuitImage } from '../services/api';
import { CAPTURE_IDS, DEFAULT_SHOTS } from '../constants/app';
import { fetchNullable } from '../utils/async';
import { useBaseAlgorithmBenchmark } from './useAlgorithmBenchmark';

export interface UseQAOAReturn {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: QAOABenchmarkResult | null;
  circuitImage: QAOACircuitImage | null;
  trace: QAOATrace | null;
  animationData: QAOAAnimationPayload | null;
  isLoading: boolean;
  isLoadingAnimation: boolean;
  error: string | null;
  selectedCaseData: QAOACase | null;
  activeTab: 'problem' | 'classic' | 'quantum' | 'animation';
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'problem' | 'classic' | 'quantum' | 'animation') => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function useQAOA(): UseQAOAReturn {
  const base = useBaseAlgorithmBenchmark<QAOACase, QAOABenchmarkParams, QAOABenchmarkResult, QAOACircuitImage>({
    api: {
      getCases: qaoaApi.getCases,
      runBenchmark: qaoaApi.runBenchmark,
      getCircuitImage: qaoaApi.getCircuitImage,
    },
    getDefaultParams: (caseId) => ({ case_id: caseId, shots: DEFAULT_SHOTS, include_aggregate: true }),
    getCaptureId: () => CAPTURE_IDS.qaoa,
  });

  const [trace, setTrace] = useState<QAOATrace | null>(null);
  const [animationData, setAnimationData] = useState<QAOAAnimationPayload | null>(null);
  const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'classic' | 'quantum' | 'animation'>('problem');
  const { selectedCaseId, benchmarkResult, handleRun: runBaseBenchmark } = base;

  const loadTrace = useCallback(async (caseId: string, gamma?: number[], beta?: number[]) => {
    if (!caseId) return;
    setTrace(await fetchNullable(() => qaoaApi.getTrace(caseId, gamma, beta)));
  }, []);

  const loadAnimation = useCallback(async (caseId: string) => {
    if (!caseId) return;
    setIsLoadingAnimation(true);
    setAnimationData(await fetchNullable(() => qaoaApi.getAnimation(caseId, DEFAULT_SHOTS)));
    setIsLoadingAnimation(false);
  }, []);

  useEffect(() => {
    if (selectedCaseId && activeTab === 'animation') {
      queueMicrotask(() => void loadAnimation(selectedCaseId));
    }
  }, [activeTab, selectedCaseId, loadAnimation]);

  useEffect(() => {
    if (!selectedCaseId) return;
    queueMicrotask(() => {
      void loadTrace(selectedCaseId);
    });
  }, [selectedCaseId, loadTrace]);

  const handleRun = useCallback(async () => {
    await runBaseBenchmark();
    if (selectedCaseId && benchmarkResult) {
      await loadTrace(selectedCaseId, benchmarkResult.quantum?.optimal_gamma, benchmarkResult.quantum?.optimal_beta);
    }
  }, [runBaseBenchmark, selectedCaseId, benchmarkResult, loadTrace]);

  return {
    ...base,
    trace,
    animationData,
    isLoadingAnimation,
    activeTab,
    setActiveTab,
    handleRun,
  };
}
