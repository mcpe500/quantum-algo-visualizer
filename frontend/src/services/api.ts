import type { DJCase, DJBenchmarkResult, DJCircuit, DJBenchmarkParams } from '../types/dj';
import type { ClassicalResult, DJDataset } from '../types/classical';

const API_BASE = 'http://127.0.0.1:5000/api';

export interface DJCircuitImage {
  case_id: string;
  n_qubits: number;
  image: string;
  depth: number;
  gate_count: number;
}

export const djApi = {
  async getCases(): Promise<DJCase[]> {
    const res = await fetch(`${API_BASE}/dj/cases`);
    const data = await res.json();
    return data.cases || [];
  },

  async runBenchmark(params: DJBenchmarkParams): Promise<DJBenchmarkResult> {
    const res = await fetch(`${API_BASE}/dj/benchmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error('Benchmark failed');
    }
    return res.json();
  },

  async getCircuit(n: number): Promise<DJCircuit> {
    const res = await fetch(`${API_BASE}/dj/circuit/${n}`);
    return res.json();
  },

  async getCircuitImage(caseId: string): Promise<DJCircuitImage> {
    const res = await fetch(`${API_BASE}/dj/circuit-image/${caseId}`);
    if (!res.ok) {
      throw new Error('Circuit image not found');
    }
    return res.json();
  },

  async healthCheck(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getDataset(caseId: string): Promise<DJDataset> {
    const res = await fetch(`${API_BASE}/dj/dataset/${caseId}`);
    if (!res.ok) {
      throw new Error('Dataset not found');
    }
    return res.json();
  },

  async runClassicalDJ(caseId: string): Promise<ClassicalResult> {
    const res = await fetch(`${API_BASE}/dj/classic-run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId }),
    });
    if (!res.ok) {
      throw new Error('Classic run failed');
    }
    return res.json();
  },
};
