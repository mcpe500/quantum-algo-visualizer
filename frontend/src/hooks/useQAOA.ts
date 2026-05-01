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
  activeTab: 'classic' | 'quantum' | 'animation';
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'classic' | 'quantum' | 'animation') => void;
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
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum' | 'animation'>('classic');

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
    if (base.selectedCaseId && activeTab === 'animation') {
      queueMicrotask(() => void loadAnimation(base.selectedCaseId));
    }
  }, [activeTab, base.selectedCaseId, loadAnimation]);

  useEffect(() => {
    if (!base.selectedCaseId) return;
    queueMicrotask(() => {
      void loadTrace(base.selectedCaseId);
    });
  }, [base.selectedCaseId, loadTrace]);

  const handleRun = useCallback(async () => {
    await base.handleRun();
    if (base.selectedCaseId && base.benchmarkResult) {
      const data = base.benchmarkResult as any;
      await loadTrace(base.selectedCaseId, data.quantum?.optimal_gamma, data.quantum?.optimal_beta);
    }
  }, [base.handleRun, base.selectedCaseId, base.benchmarkResult, loadTrace]);

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
