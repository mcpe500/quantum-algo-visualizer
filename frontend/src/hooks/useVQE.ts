import { useState, useEffect, useCallback } from 'react';
import { vqeApi } from '../services/api';
import type {
  VQEBenchmarkResult,
  VQEBenchmarkParams,
  VQETrace,
} from '../types/vqe';
import type { VQECircuitImage } from '../services/api';
import { sortCaseIds } from '../utils/sorting';
import { downloadElementAsPNG } from '../utils/download';

export interface UseVQEReturn {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: VQEBenchmarkResult | null;
  circuitImage: VQECircuitImage | null;
  trace: VQETrace | null;
  isLoading: boolean;
  error: string | null;
  activeTab: 'classic' | 'quantum';
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'classic' | 'quantum') => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function useVQE(): UseVQEReturn {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('VQE-01');
  const [availableCases, setAvailableCases] = useState<string[]>(['VQE-01']);
  const [benchmarkResult, setBenchmarkResult] = useState<VQEBenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<VQECircuitImage | null>(null);
  const [trace, setTrace] = useState<VQETrace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum'>('classic');

  // Load cases on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cases = await vqeApi.getCases();
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
      const data = await vqeApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch {
      setCircuitImage(null);
    }
  }, []);

  const loadTrace = useCallback(async (caseId: string) => {
    try {
      const data = await vqeApi.getTrace(caseId);
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
      const params: VQEBenchmarkParams = { case_id: selectedCaseId, shots: 1024 };
      const data = await vqeApi.runBenchmark(params);
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
    await downloadElementAsPNG('vqe-capture', `vqe_${selectedCaseId}.png`);
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
