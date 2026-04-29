import { useEffect, useMemo, useState } from 'react';
import type { QAOABenchmarkResult } from '../../types/qaoa';

type Matrix = number[][];

interface Edge {
  u: number;
  v: number;
  weight: number;
}

interface CutDetail {
  u: number;
  v: number;
  weight: number;
  isCut: boolean;
  contribution: number;
}

interface CutDetailsResult {
  cut: number;
  expression: string;
  details: CutDetail[];
}

type StatusColor = 'slate' | 'emerald' | 'yellow' | 'red';

interface TraceStep {
  step: number;
  action: string;
  flipNode?: number;
  temperature: number;
  newTemperature: number | null;
  minTemperature: number;
  currentState: string;
  candidateState: string;
  resultState: string;
  currentCut: number;
  candidateCut: number;
  resultCut: number;
  deltaCut: number;
  randomValue: number | null;
  probability: number | null;
  accepted: boolean;
  status: string;
  color: StatusColor;
  stopAfter: boolean;
  cutDetails: CutDetailsResult;
}

interface SimulatedAnnealingResult {
  trace: TraceStep[];
  best: {
    state: string;
    cut: number;
    step: number;
  };
  finalState: string;
  finalCut: number;
  stopReason: {
    type: 'temperature' | 'maxStep';
    text: string;
  };
}

interface SimulationConfig {
  matrix: Matrix;
  initialTemperature: number;
  alpha: number;
  minTemperature: number;
  maxSteps: number;
  seed: number;
}

interface JsonPayload {
  case_id?: string;
  description?: string;
  problem?: string;
  graph?: {
    adjacency_matrix?: unknown;
  };
  adjacency_matrix?: unknown;
}

interface QAOASimulatedAnnealingFlowProps {
  result: QAOABenchmarkResult;
}

function formatNumber(value: unknown, digits = 5) {
  if (value === null || value === undefined) return '-';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (Number.isInteger(number)) return String(number);
  return Number(number.toFixed(digits)).toString();
}

function createTemplateFromResult(result: QAOABenchmarkResult) {
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

function getMatrixFromPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const data = payload as JsonPayload;
    if (data.graph?.adjacency_matrix) return data.graph.adjacency_matrix;
    if (data.adjacency_matrix) return data.adjacency_matrix;
  }
  throw new Error('JSON harus memiliki graph.adjacency_matrix atau adjacency_matrix.');
}

function validateMatrix(matrix: Matrix) {
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

function toMatrix(rawMatrix: unknown): Matrix {
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

function getEdges(matrix: Matrix) {
  const edges: Edge[] = [];
  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = i + 1; j < matrix.length; j += 1) {
      const weight = Number(matrix[i][j]);
      if (weight !== 0) edges.push({ u: i, v: j, weight });
    }
  }
  return edges;
}

