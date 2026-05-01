import { useState, useEffect, useCallback } from 'react';
import { qftApi } from '../services/api';
import type {
  QFTCase,
  QFTBenchmarkResult,
  QFTBenchmarkParams,
  QFTQuantumTrace,
  QFTAnimationPayload,
} from '../types/qft';
import type { QFTCircuitImage } from '../services/api';
import { CAPTURE_IDS, DEFAULT_SHOTS } from '../constants/app';
import { fetchNullable } from '../utils/async';
import { useBaseAlgorithmBenchmark } from './useAlgorithmBenchmark';

export interface UseQFTReturn {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: QFTBenchmarkResult | null;
  circuitImage: QFTCircuitImage | null;
  trace: QFTQuantumTrace | null;
  animationData: QFTAnimationPayload | null;
  isLoading: boolean;
  isLoadingAnimation: boolean;
  error: string | null;
  activeTab: 'classic' | 'quantum' | 'animation';
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'classic' | 'quantum' | 'animation') => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function useQFT(): UseQFTReturn {
  const base = useBaseAlgorithmBenchmark<QFTCase, QFTBenchmarkParams, QFTBenchmarkResult, QFTCircuitImage>({
    api: {
      getCases: qftApi.getCases,
      runBenchmark: qftApi.runBenchmark,
      getCircuitImage: qftApi.getCircuitImage,
    },
    getDefaultParams: (caseId) => ({ case_id: caseId, shots: DEFAULT_SHOTS }),
    getCaptureId: () => CAPTURE_IDS.qft,
  });

  const [trace, setTrace] = useState<QFTQuantumTrace | null>(null);
  const [animationData, setAnimationData] = useState<QFTAnimationPayload | null>(null);
  const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum' | 'animation'>('classic');

  const loadTrace = useCallback(async (caseId: string) => {
    if (!caseId) return;
    setTrace(await fetchNullable(() => qftApi.getQuantumTrace(caseId)));
  }, []);

  const loadAnimation = useCallback(async (caseId: string) => {
    if (!caseId) return;
    setIsLoadingAnimation(true);
    setAnimationData(await fetchNullable(() => qftApi.getAnimation(caseId, DEFAULT_SHOTS)));
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
    if (base.selectedCaseId) {
      await loadTrace(base.selectedCaseId);
    }
  }, [base.handleRun, base.selectedCaseId, loadTrace]);

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
