import type {
  DJCase,
  DJBenchmarkResult,
  DJCircuit,
  DJBenchmarkParams,
  DJQuantumTrace,
  DJAnimationPayload,
} from "../types/dj";
import type { ClassicalResult, DJDataset } from "../types/classical";
import type {
  QFTCase,
  QFTBenchmarkResult,
  QFTQuantumTrace,
  QFTBenchmarkParams,
  QFTAnimationPayload,
} from "../types/qft";
import type {
  VQECase,
  VQEBenchmarkResult,
  VQETrace,
  VQEBenchmarkParams,
  VQECircuitImage,
} from "../types/vqe";
import type {
  QAOACase,
  QAOAAnimationPayload,
  QAOABenchmarkResult,
  QAOATrace,
  QAOABenchmarkParams,
  QAOACircuitImage,
} from "../types/qaoa";

// Re-export some types so other modules can import them from services/api
export type { QAOACircuitImage, VQECircuitImage };

const API_BASE = "http://127.0.0.1:5000/api";

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (data?.error && typeof data.error === 'string') {
      return data.error;
    }
  } catch {
    // ignore JSON parse errors
  }
  return fallback;
}

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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error("Benchmark failed");
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
      throw new Error(await readApiError(res, "Circuit image not found"));
    }
    return res.json();
  },

  async getCircuitImageBoxed(caseId: string): Promise<DJCircuitImage> {
    const res = await fetch(`${API_BASE}/dj/circuit-image-boxed/${caseId}`);
    if (!res.ok) {
      throw new Error(await readApiError(res, "Boxed circuit image not found"));
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
      throw new Error("Dataset not found");
    }
    return res.json();
  },

  async runClassicalDJ(caseId: string): Promise<ClassicalResult> {
    const res = await fetch(`${API_BASE}/dj/classic-run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId }),
    });
    if (!res.ok) {
      throw new Error("Classic run failed");
    }
    return res.json();
  },

  async getQuantumTrace(caseId: string): Promise<DJQuantumTrace> {
    const res = await fetch(`${API_BASE}/dj/trace/${caseId}`);
    if (!res.ok) {
      throw new Error("Trace not found");
    }
    return res.json();
  },

  async getAnimation(caseId: string, shots = 1024): Promise<DJAnimationPayload> {
    const res = await fetch(`${API_BASE}/dj/animation/${caseId}?shots=${shots}`);
    if (!res.ok) {
      throw new Error("Animation data not found");
    }
    return res.json();
  },
};

export interface QFTCircuitImage {
  case_id: string;
  n_qubits: number;
  n_points_original: number;
  n_points_padded: number;
  image: string;
  depth: number;
  gate_count: number;
}

// (QFTCircuitImage is exported via the interface declaration above)


export const qftApi = {
  async getCases(): Promise<QFTCase[]> {
    const res = await fetch(`${API_BASE}/qft/cases`);
    const data = await res.json();
    return data.cases || [];
  },

  async runBenchmark(params: QFTBenchmarkParams): Promise<QFTBenchmarkResult> {
    const res = await fetch(`${API_BASE}/qft/benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      throw new Error("Benchmark failed");
    }
    return res.json();
  },

  async getCircuitImage(caseId: string): Promise<QFTCircuitImage> {
    const res = await fetch(`${API_BASE}/qft/circuit-image/${caseId}`);
    if (!res.ok) {
      throw new Error("Circuit image not found");
    }
    return res.json();
  },

  async getDataset(caseId: string): Promise<QFTCase> {
    const res = await fetch(`${API_BASE}/qft/dataset/${caseId}`);
    if (!res.ok) {
      throw new Error("Dataset not found");
    }
    return res.json();
  },

  async getQuantumTrace(caseId: string): Promise<QFTQuantumTrace> {
    const res = await fetch(`${API_BASE}/qft/trace/${caseId}`);
    if (!res.ok) {
      throw new Error("Trace not found");
    }
    return res.json();
  },

  async getAnimation(caseId: string, shots = 1024): Promise<QFTAnimationPayload> {
    const res = await fetch(`${API_BASE}/qft/animation/${caseId}?shots=${shots}`);
    if (!res.ok) {
      throw new Error("Animation data not found");
    }
    return res.json();
  },
};

export const vqeApi = {
  async getCases(): Promise<VQECase[]> {
    const res = await fetch(`${API_BASE}/vqe/cases`);
    const data = await res.json();
    return data.cases || [];
  },

  async runBenchmark(params: VQEBenchmarkParams): Promise<VQEBenchmarkResult> {
    const res = await fetch(`${API_BASE}/vqe/benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("VQE benchmark failed");
    return res.json();
  },

  async getCircuitImage(caseId: string): Promise<VQECircuitImage> {
    const res = await fetch(`${API_BASE}/vqe/circuit-image/${caseId}`);
    if (!res.ok) throw new Error("Circuit image not found");
    return res.json();
  },

  async getDataset(caseId: string): Promise<VQECase> {
    const res = await fetch(`${API_BASE}/vqe/dataset/${caseId}`);
    if (!res.ok) throw new Error("Dataset not found");
    return res.json();
  },

  async getTrace(caseId: string): Promise<VQETrace> {
    const res = await fetch(`${API_BASE}/vqe/trace/${caseId}`);
    if (!res.ok) throw new Error("Trace not found");
    return res.json();
  },
};

export const qaoaApi = {
  async getCases(): Promise<QAOACase[]> {
    const res = await fetch(`${API_BASE}/qaoa/cases`);
    const data = await res.json();
    return data.cases || [];
  },

  async runBenchmark(
    params: QAOABenchmarkParams,
  ): Promise<QAOABenchmarkResult> {
    const res = await fetch(`${API_BASE}/qaoa/benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("QAOA benchmark failed");
    return res.json();
  },

  async getCircuitImage(caseId: string): Promise<QAOACircuitImage> {
    const res = await fetch(`${API_BASE}/qaoa/circuit-image/${caseId}`);
    if (!res.ok) throw new Error("Circuit image not found");
    return res.json();
  },

  async getDataset(caseId: string): Promise<QAOACase> {
    const res = await fetch(`${API_BASE}/qaoa/dataset/${caseId}`);
    if (!res.ok) throw new Error("Dataset not found");
    return res.json();
  },

  async getTrace(caseId: string): Promise<QAOATrace> {
    const res = await fetch(`${API_BASE}/qaoa/trace/${caseId}`);
    if (!res.ok) throw new Error("Trace not found");
    return res.json();
  },

  async getAnimation(caseId: string, shots = 1024): Promise<QAOAAnimationPayload> {
    const res = await fetch(`${API_BASE}/qaoa/animation/${caseId}?shots=${shots}`);
    if (!res.ok) throw new Error("Animation data not found");
    return res.json();
  },
};
