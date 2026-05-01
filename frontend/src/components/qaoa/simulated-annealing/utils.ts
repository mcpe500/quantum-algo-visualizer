import type { Matrix, Edge, CutDetailsResult, CutDetail, JsonPayload } from './types';

export function formatNumber(value: unknown, digits = 5) {
  if (value === null || value === undefined) return '-';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (Number.isInteger(number)) return String(number);
  return Number(number.toFixed(digits)).toString();
}

export function createTemplateFromResult(result: { case_id: string; description: string; problem: string; adjacency_matrix: Matrix }) {
  return JSON.stringify(
    {
      case_id: result.case_id,
      description: result.description,
      problem: result.problem,
      graph: {
        adjacency_matrix: result.adjacency_matrix,
      },
    },
    null,
    2,
  );
}

export function getMatrixFromPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const data = payload as JsonPayload;
    if (data.graph?.adjacency_matrix) return data.graph.adjacency_matrix;
    if (data.adjacency_matrix) return data.adjacency_matrix;
  }
  throw new Error('JSON harus memiliki graph.adjacency_matrix atau adjacency_matrix.');
}

export function validateMatrix(matrix: Matrix) {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error('Adjacency matrix harus berupa array 2D dan tidak boleh kosong.');
  }

  const n = matrix.length;
  if (n > 10) {
    throw new Error('Maksimal 10 node agar visual graf tetap terbaca.');
  }

  matrix.forEach((row, i) => {
    if (!Array.isArray(row) || row.length !== n) {
      throw new Error(`Baris ke-${i} harus memiliki panjang ${n}.`);
    }

    row.forEach((value, j) => {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        throw new Error(`Nilai matrix[${i}][${j}] harus angka.`);
      }
      if (number < 0) {
        throw new Error(`Nilai matrix[${i}][${j}] tidak boleh negatif.`);
      }
    });
  });

  for (let i = 0; i < n; i += 1) {
    if (Number(matrix[i][i]) !== 0) {
      throw new Error(`Diagonal matrix[${i}][${i}] harus 0.`);
    }

    for (let j = i + 1; j < n; j += 1) {
      if (Number(matrix[i][j]) !== Number(matrix[j][i])) {
        throw new Error(`Matrix harus simetris: matrix[${i}][${j}] harus sama dengan matrix[${j}][${i}].`);
      }
    }
  }
}

export function toMatrix(rawMatrix: unknown): Matrix {
  if (!Array.isArray(rawMatrix)) {
    throw new Error('Adjacency matrix harus berupa array 2D.');
  }

  return rawMatrix.map((row) => {
    if (!Array.isArray(row)) {
      throw new Error('Adjacency matrix harus berupa array 2D.');
    }
    return row.map(Number);
  });
}

export function getEdges(matrix: Matrix): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = i + 1; j < matrix.length; j += 1) {
      const weight = Number(matrix[i][j]);
      if (weight !== 0) edges.push({ u: i, v: j, weight });
    }
  }
  return edges;
}

export function calcCutDetails(matrix: Matrix, bits: number[]): CutDetailsResult {
  const edges = getEdges(matrix);
  let cut = 0;
  const terms: string[] = [];
  const details: CutDetail[] = [];

  edges.forEach(({ u, v, weight }) => {
    const isCut = bits[u] !== bits[v];
    const contribution = isCut ? weight : 0;
    cut += contribution;
    terms.push(formatNumber(contribution));
    details.push({ u, v, weight, isCut, contribution });
  });

  return {
    cut,
    expression: terms.length ? `${terms.join('+')} = ${formatNumber(cut)}` : '0 = 0',
    details,
  };
}

export function flipOneBit(bits: number[], nodeIndex: number) {
  const next = [...bits];
  next[nodeIndex] = next[nodeIndex] === 0 ? 1 : 0;
  return next;
}

export function createSeededRandom(seed: number) {
  let state = Math.trunc(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
