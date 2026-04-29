import { useState, useEffect, useCallback } from 'react';
import { djApi } from '../services/api';
import type {
  DJBenchmarkResult,
  DJBenchmarkParams,
  DJQuantumTrace,
  DJAnimationPayload,
} from '../types/dj';
import type { DJCircuitImage } from '../services/api';
import type { ClassicalResult } from '../types/classical';
import { downloadElementAsPNG } from '../utils/download';
import { CAPTURE_IDS, DEFAULT_SHOTS } from '../constants/app';
import { getSortedCaseIds } from '../utils/cases';

export interface UseDJBenchmarkReturn {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: DJBenchmarkResult | null;
  circuitImage: DJCircuitImage | null;
  boxedCircuitImage: DJCircuitImage | null;
  trace: DJQuantumTrace | null;
  animationData: DJAnimationPayload | null;
  classicalResult: ClassicalResult | null;
  isLoading: boolean;
  error: string | null;
  activeTab: 'classic' | 'quantum' | 'animation';
  isVideoExporting: boolean;
  setIsVideoExporting: (v: boolean) => void;
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'classic' | 'quantum' | 'animation') => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function useDJBenchmark(): UseDJBenchmarkReturn {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [availableCases, setAvailableCases] = useState<string[]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<DJBenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<DJCircuitImage | null>(null);
  const [boxedCircuitImage, setBoxedCircuitImage] = useState<DJCircuitImage | null>(null);
  const [trace, setTrace] = useState<DJQuantumTrace | null>(null);
  const [animationData, setAnimationData] = useState<DJAnimationPayload | null>(null);
  const [classicalResult, setClassicalResult] = useState<ClassicalResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum' | 'animation'>('classic');
  const [isVideoExporting, setIsVideoExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cases = await djApi.getCases();
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
    return () => { cancelled = true; };
  }, []);

  const loadCircuitImage = useCallback(async (caseId: string) => {
    if (!caseId) return;
    try { setCircuitImage(await djApi.getCircuitImage(caseId)); } catch { setCircuitImage(null); }
  }, []);

  const loadBoxedCircuitImage = useCallback(async (caseId: string) => {
    if (!caseId) return;
    try { setBoxedCircuitImage(await djApi.getCircuitImageBoxed(caseId)); } catch { setBoxedCircuitImage(null); }
  }, []);

  const loadTrace = useCallback(async (caseId: string) => {
    if (!caseId) return;
    try { setTrace(await djApi.getQuantumTrace(caseId)); } catch { setTrace(null); }
  }, []);

  const loadAnimation = useCallback(async (caseId: string) => {
    if (!caseId) return;
    try { setAnimationData(await djApi.getAnimation(caseId, DEFAULT_SHOTS)); } catch { setAnimationData(null); }
  }, []);

  const loadClassical = useCallback(async (caseId: string) => {
    if (!caseId) return;
    try { setClassicalResult(await djApi.runClassicalDJ(caseId)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!selectedCaseId) return;
    queueMicrotask(() => {
      void loadClassical(selectedCaseId);
      void loadCircuitImage(selectedCaseId);
      void loadBoxedCircuitImage(selectedCaseId);
      void loadTrace(selectedCaseId);
      void loadAnimation(selectedCaseId);
    });
  }, [selectedCaseId, loadClassical, loadCircuitImage, loadBoxedCircuitImage, loadTrace, loadAnimation]);

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!selectedCaseId) {
      setError('Dataset case belum tersedia.');
      setIsLoading(false);
      return;
    }
    try {
      const params: DJBenchmarkParams = { case_id: selectedCaseId, shots: DEFAULT_SHOTS };
      const data = await djApi.runBenchmark(params);
      setBenchmarkResult(data);
      await loadClassical(selectedCaseId);
      await loadCircuitImage(selectedCaseId);
      await loadBoxedCircuitImage(selectedCaseId);
      void loadAnimation(selectedCaseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, loadClassical, loadCircuitImage, loadBoxedCircuitImage, loadAnimation]);

  const handleDownload = useCallback(async () => {
    if (!selectedCaseId) return;
    await downloadElementAsPNG(CAPTURE_IDS.djQuantum, `dj_combined_${selectedCaseId}.png`);
  }, [selectedCaseId]);

  return {
    selectedCaseId,
    availableCases,
    benchmarkResult,
    circuitImage,
    boxedCircuitImage,
    trace,
    animationData,
    classicalResult,
    isLoading,
    error,
    activeTab,
    isVideoExporting,
    setIsVideoExporting,
    setSelectedCaseId,
    setActiveTab,
    handleRun,
    handleDownload,
  };
}
