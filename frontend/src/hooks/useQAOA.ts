import { useState, useEffect, useCallback } from 'react';
import { qaoaApi } from '../services/api';
import type {
  QAOAAnimationPayload,
  QAOABenchmarkResult,
  QAOABenchmarkParams,
  QAOATrace,
} from '../types/qaoa';
import type { QAOACircuitImage } from '../services/api';
import { sortCaseIds } from '../utils/sorting';
import { downloadElementAsPNG } from '../utils/download';
import { CAPTURE_IDS, DEFAULT_SHOTS } from '../constants/app';

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
  const [selectedCaseId, setSelectedCaseId] = useState<string>('QAOA-01');
  const [availableCases, setAvailableCases] = useState<string[]>(['QAOA-01']);
  const [benchmarkResult, setBenchmarkResult] = useState<QAOABenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<QAOACircuitImage | null>(null);
  const [trace, setTrace] = useState<QAOATrace | null>(null);
  const [animationData, setAnimationData] = useState<QAOAAnimationPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum' | 'animation'>('classic');

  // Load cases on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cases = await qaoaApi.getCases();
        if (cancelled) return;
        const ids = sortCaseIds(
          cases.map((c) => c.case_id).filter((id): id is string => Boolean(id))
        );
        if (ids.length > 0) {
          setAvailableCases(ids);
          setSelectedCaseId((cur) => (ids.includes(cur) ? cur : ids[0]));
        }
      } catch {
        // keep default
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCircuitImage = useCallback(async (caseId: string, gamma?: number[], beta?: number[]) => {
    try {
      const data = await qaoaApi.getCircuitImage(caseId, gamma, beta);
      setCircuitImage(data);
    } catch {
      setCircuitImage(null);
    }
  }, []);

  const loadTrace = useCallback(async (caseId: string, gamma?: number[], beta?: number[]) => {
    try {
      const data = await qaoaApi.getTrace(caseId, gamma, beta);
      setTrace(data);
    } catch {
      setTrace(null);
    }
  }, []);

  const loadAnimation = useCallback(async (caseId: string) => {
    setIsLoadingAnimation(true);
    try {
      const data = await qaoaApi.getAnimation(caseId, DEFAULT_SHOTS);
      setAnimationData(data);
    } catch {
      setAnimationData(null);
    } finally {
      setIsLoadingAnimation(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'animation') {
      void loadAnimation(selectedCaseId);
    }
  }, [activeTab, selectedCaseId, loadAnimation]);

  useEffect(() => {
    void loadCircuitImage(selectedCaseId);
    void loadTrace(selectedCaseId);
  }, [selectedCaseId, loadCircuitImage, loadTrace]);

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: QAOABenchmarkParams = {
        case_id: selectedCaseId,
        shots: DEFAULT_SHOTS,
        include_aggregate: true,
      };
      const data = await qaoaApi.runBenchmark(params);
      setBenchmarkResult(data);
      await loadCircuitImage(selectedCaseId, data.quantum.optimal_gamma, data.quantum.optimal_beta);
      await loadTrace(selectedCaseId, data.quantum.optimal_gamma, data.quantum.optimal_beta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, loadCircuitImage, loadTrace]);

  const handleDownload = useCallback(async () => {
    await downloadElementAsPNG(CAPTURE_IDS.qaoa, `qaoa_${selectedCaseId}.png`);
  }, [selectedCaseId]);

  return {
    selectedCaseId,
    availableCases,
    benchmarkResult,
    circuitImage,
    trace,
    animationData,
    isLoading,
    isLoadingAnimation,
    error,
    activeTab,
    setSelectedCaseId,
    setActiveTab,
    handleRun,
    handleDownload,
  };
}
