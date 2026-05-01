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
  QAOAAggregateResult,
} from "../types/qaoa";

export type { QAOACircuitImage, VQECircuitImage };

const API_BASE = "http://127.0.0.1:5000/api";
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

type QueryValue = string | number | boolean | Array<string | number | boolean> | undefined;

interface CasesResponse<TCase> {
  cases?: TCase[];
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (data?.error && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    // ignore JSON parse errors
  }
  return fallback;
}

function createUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      params.set(key, Array.isArray(value) ? value.join(",") : String(value));
    }
  }
  const suffix = params.toString();
  return `${API_BASE}${path}${suffix ? `?${suffix}` : ""}`;
}

async function requestJson<TResponse>(
  path: string,
  options?: RequestInit,
  errorMessage = "Request failed",
  query?: Record<string, QueryValue>,
): Promise<TResponse> {
  const response = await fetch(createUrl(path, query), options);
  if (!response.ok) {
    throw new Error(await readApiError(response, errorMessage));
  }
  return response.json() as Promise<TResponse>;
}

function requestCases<TCase>(path: string): Promise<TCase[]> {
  return requestJson<CasesResponse<TCase>>(path).then((data) => data.cases ?? []);
}

function postJson<TResponse>(
  path: string,
  payload: unknown,
  errorMessage: string,
): Promise<TResponse> {
  return requestJson<TResponse>(
    path,
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    },
    errorMessage,
  );
}

export interface DJCircuitImage {
  case_id: string;
  n_qubits: number;
  image: string;
  depth: number;
  gate_count: number;
}

export interface QFTCircuitImage {
  case_id: string;
  n_qubits: number;
  n_points_original: number;
  n_points_padded: number;
  image: string;
  depth: number;
  gate_count: number;
}

export const djApi = {
  getCases(): Promise<DJCase[]> {
    return requestCases<DJCase>("/dj/cases");
  },

  runBenchmark(params: DJBenchmarkParams): Promise<DJBenchmarkResult> {
    return postJson<DJBenchmarkResult>("/dj/benchmark", params, "Benchmark failed");
  },

  getCircuit(n: number): Promise<DJCircuit> {
    return requestJson<DJCircuit>(`/dj/circuit/${n}`);
  },

  getCircuitImage(caseId: string): Promise<DJCircuitImage> {
    return requestJson<DJCircuitImage>(`/dj/circuit-image/${caseId}`, undefined, "Circuit image not found");
  },

  getCircuitImageBoxed(caseId: string): Promise<DJCircuitImage> {
    return requestJson<DJCircuitImage>(`/dj/circuit-image-boxed/${caseId}`, undefined, "Boxed circuit image not found");
  },

  healthCheck(): Promise<{ status: string; message: string }> {
    return requestJson<{ status: string; message: string }>("/health");
  },

  getDataset(caseId: string): Promise<DJDataset> {
    return requestJson<DJDataset>(`/dj/dataset/${caseId}`, undefined, "Dataset not found");
  },

  runClassicalDJ(caseId: string): Promise<ClassicalResult> {
    return postJson<ClassicalResult>("/dj/classic-run", { case_id: caseId }, "Classic run failed");
  },

  getQuantumTrace(caseId: string): Promise<DJQuantumTrace> {
    return requestJson<DJQuantumTrace>(`/dj/trace/${caseId}`, undefined, "Trace not found");
  },

  getAnimation(caseId: string, shots = 1024): Promise<DJAnimationPayload> {
    return requestJson<DJAnimationPayload>(`/dj/animation/${caseId}`, undefined, "Animation data not found", { shots });
  },
};

