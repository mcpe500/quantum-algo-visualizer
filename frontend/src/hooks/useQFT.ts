import { useState, useEffect, useCallback } from 'react';
import { qftApi } from '../services/api';
import type {
  QFTBenchmarkResult,
  QFTBenchmarkParams,
  QFTQuantumTrace,
} from '../types/qft';
import type { QFTCircuitImage } from '../services/api';
import { sortCaseIds } from '../utils/sorting';
import { downloadElementAsPNG } from '../utils/download';

export interface UseQFTReturn {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: QFTBenchmarkResult | null;
  circuitImage: QFTCircuitImage | null;
  trace: QFTQuantumTrace | null;
  isLoading: boolean;
  error: string | null;
  activeTab: 'classic' | 'quantum';
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'classic' | 'quantum') => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function useQFT(): UseQFTReturn {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('QFT-01');
  const [availableCases, setAvailableCases] = useState<string[]>(['QFT-01']);
  const [benchmarkResult, setBenchmarkResult] = useState<QFTBenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<QFTCircuitImage | null>(null);
  const [trace, setTrace] = useState<QFTQuantumTrace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum'>('classic');

  // Load cases on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cases = await qftApi.getCases();
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
      const data = await qftApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch {
      setCircuitImage(null);
    }
  }, []);

  const loadTrace = useCallback(async (caseId: string) => {
    try {
      const data = await qftApi.getQuantumTrace(caseId);
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
      const params: QFTBenchmarkParams = { case_id: selectedCaseId, shots: 1024 };
      const data = await qftApi.runBenchmark(params);
      setBenchmarkResult(data);
      await loadCircuitImage(selectedCaseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, loadCircuitImage]);

  const handleDownload = useCallback(async () => {
    await downloadElementAsPNG('capture-area', `qft_combined_${selectedCaseId}.png`);
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