function calcCutDetails(matrix: Matrix, bits: number[]): CutDetailsResult {
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

function flipOneBit(bits: number[], nodeIndex: number) {
  const next = [...bits];
  next[nodeIndex] = next[nodeIndex] === 0 ? 1 : 0;
  return next;
}

function createSeededRandom(seed: number) {
  let state = Math.trunc(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function simulate({ matrix, initialTemperature, alpha, minTemperature, maxSteps, seed }: SimulationConfig): SimulatedAnnealingResult {
  const n = matrix.length;
  const random = createSeededRandom(seed);
  let currentBits = Array(n).fill(0) as number[];
  let currentTemperature = initialTemperature;
  let currentCut = calcCutDetails(matrix, currentBits).cut;
  let best = { state: currentBits.join(''), cut: currentCut, step: 0 };
  const trace: TraceStep[] = [];

  trace.push({
    step: 0,
    action: 'Kondisi Awal',
    temperature: currentTemperature,
    newTemperature: null,
    minTemperature,
    currentState: currentBits.join(''),
    candidateState: currentBits.join(''),
    resultState: currentBits.join(''),
    currentCut,
    candidateCut: currentCut,
    resultCut: currentCut,
    deltaCut: 0,
    randomValue: null,
    probability: null,
    accepted: true,
    status: 'START',
    color: 'slate',
    stopAfter: false,
    cutDetails: calcCutDetails(matrix, currentBits),
  });

  let step = 1;
  let stoppedByTemperature = false;

  while (currentTemperature >= minTemperature && step <= maxSteps) {
    const flipNode = Math.floor(random() * n);
    const candidateBits = flipOneBit(currentBits, flipNode);
    const candidateCutDetails = calcCutDetails(matrix, candidateBits);
    const candidateCut = candidateCutDetails.cut;
    const deltaCut = candidateCut - currentCut;

    let accepted = false;
    let randomValue: number | null = null;
    let probability: number | null = null;
    let status = '';
    let color: StatusColor = 'slate';

    if (deltaCut >= 0) {
      accepted = true;
      status = 'ACCEPT (LEBIH BAIK / SAMA)';
      color = 'emerald';
    } else {
      probability = Math.exp(deltaCut / currentTemperature);
      randomValue = random();

      if (randomValue < probability) {
        accepted = true;
        status = 'ACCEPT (EKSPLORASI)';
        color = 'yellow';
      } else {
        accepted = false;
        status = 'REJECT (BURUK)';
        color = 'red';
      }
    }

    const previousState = currentBits.join('');
    const previousCut = currentCut;

    if (accepted) {
      currentBits = candidateBits;
      currentCut = candidateCut;

      if (currentCut > best.cut) {
        best = { state: currentBits.join(''), cut: currentCut, step };
      }
    }

    const newTemperature = currentTemperature * alpha;
    const stopAfter = newTemperature < minTemperature;

    trace.push({
      step,
      action: `Flip Node ${flipNode}`,
      flipNode,
      temperature: currentTemperature,
      newTemperature,
      minTemperature,
      currentState: previousState,
      candidateState: candidateBits.join(''),
      resultState: currentBits.join(''),
      currentCut: previousCut,
      candidateCut,
      resultCut: currentCut,
      deltaCut,
      randomValue,
      probability,
      accepted,
      status,
      color,
      stopAfter,
      cutDetails: candidateCutDetails,
    });

    if (stopAfter) {
      stoppedByTemperature = true;
      break;
    }

    currentTemperature = newTemperature;
    step += 1;
  }

  const lastStep = trace[trace.length - 1];
  const stopReason = stoppedByTemperature
    ? {
        type: 'temperature' as const,
        text: `Suhu telah melewati batas minimum: T_baru ${formatNumber(lastStep.newTemperature)} < T_min ${formatNumber(minTemperature)}. Algoritma berhenti karena sudah terlalu dingin untuk eksplorasi berikutnya.`,
      }
    : {
        type: 'maxStep' as const,
        text: `Simulasi berhenti karena mencapai Max Step Limit (${maxSteps} step).`,
      };

  return {
    trace,
    best,
    finalState: currentBits.join(''),
    finalCut: currentCut,
    stopReason,
  };
}

function getNodeCoordinates(n: number) {
  const svgSize = 200;
  const center = svgSize / 2;
  const radius = 70;

  if (n === 1) return [{ x: center, y: center }];

  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });
}

function GraphSvg({ matrix, stateString }: { matrix: Matrix; stateString: string }) {
  const bits = stateString.split('').map(Number);
  const edges = getEdges(matrix);
  const coords = getNodeCoordinates(bits.length);

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-auto max-w-[150px] mx-auto overflow-visible"
      role="img"
      aria-label={`Graf state ${stateString}`}
    >
      {edges.map(({ u, v, weight }) => {
        const isCut = bits[u] !== bits[v];
        const midX = (coords[u].x + coords[v].x) / 2;
        const midY = (coords[u].y + coords[v].y) / 2;

        return (
          <g key={`${u}-${v}`}>
            <line
              x1={coords[u].x}
              y1={coords[u].y}
              x2={coords[v].x}
              y2={coords[v].y}
              className={isCut ? 'qaoa-sa-edge-cut' : 'qaoa-sa-edge-uncut'}
            />
            {weight !== 1 && (
              <text x={midX} y={midY} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="700">
                {formatNumber(weight)}
              </text>
            )}
          </g>
        );
      })}

      {coords.map((point, i) => (
        <g key={i} transform={`translate(${point.x}, ${point.y})`}>
          <circle cx="0" cy="0" r="16" className={bits[i] === 0 ? 'qaoa-sa-node-0' : 'qaoa-sa-node-1'} stroke="white" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fill="white" fontWeight="bold" fontSize="12">
            {i}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center -my-6 relative z-0" aria-hidden="true">
      <div className="w-1 h-16 bg-gray-300" />
      <div className="absolute bottom-0 w-4 h-4 border-b-4 border-r-4 border-gray-300 rotate-45 translate-y-1" />
    </div>
  );
}

const statusStyleMap: Record<StatusColor, { card: string; badge: string }> = {
  slate: {
    card: 'border-slate-200 bg-slate-50',
    badge: 'bg-slate-700 text-white',
  },
  emerald: {
    card: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-500 text-white',
  },
  yellow: {
    card: 'border-yellow-200 bg-yellow-50',
    badge: 'bg-yellow-500 text-white',
  },
  red: {
    card: 'border-red-200 bg-red-50',
    badge: 'bg-red-500 text-white',
  },
};

function CutDetails({ details }: { details: CutDetail[] }) {
  return (
    <div className="text-[11px] text-slate-500 bg-white border border-slate-200 p-2 rounded mt-2 leading-relaxed">
      {details.length === 0 ? (
        <span>Tidak ada edge.</span>
      ) : (
        details.map((item, index) => (
          <div key={`${item.u}-${item.v}`}>
            e({item.u},{item.v}): {item.isCut ? 'berbeda' : 'sama'} -&gt; {formatNumber(item.contribution)}
            {index < details.length - 1 ? ';' : ''}
          </div>
        ))
      )}
    </div>
  );
}

function ProbabilityLogic({ data }: { data: TraceStep }) {
  if (data.deltaCut >= 0) {
    return (
      <div className="p-2 bg-emerald-100/50 rounded border border-emerald-200 text-emerald-800 text-sm mt-3">
        Karena <span className="font-mono font-bold text-emerald-900">Delta C &gt;= 0</span>, solusi baru <strong>DITERIMA</strong> tanpa hitung probabilitas.
      </div>
    );
  }

  const acceptedByProbability = data.accepted;
  const boxClass = acceptedByProbability
    ? 'mt-2 p-2 bg-yellow-100 text-yellow-800 rounded font-semibold text-xs border border-yellow-200'
    : 'mt-2 p-2 bg-red-100 text-red-800 rounded font-semibold text-xs border border-red-200';

  return (
    <div className="p-3 bg-white rounded border border-slate-200 space-y-2 text-sm shadow-sm mt-3">
      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Peluang Acceptance</p>
      <div className="font-mono text-gray-700 flex flex-col gap-1 text-xs">
        <span>P_accept = e^(Delta C/T)</span>
        <span>
          P_accept = e^({formatNumber(data.deltaCut)} / {formatNumber(data.temperature, 4)}) = <span className="font-bold text-indigo-600">{formatNumber(data.probability, 4)}</span>
        </span>
        <span>
          Random r = <span className="font-bold text-indigo-600">{formatNumber(data.randomValue, 4)}</span>
        </span>
      </div>
      <div className={boxClass}>
        {acceptedByProbability ? (
          <>
            {formatNumber(data.randomValue, 4)} &lt; {formatNumber(data.probability, 4)} -&gt; TETAP DITERIMA! Mencegah jebakan lokal.
          </>
        ) : (
          <>
            {formatNumber(data.randomValue, 4)} &gt;= {formatNumber(data.probability, 4)} -&gt; DITOLAK. Kembali ke state lama.
          </>
        )}
      </div>
    </div>
  );
}

function StartCard({ data, matrix }: { data: TraceStep; matrix: Matrix }) {
  return (
    <>
      <article className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col md:flex-row items-center gap-6 z-10 w-full lg:w-3/4 mx-auto">
        <div className="bg-gray-800 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shrink-0 border-4 border-white shadow-md">
          Mulai
        </div>
        <div className="flex-1 w-full flex flex-col md:flex-row items-center gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex-1 text-center w-full">
            <p className="text-xs text-gray-500 uppercase font-bold mb-2">State Awal</p>
            <GraphSvg matrix={matrix} stateString={data.currentState} />
            <p className="font-mono font-bold text-2xl mt-3 tracking-widest">{data.currentState}</p>
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="bg-indigo-50 p-3 rounded text-sm border border-indigo-100">
              <span className="font-bold text-indigo-800 block text-xs uppercase mb-1">Rumus Substitusi Nilai Cut</span>
              <span className="font-mono text-gray-700">C({data.currentState}) = {data.cutDetails.expression}</span>
              <CutDetails details={data.cutDetails.details} />
            </div>
            <div className="bg-emerald-50 p-3 rounded border border-emerald-100 flex justify-between items-center">
              <span className="font-bold text-emerald-800 text-xs uppercase">Nilai Cut Awal</span>
              <span className="font-mono text-2xl font-bold text-emerald-600">C = {formatNumber(data.currentCut)}</span>
            </div>
          </div>
        </div>
      </article>
      <Arrow />
    </>
  );
}

function StepCard({ data, matrix, alpha, isLast }: { data: TraceStep; matrix: Matrix; alpha: number; isLast: boolean }) {
  const style = statusStyleMap[data.color] || statusStyleMap.slate;
  const stopCheckClass = data.stopAfter
    ? 'text-red-600 font-bold bg-red-100 p-1 rounded inline-block mt-1'
    : 'text-emerald-700 font-bold bg-emerald-100 p-1 rounded inline-block mt-1';
  const stopCheckResult = data.stopAfter ? 'YA (ALGORITMA BERHENTI)' : 'TIDAK (LANJUT KE STEP BERIKUTNYA)';

  return (
    <>
      <article className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-6 z-10 flex flex-col md:flex-row gap-6 w-full lg:w-11/12 mx-auto">
        <div className="flex md:flex-col items-center justify-start gap-3 md:gap-4 shrink-0">
          <div className="bg-indigo-600 text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-md z-10">
            {data.step}
          </div>
          <div className="bg-gray-100 border border-gray-200 px-3 py-1 rounded text-center w-full">
            <span className="block text-[10px] text-gray-500 font-bold uppercase">Suhu (T)</span>
            <span className="font-mono font-bold text-indigo-700 text-base">{formatNumber(data.temperature, 4)}</span>
          </div>
        </div>

        <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex flex-col items-center justify-center relative w-full min-h-64">
            <div className="absolute top-2 left-2 right-2 flex justify-between gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Try Next State</span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded text-right">
                {data.action} <span className="text-gray-400 font-normal ml-1">(acak dari seed)</span>
              </span>
            </div>
            <div className="mt-6 w-full">
              <GraphSvg matrix={matrix} stateString={data.candidateState} />
            </div>
            <p className="font-mono font-bold text-2xl mt-4 tracking-widest text-gray-800">{data.candidateState}</p>
          </section>

          <section className="flex flex-col justify-center space-y-3 w-full">
            <div className="border-l-4 border-indigo-500 pl-3">
              <p className="text-xs font-bold text-indigo-500 uppercase mb-1">C({data.candidateState})</p>
              <p className="font-mono text-xs text-gray-700 bg-gray-100 p-2 rounded">C(next) = {data.cutDetails.expression}</p>
              <CutDetails details={data.cutDetails.details} />
            </div>

            <div className="border-l-4 border-purple-500 pl-3 mt-2">
              <p className="text-xs font-bold text-purple-500 uppercase mb-1">Perubahan Nilai Cut (Delta C)</p>
              <p className="font-mono text-xs text-gray-700 bg-gray-100 p-2 rounded leading-relaxed">
                Delta C = C(next) - C(curr)
                <br />
                Delta C = <span className="font-bold text-indigo-600">{formatNumber(data.candidateCut)}</span> - <span className="font-bold text-gray-500">{formatNumber(data.currentCut)}</span> = <span className="font-bold text-lg text-purple-700">{formatNumber(data.deltaCut)}</span>
              </p>
            </div>

            <ProbabilityLogic data={data} />
          </section>

          <section className="flex flex-col justify-between w-full h-full gap-4">
            <div className={`border-2 ${style.card} rounded-lg p-4 flex flex-col justify-center items-center text-center flex-1 transition-all duration-300`}>
              <div className="mb-3">
                <span className={`${style.badge} px-3 py-1 rounded-full text-xs font-bold shadow-sm`}>{data.status}</span>
              </div>
              <p className="text-[11px] text-gray-500 uppercase font-bold mb-1">State Terkini Menjadi</p>
              <p className="font-mono font-black text-2xl md:text-3xl text-gray-800 tracking-widest mb-1">{data.resultState}</p>
              <p className="text-xs font-semibold text-gray-600 bg-white px-3 py-1 rounded-full border shadow-sm">
                Cut Value: <span className="font-mono text-base text-gray-800">{formatNumber(data.resultCut)}</span>
              </p>
            </div>

            <div className="border border-orange-200 bg-orange-50 rounded-lg p-3 w-full shadow-sm">
              <p className="text-[10px] font-bold text-orange-600 uppercase mb-1 text-center border-b border-orange-200 pb-1">
                Pendinginan (Cooling) &amp; Cek Berhenti
              </p>
              <p className="font-mono text-[11px] text-orange-900 leading-relaxed mt-2">
                T_baru = alpha x T_lama
                <br />
                T_baru = {formatNumber(alpha)} x {formatNumber(data.temperature, 4)} = <span className="font-bold bg-orange-200 px-1 rounded">{formatNumber(data.newTemperature, 5)}</span>
              </p>
              <div className="mt-2 text-[10px] font-mono text-gray-700">
                Cek: {formatNumber(data.newTemperature, 5)} &lt; T_min ({formatNumber(data.minTemperature)})?
                <br />-&gt; <span className={stopCheckClass}>{stopCheckResult}</span>
              </div>
            </div>
          </section>
        </div>
      </article>
      {!isLast && <Arrow />}
    </>
  );
}

function Summary({ result, matrix }: { result: SimulatedAnnealingResult; matrix: Matrix }) {
  const { best, finalState, finalCut, stopReason } = result;

  return (
    <section className="mt-16 bg-emerald-900 text-white p-6 md:p-8 rounded-2xl shadow-xl border-4 border-emerald-500 relative z-10 w-full lg:w-4/5 mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-2">Simulasi Selesai</h2>
        <p className="text-emerald-200 text-sm md:text-base border border-emerald-700 bg-emerald-800 inline-block px-4 py-2 rounded-lg mt-2 font-mono">
          Alasan Berhenti: {stopReason.text}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-emerald-700">
        <div className="text-center md:text-right md:pr-8 flex flex-col justify-center">
          <p className="text-xs text-emerald-400 uppercase font-bold mb-2">Best State Ditemukan (Memori Terbaik)</p>
          <GraphSvg matrix={matrix} stateString={best.state} />
          <p className="text-4xl mt-3 font-mono font-bold text-yellow-300 tracking-widest">{best.state}</p>
          <p className="text-sm font-semibold text-emerald-200 mt-2">
            Max-Cut Terbesar (C) = <span className="text-2xl">{formatNumber(best.cut)}</span>
          </p>
          <p className="text-xs text-emerald-300 mt-1">Pertama dicapai pada step {best.step}</p>
        </div>

        <div className="text-center md:text-left pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
          <p className="text-xs text-emerald-400 uppercase font-bold mb-2">Final Current State (Posisi Akhir)</p>
          <GraphSvg matrix={matrix} stateString={finalState} />
          <p className="text-4xl mt-3 font-mono font-bold text-emerald-50 tracking-widest">{finalState}</p>
          <p className="text-sm font-semibold text-emerald-200 mt-2">
            Cut Terakhir (C) = <span className="text-2xl">{formatNumber(finalCut)}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 bg-emerald-800/50 p-4 rounded-lg text-center text-sm text-emerald-100">
        Kedua state di atas tidak selalu sama. SA kadang berjalan menjauh dari nilai optimal untuk eksplorasi, namun <strong>Best State</strong> selalu dicatat ke memori setiap kali ia memecahkan rekor nilai Max-Cut tertinggi.
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="text-center text-gray-400 italic py-20">
      Klik "Jalankan Simulasi" untuk menghasilkan trace flow algoritma.
    </div>
  );
}

export function QAOASimulatedAnnealingFlow({ result: benchmarkResult }: QAOASimulatedAnnealingFlowProps) {
  const defaultTemplate = useMemo(() => createTemplateFromResult(benchmarkResult), [benchmarkResult]);
  const [jsonInput, setJsonInput] = useState(defaultTemplate);
  const [initialTemperature, setInitialTemperature] = useState('3.0');
  const [alpha, setAlpha] = useState('0.5');
  const [minTemperature, setMinTemperature] = useState('0.1');
  const [maxSteps, setMaxSteps] = useState('20');
  const [seed, setSeed] = useState('42');
  const [result, setResult] = useState<SimulatedAnnealingResult | null>(null);
  const [matrix, setMatrix] = useState<Matrix>(benchmarkResult.adjacency_matrix);
  const [description, setDescription] = useState(benchmarkResult.description || 'Penyelesaian Max-Cut dengan Graph Dinamis');
  const [error, setError] = useState('');

  useEffect(() => {
    queueMicrotask(() => {
      setJsonInput(defaultTemplate);
      setMatrix(benchmarkResult.adjacency_matrix);
      setDescription(benchmarkResult.description || 'Penyelesaian Max-Cut dengan Graph Dinamis');
      setResult(null);
      setError('');
    });
  }, [benchmarkResult.adjacency_matrix, benchmarkResult.description, defaultTemplate]);

  const matrixPreview = useMemo(() => {
    if (!matrix.length) return null;
    const edges = getEdges(matrix);
    return {
      nodes: matrix.length,
      edges: edges.length,
      label: edges.map(({ u, v, weight }) => `(${u},${v}${weight !== 1 ? `; w=${formatNumber(weight)}` : ''})`).join(', '),
    };
  }, [matrix]);

  function loadBenchmarkCase() {
    setJsonInput(defaultTemplate);
    setMatrix(benchmarkResult.adjacency_matrix);
    setDescription(benchmarkResult.description || 'Penyelesaian Max-Cut dengan Graph Dinamis');
    setResult(null);
    setError('');
  }

  function startSimulation() {
    try {
      const payload = JSON.parse(jsonInput) as JsonPayload;
      const nextMatrix = toMatrix(getMatrixFromPayload(payload));
      validateMatrix(nextMatrix);

      const config: SimulationConfig = {
        matrix: nextMatrix,
        initialTemperature: Number(initialTemperature),
        alpha: Number(alpha),
        minTemperature: Number(minTemperature),
        maxSteps: Number(maxSteps),
        seed: Number(seed),
      };

      if (!(config.initialTemperature > 0)) throw new Error('T Awal harus lebih besar dari 0.');
      if (!(config.alpha > 0 && config.alpha < 1)) throw new Error('Cooling rate alpha harus di antara 0 dan 1.');
      if (!(config.minTemperature > 0)) throw new Error('T Minimum harus lebih besar dari 0.');
      if (!(Number.isInteger(config.maxSteps) && config.maxSteps > 0)) throw new Error('Max Step Limit harus bilangan bulat positif.');
      if (!Number.isFinite(config.seed)) throw new Error('Seed harus berupa angka.');

      setMatrix(nextMatrix);
      setDescription(payload.description || 'Penyelesaian Max-Cut dengan Graph Dinamis');
      setResult(simulate(config));
      setError('');
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Format JSON tidak valid.');
    }
  }

  return (
    <section className="text-gray-800 antialiased bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
      <style>{`
        .qaoa-sa-edge-cut { stroke: #10b981; stroke-width: 5; stroke-dasharray: 6 6; transition: all 0.3s; stroke-linecap: round; }
        .qaoa-sa-edge-uncut { stroke: #cbd5e1; stroke-width: 2; transition: all 0.3s; stroke-linecap: round; }
        .qaoa-sa-node-0 { fill: #ef4444; }
        .qaoa-sa-node-1 { fill: #3b82f6; }
        .qaoa-sa-timeline-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; background: #cbd5e1; transform: translateX(-50%); z-index: 0; }
        @media (max-width: 1024px) { .qaoa-sa-timeline-line { display: none; } }
        @media print {
          .qaoa-sa-no-print { display: none !important; }
          .shadow-2xl, .shadow-xl, .shadow-lg, .shadow-md, .shadow-sm { box-shadow: none !important; }
        }
      `}</style>

      <header className="bg-indigo-900 text-white p-6 md:p-8 relative z-10">
        <div className="text-center mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-300 mb-3">Bagian Classic QAOA</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-2 uppercase tracking-wide">
            Simulator Utuh Simulated Annealing
          </h2>
          <p className="text-xl text-indigo-200 font-semibold mb-4">{description}</p>
          <p className="text-indigo-200 text-sm max-w-2xl mx-auto">
            Gunakan JSON dari dataset benchmark aktif atau paste JSON sendiri. Atur parameter, lalu klik <strong>Jalankan Simulasi</strong> untuk menghasilkan seluruh flow algoritma beserta alasan eksplisit mengapa simulasi berhenti.
          </p>
        </div>

        <section className="bg-white text-gray-800 p-6 rounded-xl shadow-lg border border-indigo-200 max-w-4xl mx-auto qaoa-sa-no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-end mb-2 gap-3">
                <label className="text-sm font-bold text-gray-600 uppercase">Input Adjacency Matrix (JSON)</label>
                <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                  <button type="button" onClick={loadBenchmarkCase} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition">
                    Dataset Aktif
                  </button>
                </div>
              </div>
              <textarea
                value={jsonInput}
                onChange={(event) => setJsonInput(event.target.value)}
                className="w-full h-40 p-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                spellCheck={false}
              />
              {matrixPreview && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <p>
                    Node: <span className="font-mono font-bold">{matrixPreview.nodes}</span> | Edge: <span className="font-mono font-bold">{matrixPreview.edges}</span>
                  </p>
                  <p className="mt-1 leading-relaxed">Edges: {matrixPreview.label || 'tidak ada edge'}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm font-bold text-gray-600 uppercase mb-3">Parameter Simulasi</p>
                <div className="grid grid-cols-2 gap-4">
                  <label>
                    <span className="block text-xs font-semibold text-gray-500 mb-1">T Awal</span>
                    <input type="number" value={initialTemperature} step="0.1" onChange={(event) => setInitialTemperature(event.target.value)} className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm" />
                  </label>
                  <label>
                    <span className="block text-xs font-semibold text-gray-500 mb-1">Cooling Rate (alpha)</span>
                    <input type="number" value={alpha} step="0.05" onChange={(event) => setAlpha(event.target.value)} className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm" />
                  </label>
                  <label>
                    <span className="block text-xs font-semibold text-gray-500 mb-1">T Minimum</span>
                    <input type="number" value={minTemperature} step="0.01" onChange={(event) => setMinTemperature(event.target.value)} className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm" />
                  </label>
                  <label>
                    <span className="block text-xs font-semibold text-gray-500 mb-1">Max Step Limit</span>
                    <input type="number" value={maxSteps} onChange={(event) => setMaxSteps(event.target.value)} className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm" />
                  </label>
                  <label className="col-span-2">
                    <span className="block text-xs font-semibold text-gray-500 mb-1">Seed Reproduksi</span>
                    <input type="number" value={seed} onChange={(event) => setSeed(event.target.value)} className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm" />
                  </label>
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button type="button" onClick={startSimulation} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-md transition active:scale-95 uppercase tracking-wider">
                Jalankan Simulasi
              </button>
            </div>
          </div>
        </section>
      </header>

      <section className="relative py-12 px-4 md:px-12 bg-slate-50 min-h-[400px]">
        {result && <div className="qaoa-sa-timeline-line hidden lg:block" aria-hidden="true" />}

        <div className="space-y-12 relative z-10">
          {!result && <EmptyState />}
          {result?.trace.map((item, index) =>
            index === 0 ? (
              <StartCard key={item.step} data={item} matrix={matrix} />
            ) : (
              <StepCard key={item.step} data={item} matrix={matrix} alpha={Number(alpha)} isLast={index === result.trace.length - 1} />
            ),
          )}
        </div>

        {result && <Summary result={result} matrix={matrix} />}
      </section>
    </section>
  );
}
