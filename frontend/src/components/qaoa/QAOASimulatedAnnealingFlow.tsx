import { useEffect, useMemo, useState } from 'react';
import type { QAOABenchmarkResult } from '../../types/qaoa';
import { formatNumber, createTemplateFromResult, getMatrixFromPayload, validateMatrix, toMatrix, getEdges } from './simulated-annealing/utils';
import { simulate } from './simulated-annealing/simulation';
import { GraphSvg, Arrow, statusStyleMap, CutDetails, ProbabilityLogic } from './simulated-annealing/subcomponents';
import type { Matrix, SimulationConfig, SimulatedAnnealingResult, TraceStep, JsonPayload } from './simulated-annealing/types';

interface QAOASimulatedAnnealingFlowProps {
  result: QAOABenchmarkResult;
}

function StartCard({ data, matrix }: { data: TraceStep; matrix: Matrix }) {
  const nodeCount = matrix.length;
  const edgeCount = getEdges(matrix).length;

  return (
    <>
      <article className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-5 flex flex-col gap-4 z-10 w-full h-full">
        <div className="bg-gray-800 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border-4 border-white shadow-md self-center md:self-start">
          Mulai
        </div>
        <div className="flex-1 w-full grid grid-cols-1 gap-3 items-stretch">
          <div className="bg-gradient-to-b from-gray-50 to-slate-100 p-3 rounded-lg border border-gray-100 w-full flex flex-col">
            <p className="text-xs text-gray-500 uppercase font-bold mb-2 text-center">State Awal</p>
            <div className="flex-1 flex flex-col justify-center">
              <GraphSvg matrix={matrix} stateString={data.currentState} />
              <p className="font-mono font-bold text-xl mt-2 tracking-widest text-center">{data.currentState}</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white border border-slate-200 rounded-md py-1">
                <p className="text-[10px] uppercase text-slate-400 font-bold">Node</p>
                <p className="font-mono text-sm font-bold text-slate-700">{nodeCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-md py-1">
                <p className="text-[10px] uppercase text-slate-400 font-bold">Edge</p>
                <p className="font-mono text-sm font-bold text-slate-700">{edgeCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-md py-1">
                <p className="text-[10px] uppercase text-slate-400 font-bold">Cut</p>
                <p className="font-mono text-sm font-bold text-emerald-700">{formatNumber(data.currentCut)}</p>
              </div>
            </div>
          </div>

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
      <article className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-5 z-10 flex flex-col gap-3 w-full h-full">
        <div className="flex items-center justify-start gap-2 shrink-0">
          <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md z-10">
            {data.step}
          </div>
          <div className="bg-gray-100 border border-gray-200 px-3 py-1 rounded text-center max-w-[140px]">
            <span className="block text-[10px] text-gray-500 font-bold uppercase">Suhu (T)</span>
            <span className="font-mono font-bold text-indigo-700 text-sm">{formatNumber(data.temperature, 4)}</span>
          </div>
        </div>

        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
          <section className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center justify-center relative w-full min-h-[190px]">
            <div className="absolute top-2 left-2 right-2 flex justify-between gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Try Next State</span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded text-right">
                {data.action} <span className="text-gray-400 font-normal ml-1">(acak dari seed)</span>
              </span>
            </div>
            <div className="mt-5 w-full">
              <GraphSvg matrix={matrix} stateString={data.candidateState} />
            </div>
            <p className="font-mono font-bold text-xl mt-3 tracking-widest text-gray-800">{data.candidateState}</p>
          </section>

          <section className="flex flex-col justify-center space-y-2 w-full">
            <div className="border-l-4 border-indigo-500 pl-3">
              <p className="text-xs font-bold text-indigo-500 uppercase mb-1">C({data.candidateState})</p>
              <p className="font-mono text-xs text-gray-700 bg-gray-100 p-2 rounded">C(next) = {data.cutDetails.expression}</p>
              <CutDetails details={data.cutDetails.details} />
            </div>

            <div className="border-l-4 border-purple-500 pl-3 mt-1">
              <p className="text-xs font-bold text-purple-500 uppercase mb-1">Perubahan Nilai Cut (Delta C)</p>
              <p className="font-mono text-xs text-gray-700 bg-gray-100 p-2 rounded leading-relaxed">
                Delta C = C(next) - C(curr)
                <br />
                Delta C = <span className="font-bold text-indigo-600">{formatNumber(data.candidateCut)}</span> - <span className="font-bold text-gray-500">{formatNumber(data.currentCut)}</span> = <span className="font-bold text-lg text-purple-700">{formatNumber(data.deltaCut)}</span>
              </p>
            </div>

            <ProbabilityLogic data={data} />
          </section>

          <section className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className={`border-2 ${style.card} rounded-lg p-4 flex flex-col justify-center items-center text-center flex-1 transition-all duration-300`}>
              <div className="mb-3">
                <span className={`${style.badge} px-3 py-1 rounded-full text-xs font-bold shadow-sm`}>{data.status}</span>
              </div>
              <p className="text-[11px] text-gray-500 uppercase font-bold mb-1">State Terkini Menjadi</p>
              <p className="font-mono font-black text-xl md:text-2xl text-gray-800 tracking-widest mb-1">{data.resultState}</p>
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
    <section className="mt-8 bg-emerald-900 text-white p-6 md:p-8 rounded-2xl shadow-xl border-4 border-emerald-500 relative z-10 w-full lg:w-[96%] mx-auto">
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

  const desktopFlow = useMemo(() => {
    if (!result) return null;

    const nodes = result.trace.map((item, index) => {
      if (index === 0) return { item, index, row: 0, col: 0 as 0 | 1 };
      if (index === 1) return { item, index, row: 0, col: 1 as 0 | 1 };

      const j = index - 2;
      const row = 1 + Math.floor(j / 2);
      const slot = j % 2;
      const leftToRight = row % 2 === 0;
      const col = (leftToRight ? slot : 1 - slot) as 0 | 1;
      return { item, index, row, col };
    });

    const maxRow = nodes.reduce((acc, node) => Math.max(acc, node.row), 0);
    const rows = Array.from({ length: maxRow + 1 }, (_, row) => {
      const left = nodes.find((node) => node.row === row && node.col === 0) || null;
      const right = nodes.find((node) => node.row === row && node.col === 1) || null;
      return { row, left, right };
    });

    const horizontal = new Map<number, 'lr' | 'rl'>();
    const vertical = new Map<number, 0 | 1>();
    for (let i = 0; i < nodes.length - 1; i += 1) {
      const a = nodes[i];
      const b = nodes[i + 1];
      if (a.row === b.row && a.col !== b.col) {
        horizontal.set(a.row, a.col < b.col ? 'lr' : 'rl');
      } else if (b.row === a.row + 1 && a.col === b.col) {
        vertical.set(a.row, a.col);
      }
    }

    const last = nodes[nodes.length - 1];
    return { rows, horizontal, vertical, lastCol: last.col };
  }, [result]);

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

      <section className="relative py-8 px-3 md:px-8 bg-slate-50 min-h-[320px]">
        {!result && <EmptyState />}

        {result && (
          <>
            <div className="space-y-5 relative z-10 lg:hidden">
              {result.trace.map((item, index) =>
                index === 0 ? (
                  <StartCard key={`mobile-start-${item.step}`} data={item} matrix={matrix} />
                ) : (
                  <StepCard key={`mobile-step-${item.step}`} data={item} matrix={matrix} alpha={Number(alpha)} isLast={index === result.trace.length - 1} />
                ),
              )}
            </div>

            <div className="hidden lg:block relative z-10">
              {desktopFlow?.rows.map((rowData) => (
                <div key={`desk-row-${rowData.row}`} className="relative mb-5 last:mb-0">
                  <div
                    className="grid gap-x-8 items-stretch"
                    style={{ gridTemplateColumns: 'repeat(2, minmax(360px, 1fr))', gridAutoRows: '1fr' }}
                  >
                    <div className="relative z-10 h-full">
                      {rowData.left ? (
                        rowData.left.index === 0 ? (
                          <StartCard data={rowData.left.item} matrix={matrix} />
                        ) : (
                          <StepCard data={rowData.left.item} matrix={matrix} alpha={Number(alpha)} isLast={false} />
                        )
                      ) : (
                        <div />
                      )}
                    </div>
                    <div className="relative z-10 h-full">
                      {rowData.right ? (
                        rowData.right.index === 0 ? (
                          <StartCard data={rowData.right.item} matrix={matrix} />
                        ) : (
                          <StepCard data={rowData.right.item} matrix={matrix} alpha={Number(alpha)} isLast={false} />
                        )
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>

                  {desktopFlow.horizontal.has(rowData.row) && (
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 pointer-events-none" aria-hidden="true">
                      <div className="absolute left-[24%] right-[24%] h-[2px] bg-slate-300 rounded-full" />
                      {desktopFlow.horizontal.get(rowData.row) === 'lr' ? (
                        <div className="absolute right-[24%] -translate-y-[4px] w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-slate-400" />
                      ) : (
                        <div className="absolute left-[24%] -translate-y-[4px] w-0 h-0 border-y-[5px] border-y-transparent border-r-[8px] border-r-slate-400" />
                      )}
                    </div>
                  )}

                  {desktopFlow.vertical.has(rowData.row) && (
                    <div className="h-0 relative pointer-events-none" aria-hidden="true">
                      <div className={`absolute top-full h-4 w-[2px] bg-slate-300 rounded-full ${desktopFlow.vertical.get(rowData.row) === 1 ? 'right-[24%]' : 'left-[24%]'}`} />
                      <div className={`absolute top-[calc(100%+1rem)] -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[8px] border-t-slate-400 ${desktopFlow.vertical.get(rowData.row) === 1 ? 'right-[24%]' : 'left-[24%]'}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="lg:hidden flex justify-center -my-1 relative z-10" aria-hidden="true">
              <div className="w-[2px] h-8 bg-slate-300 rounded-full" />
              <div className="absolute bottom-0 translate-y-[3px] w-0 h-0 border-x-[5px] border-x-transparent border-t-[8px] border-t-slate-400" />
            </div>

            <div className="hidden lg:block h-8 relative z-10" aria-hidden="true">
              <div className={`absolute top-0 h-4 w-[2px] bg-slate-300 rounded-full ${desktopFlow?.lastCol === 1 ? 'right-[24%]' : 'left-[24%]'}`} />
              <div className={`absolute top-4 h-[2px] bg-slate-300 rounded-full ${desktopFlow?.lastCol === 1 ? 'left-1/2 right-[24%]' : 'left-[24%] right-1/2'}`} />
              <div className="absolute left-1/2 top-4 h-4 w-[2px] bg-slate-300 rounded-full" />
              <div className="absolute left-1/2 top-[1.95rem] -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[8px] border-t-slate-400" />
            </div>
          </>
        )}

        {result && <Summary result={result} matrix={matrix} />}
      </section>
    </section>
  );
}