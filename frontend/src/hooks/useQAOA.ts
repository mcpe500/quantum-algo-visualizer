import { useState, useEffect, useCallback } from 'react';
import { qaoaApi } from '../services/api';
import type {
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
  isLoading: boolean;
  error: string | null;
  activeTab: 'classic' | 'quantum';
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'classic' | 'quantum') => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function useQAOA(): UseQAOAReturn {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('QAOA-01');
  const [availableCases, setAvailableCases] = useState<string[]>(['QAOA-01']);
  const [benchmarkResult, setBenchmarkResult] = useState<QAOABenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<QAOACircuitImage | null>(null);
  const [trace, setTrace] = useState<QAOATrace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum'>('classic');

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

  const loadCircuitImage = useCallback(async (caseId: string) => {
    try {
      const data = await qaoaApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch {
      setCircuitImage(null);
    }
  }, []);

  const loadTrace = useCallback(async (caseId: string) => {
    try {
      const data = await qaoaApi.getTrace(caseId);
      setTrace(data);
    } catch {
      setTrace(null);
    }
  }, []);

  useEffect(() => {
    void loadCircuitImage(selectedCaseId);
    void loadTrace(selectedCaseId);
  }, [selectedCaseId, loadCircuitImage, loadTrace]);

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: QAOABenchmarkParams = { case_id: selectedCaseId, shots: DEFAULT_SHOTS };
      const data = await qaoaApi.runBenchmark(params);
      setBenchmarkResult(data);
      await loadCircuitImage(selectedCaseId);
      await loadTrace(selectedCaseId);
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
    isLoading,
    error,
    activeTab,
    setSelectedCaseId,
    setActiveTab,
    handleRun,
    handleDownload,
  };
}
