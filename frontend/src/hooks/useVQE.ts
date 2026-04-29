import { useState, useEffect, useCallback } from 'react';
import { vqeApi } from '../services/api';
import type {
  VQEBenchmarkResult,
  VQEBenchmarkParams,
  VQETrace,
} from '../types/vqe';
import type { VQECircuitImage } from '../services/api';
import { downloadElementAsPNG } from '../utils/download';
import { CAPTURE_IDS, DEFAULT_SHOTS } from '../constants/app';
import { getSortedCaseIds } from '../utils/cases';

export interface UseVQEReturn {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: VQEBenchmarkResult | null;
  circuitImage: VQECircuitImage | null;
  trace: VQETrace | null;
  isLoading: boolean;
  error: string | null;
  activeTab: 'classic' | 'quantum';
  shots: number;
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'classic' | 'quantum') => void;
  setShots: (shots: number) => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function useVQE(): UseVQEReturn {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [availableCases, setAvailableCases] = useState<string[]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<VQEBenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<VQECircuitImage | null>(null);
  const [trace, setTrace] = useState<VQETrace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum'>('classic');
  const [shots, setShots] = useState(DEFAULT_SHOTS);

  // Load cases on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cases = await vqeApi.getCases();
        if (cancelled) return;
        const ids = getSortedCaseIds(cases);
        if (ids.length > 0) {
          setAvailableCases(ids);
          setSelectedCaseId((cur) => (ids.includes(cur) ? cur : ids[0]));
        }
      } catch {
        setAvailableCases([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCircuitImage = useCallback(async (caseId: string) => {
    if (!caseId) return;
    try {
      const data = await vqeApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch {
      setCircuitImage(null);
    }
  }, []);

  const loadTrace = useCallback(async (caseId: string) => {
    if (!caseId) return;
    try {
      const data = await vqeApi.getTrace(caseId);
      setTrace(data);
    } catch {
      setTrace(null);
    }
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;
    queueMicrotask(() => {
      void loadCircuitImage(selectedCaseId);
      void loadTrace(selectedCaseId);
    });
  }, [selectedCaseId, loadCircuitImage, loadTrace]);

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!selectedCaseId) {
      setError('Dataset case belum tersedia.');
      setIsLoading(false);
      return;
    }
    try {
      const params: VQEBenchmarkParams = { case_id: selectedCaseId, shots };
      const data = await vqeApi.runBenchmark(params);
      setBenchmarkResult(data);
      await loadCircuitImage(selectedCaseId);
      await loadTrace(selectedCaseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, shots, loadCircuitImage, loadTrace]);

  const handleDownload = useCallback(async () => {
    if (!selectedCaseId) return;
    await downloadElementAsPNG(CAPTURE_IDS.vqe, `vqe_${selectedCaseId}.png`);
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
    shots,
    setSelectedCaseId,
    setActiveTab,
    setShots,
    handleRun,
    handleDownload,
  };
}