export const qftApi = {
  getCases(): Promise<QFTCase[]> {
    return requestCases<QFTCase>("/qft/cases");
  },

  runBenchmark(params: QFTBenchmarkParams): Promise<QFTBenchmarkResult> {
    return postJson<QFTBenchmarkResult>("/qft/benchmark", params, "Benchmark failed");
  },

  getCircuitImage(caseId: string): Promise<QFTCircuitImage> {
    return requestJson<QFTCircuitImage>(`/qft/circuit-image/${caseId}`, undefined, "Circuit image not found");
  },

  getDataset(caseId: string): Promise<QFTCase> {
    return requestJson<QFTCase>(`/qft/dataset/${caseId}`, undefined, "Dataset not found");
  },

  getQuantumTrace(caseId: string): Promise<QFTQuantumTrace> {
    return requestJson<QFTQuantumTrace>(`/qft/trace/${caseId}`, undefined, "Trace not found");
  },

  getAnimation(caseId: string, shots = 1024): Promise<QFTAnimationPayload> {
    return requestJson<QFTAnimationPayload>(`/qft/animation/${caseId}`, undefined, "Animation data not found", { shots });
  },
};

export const vqeApi = {
  getCases(): Promise<VQECase[]> {
    return requestCases<VQECase>("/vqe/cases");
  },

  runBenchmark(params: VQEBenchmarkParams): Promise<VQEBenchmarkResult> {
    return postJson<VQEBenchmarkResult>("/vqe/benchmark", params, "VQE benchmark failed");
  },

  getCircuitImage(caseId: string): Promise<VQECircuitImage> {
    return requestJson<VQECircuitImage>(`/vqe/circuit-image/${caseId}`, undefined, "Circuit image not found");
  },

  getDataset(caseId: string): Promise<VQECase> {
    return requestJson<VQECase>(`/vqe/dataset/${caseId}`, undefined, "Dataset not found");
  },

  getTrace(caseId: string): Promise<VQETrace> {
    return requestJson<VQETrace>(`/vqe/trace/${caseId}`, undefined, "Trace not found");
  },
};

type QAOAAngleValue = number[] | number | undefined;

function getQAOAAngleQuery(gamma?: QAOAAngleValue, beta?: QAOAAngleValue): Record<string, QueryValue> {
  return { gamma, beta };
}

export const qaoaApi = {
  getCases(): Promise<QAOACase[]> {
    return requestCases<QAOACase>("/qaoa/cases");
  },

  runBenchmark(params: QAOABenchmarkParams): Promise<QAOABenchmarkResult> {
    return postJson<QAOABenchmarkResult>("/qaoa/benchmark", params, "QAOA benchmark failed");
  },

  getCircuitImage(caseId: string, gamma?: QAOAAngleValue, beta?: QAOAAngleValue): Promise<QAOACircuitImage> {
    return requestJson<QAOACircuitImage>(
      `/qaoa/circuit-image/${caseId}`,
      undefined,
      "Circuit image not found",
      getQAOAAngleQuery(gamma, beta),
    );
  },

  getDataset(caseId: string): Promise<QAOACase> {
    return requestJson<QAOACase>(`/qaoa/dataset/${caseId}`, undefined, "Dataset not found");
  },

  getTrace(caseId: string, gamma?: QAOAAngleValue, beta?: QAOAAngleValue): Promise<QAOATrace> {
    return requestJson<QAOATrace>(
      `/qaoa/trace/${caseId}`,
      undefined,
      "Trace not found",
      getQAOAAngleQuery(gamma, beta),
    );
  },

  getAnimation(caseId: string, shots = 1024): Promise<QAOAAnimationPayload> {
    return requestJson<QAOAAnimationPayload>(`/qaoa/animation/${caseId}`, undefined, "Animation data not found", { shots });
  },

  getAggregate(caseId: string, seedCount = 8, seedStart = 0, maxiter = 120): Promise<QAOAAggregateResult> {
    return requestJson<QAOAAggregateResult>(`/qaoa/aggregate/${caseId}`, undefined, "QAOA aggregate data not found", {
      seed_count: seedCount,
      seed_start: seedStart,
      maxiter,
    });
  },
};
