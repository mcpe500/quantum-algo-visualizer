import { useState, useEffect, useCallback } from 'react';
import { djApi } from '../services/api';
import type { DJCase, DJBenchmarkResult, DJCircuit } from '../types/dj';

interface UseDJBenchmarkReturn {
  cases: DJCase[];
  selectedCaseId: string;
  shots: number;
  loading: boolean;
  result: DJBenchmarkResult | null;
  circuit: DJCircuit | null;
  error: string | null;
  setSelectedCaseId: (id: string) => void;
  setShots: (shots: number) => void;
  runBenchmark: () => Promise<void>;
  fetchCircuit: (n: number) => Promise<void>;
}

export function useDJBenchmark(): UseDJBenchmarkReturn {
  const [cases, setCases] = useState<DJCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('DJ-01');
  const [shots, setShots] = useState<number>(1024);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DJBenchmarkResult | null>(null);
  const [circuit, setCircuit] = useState<DJCircuit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    try {
      const data = await djApi.getCases();
      setCases(data);
    } catch {
      setError('Gagal memuatkan data kes');
    }
  }, []);

  const fetchCircuit = useCallback(async (n: number) => {
    try {
      const data = await djApi.getCircuit(n);
      setCircuit(data);
    } catch {
      setError('Gagal memuatkan litar');
    }
  }, []);

  const runBenchmark = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await djApi.runBenchmark({
        case_id: selectedCaseId,
        shots,
      });
      setResult(data);
      if (data.n_qubits) {
        fetchCircuit(data.n_qubits);
      }
    } catch {
      setError('Ralat penanda aras');
    } finally {
      setLoading(false);
    }
  }, [selectedCaseId, shots, fetchCircuit]);

  useEffect(() => {
    fetchCases();
    fetchCircuit(3);
  }, [fetchCases, fetchCircuit]);

  return {
    cases,
    selectedCaseId,
    shots,
    loading,
    result,
    circuit,
    error,
    setSelectedCaseId,
    setShots,
    runBenchmark,
    fetchCircuit,
  };
}
