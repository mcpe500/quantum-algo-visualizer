import { useState, useEffect, useCallback } from 'react';
import { vqeApi } from '../services/api';
import type {
  VQECase,
  VQEBenchmarkResult,
  VQEBenchmarkParams,
  VQETrace,
} from '../types/vqe';
import type { VQECircuitImage } from '../services/api';
import { CAPTURE_IDS, DEFAULT_SHOTS } from '../constants/app';
import { fetchNullable } from '../utils/async';
import { useBaseAlgorithmBenchmark } from './useAlgorithmBenchmark';

export interface UseVQEReturn {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: VQEBenchmarkResult | null;
  circuitImage: VQECircuitImage | null;
  trace: VQETrace | null;
  isLoading: boolean;
  error: string | null;
  selectedCaseData: VQECase | null;
  activeTab: 'problem' | 'classic' | 'quantum';
  shots: number;
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'problem' | 'classic' | 'quantum') => void;
  setShots: (shots: number) => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function useVQE(): UseVQEReturn {
  const [shots, setShots] = useState(DEFAULT_SHOTS);
  const [activeTab, setActiveTab] = useState<'problem' | 'classic' | 'quantum'>('problem');

  const base = useBaseAlgorithmBenchmark<VQECase, VQEBenchmarkParams, VQEBenchmarkResult, VQECircuitImage>({
    api: {
      getCases: vqeApi.getCases,
      runBenchmark: vqeApi.runBenchmark,
      getCircuitImage: vqeApi.getCircuitImage,
    },
    getDefaultParams: (caseId) => ({ case_id: caseId, shots }),
    getCaptureId: () => CAPTURE_IDS.vqe,
  });

  const [trace, setTrace] = useState<VQETrace | null>(null);
  const { selectedCaseId, handleRun: runBaseBenchmark } = base;

  const loadTrace = useCallback(async (caseId: string) => {
    if (!caseId) return;
    setTrace(await fetchNullable(() => vqeApi.getTrace(caseId)));
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;
    queueMicrotask(() => {
      void loadTrace(selectedCaseId);
    });
  }, [selectedCaseId, loadTrace]);

  const handleRun = useCallback(async () => {
    await runBaseBenchmark();
    if (selectedCaseId) {
      await loadTrace(selectedCaseId);
    }
  }, [runBaseBenchmark, selectedCaseId, loadTrace]);

  return {
    ...base,
    trace,
    activeTab,
    shots,
    setActiveTab,
    setShots,
    handleRun,
  };
}
