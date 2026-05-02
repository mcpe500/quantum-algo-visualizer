import { useState, useEffect, useCallback } from 'react';
import { downloadElementAsPNG } from '../../utils/download';
import { DEFAULT_SHOTS, NO_DATASET_CASE_ERROR } from '../../constants/app';
import { getSortedCaseIds } from '../../utils/cases';
import { fetchNullable, getErrorMessage } from '../../utils/async';

export interface AlgorithmBenchmarkConfig<
  TBenchmarkResult = unknown,
  TCircuitImage = unknown,
  TTrace = unknown,
  TAnimationData = unknown,
> {
  algorithmId: string;
  defaultCaseId?: string;
  defaultTab?: 'classic' | 'quantum' | 'animation';
  captureId?: string;
  defaultShots?: number;
  api: {
    getCases: () => Promise<{ case_id: string }[]>;
    runBenchmark: (params: { case_id: string; shots: number }) => Promise<TBenchmarkResult>;
    getCircuitImage: (caseId: string) => Promise<TCircuitImage>;
    getTrace: (caseId: string) => Promise<TTrace>;
    getAnimation?: (caseId: string, shots: number) => Promise<TAnimationData>;
  };
}

export interface AlgorithmBenchmarkReturn<
  TBenchmarkResult = unknown,
  TCircuitImage = unknown,
  TTrace = unknown,
  TAnimationData = unknown,
> {
  selectedCaseId: string;
  availableCases: string[];
  benchmarkResult: TBenchmarkResult | null;
  circuitImage: TCircuitImage | null;
  trace: TTrace | null;
  animationData: TAnimationData | null;
  isLoading: boolean;
  isLoadingAnimation: boolean;
  error: string | null;
  activeTab: 'classic' | 'quantum' | 'animation';
  setSelectedCaseId: (id: string) => void;
  setActiveTab: (tab: 'classic' | 'quantum' | 'animation') => void;
  handleRun: () => Promise<void>;
  handleDownload: () => Promise<void>;
}

export function createUseAlgorithmBenchmark<
  TBenchmarkResult = unknown,
  TCircuitImage = unknown,
  TTrace = unknown,
  TAnimationData = unknown,
>(
  config: AlgorithmBenchmarkConfig<TBenchmarkResult, TCircuitImage, TTrace, TAnimationData>
) {
  const {
    algorithmId,
    defaultCaseId = '',
    defaultTab = 'classic',
    captureId,
    defaultShots = DEFAULT_SHOTS,
    api,
  } = config;

  return function useAlgorithmBenchmark(): AlgorithmBenchmarkReturn<
    TBenchmarkResult,
    TCircuitImage,
    TTrace,
    TAnimationData
  > {
    const [selectedCaseId, setSelectedCaseId] = useState<string>(defaultCaseId);
    const [availableCases, setAvailableCases] = useState<string[]>(defaultCaseId ? [defaultCaseId] : []);
    const [benchmarkResult, setBenchmarkResult] = useState<TBenchmarkResult | null>(null);
    const [circuitImage, setCircuitImage] = useState<TCircuitImage | null>(null);
    const [trace, setTrace] = useState<TTrace | null>(null);
    const [animationData, setAnimationData] = useState<TAnimationData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingAnimation, setIsLoadingAnimation] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'classic' | 'quantum' | 'animation'>(defaultTab);

      const loadCircuitImage = useCallback(
        async (caseId: string) => {
          if (!caseId) return;
          setCircuitImage(await fetchNullable(() => api.getCircuitImage(caseId)));
        },
        []
      );

      const loadTrace = useCallback(
        async (caseId: string) => {
          if (!caseId) return;
          setTrace(await fetchNullable(() => api.getTrace(caseId)));
        },
        []
      );

      const loadAnimation = useCallback(
        async (caseId: string) => {
          if (!caseId || !api.getAnimation) return;
          setIsLoadingAnimation(true);
          setAnimationData(await fetchNullable(() => api.getAnimation!(caseId, defaultShots)));
          setIsLoadingAnimation(false);
        },
        []
      );

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
          setAvailableCases(defaultCaseId ? [defaultCaseId] : []);
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
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
          setError(NO_DATASET_CASE_ERROR);
          setIsLoading(false);
          return;
        }
      try {
        const data = await api.runBenchmark({
          case_id: selectedCaseId,
          shots: defaultShots,
        });
          setBenchmarkResult(data);
          await loadCircuitImage(selectedCaseId);
          await loadTrace(selectedCaseId);
        } catch (err) {
          setError(getErrorMessage(err, 'Benchmark failed'));
        } finally {
          setIsLoading(false);
        }
      }, [selectedCaseId, loadCircuitImage, loadTrace]);

      const handleDownload = useCallback(async () => {
        if (!captureId) {
          throw new Error('captureId not configured');
        }
        if (!selectedCaseId) return;
        await downloadElementAsPNG(captureId, `${algorithmId}_${selectedCaseId}.png`);
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
  };
}
