import { useState, useEffect, useCallback } from 'react';
import { qftApi } from '../services/api';
import type {
  QFTBenchmarkResult,
  QFTBenchmarkParams,
  QFTQuantumTrace,
  QFTAnimationPayload,
} from '../types/qft';
import type { QFTCircuitImage } from '../services/api';
import { downloadElementAsPNG } from '../utils/download';
import { CAPTURE_IDS, DEFAULT_SHOTS } from '../constants/app';
import { getSortedCaseIds } from '../utils/cases';

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
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [availableCases, setAvailableCases] = useState<string[]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<QFTBenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<QFTCircuitImage | null>(null);
  const [trace, setTrace] = useState<QFTQuantumTrace | null>(null);
  const [animationData, setAnimationData] = useState<QFTAnimationPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum' | 'animation'>('classic');

  // Load cases on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cases = await qftApi.getCases();
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
      const data = await qftApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch {
      setCircuitImage(null);
    }
  }, []);

  const loadTrace = useCallback(async (caseId: string) => {
    if (!caseId) return;
    try {
      const data = await qftApi.getQuantumTrace(caseId);
      setTrace(data);
    } catch {
      setTrace(null);
    }
  }, []);

  const loadAnimation = useCallback(async (caseId: string) => {
    if (!caseId) return;
    setIsLoadingAnimation(true);
    try {
      const data = await qftApi.getAnimation(caseId, DEFAULT_SHOTS);
      setAnimationData(data);
    } catch {
      setAnimationData(null);
    } finally {
      setIsLoadingAnimation(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCaseId && activeTab === 'animation') {
      queueMicrotask(() => void loadAnimation(selectedCaseId));
    }
  }, [activeTab, selectedCaseId, loadAnimation]);

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
      const params: QFTBenchmarkParams = { case_id: selectedCaseId, shots: DEFAULT_SHOTS };
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
    if (!selectedCaseId) return;
    await downloadElementAsPNG(CAPTURE_IDS.qft, `qft_combined_${selectedCaseId}.png`);
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
