import { useState, useEffect, useCallback } from 'react';
import { fetchNullable, getErrorMessage } from '../utils/async';
import { getSortedCaseIds } from '../utils/cases';
import { downloadElementAsPNG } from '../utils/download';
import { NO_DATASET_CASE_ERROR } from '../constants/app';

export interface BaseAlgorithmBenchmarkConfig<TCase, TParams, TResult, TCircuitImage> {
  api: {
    getCases: () => Promise<TCase[]>;
    runBenchmark: (params: TParams) => Promise<TResult>;
    getCircuitImage: (caseId: string, ...extra: any[]) => Promise<TCircuitImage>;
  };
  getDefaultParams: (caseId: string) => TParams;
  getCaptureId: (caseId: string) => string;
}

export interface BaseAlgorithmBenchmarkState<TResult, TCircuitImage> {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: TResult | null;
  circuitImage: TCircuitImage | null;
  isLoading: boolean;
  error: string | null;
}

export function useBaseAlgorithmBenchmark<
  TCase extends { case_id: string },
  TParams extends { case_id: string; shots?: number },
  TResult,
  TCircuitImage
>(
  config: BaseAlgorithmBenchmarkConfig<TCase, TParams, TResult, TCircuitImage>
): BaseAlgorithmBenchmarkState<TResult, TCircuitImage> & {
  setSelectedCaseId: (id: string) => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
} {
  const { api, getDefaultParams, getCaptureId } = config;

  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [availableCases, setAvailableCases] = useState<string[]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<TResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<TCircuitImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cases = await api.getCases();
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
  }, [api.getCases]);

  const loadCircuitImage = useCallback(async (caseId: string, ...extra: any[]) => {
    if (!caseId) return;
    setCircuitImage(await fetchNullable(() => api.getCircuitImage(caseId, ...extra)));
  }, [api.getCircuitImage]);

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!selectedCaseId) {
      setError(NO_DATASET_CASE_ERROR);
      setIsLoading(false);
      return;
    }
    try {
      const params = getDefaultParams(selectedCaseId);
      const data = await api.runBenchmark(params);
      setBenchmarkResult(data);
      await loadCircuitImage(selectedCaseId);
    } catch (err) {
      setError(getErrorMessage(err, 'Benchmark failed'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, api.runBenchmark, getDefaultParams, loadCircuitImage]);

  const handleDownload = useCallback(async () => {
    if (!selectedCaseId) return;
    await downloadElementAsPNG(getCaptureId(selectedCaseId), `${getCaptureId(selectedCaseId)}_${selectedCaseId}.png`);
  }, [selectedCaseId, getCaptureId]);

  return {
    selectedCaseId,
    availableCases,
    benchmarkResult,
    circuitImage,
    isLoading,
    error,
    setSelectedCaseId,
    handleRun,
    handleDownload,
  };
}
