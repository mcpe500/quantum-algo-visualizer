import { useState, useCallback } from 'react';
import { djApi } from '../services/api';
import type { DJDataset, ClassicalResult } from '../types/classical';
import { getErrorMessage } from '../utils/async';

interface UseClassicalDJReturn {
  dataset: DJDataset | null;
  result: ClassicalResult | null;
  isLoading: boolean;
  error: string | null;
  loadDataset: (caseId: string) => Promise<void>;
  runClassical: (caseId: string) => Promise<void>;
}

export function useClassicalDJ(): UseClassicalDJReturn {
  const [dataset, setDataset] = useState<DJDataset | null>(null);
  const [result, setResult] = useState<ClassicalResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDataset = useCallback(async (caseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await djApi.getDataset(caseId);
      setDataset(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dataset'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const runClassical = useCallback(async (caseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await djApi.runClassicalDJ(caseId);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to run classical algorithm'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    dataset,
    result,
    isLoading,
    error,
    loadDataset,
    runClassical,
  };
}
