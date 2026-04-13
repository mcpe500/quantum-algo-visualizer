import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { qaoaApi } from '../services/api';
import type { QAOABenchmarkResult, QAOABenchmarkParams, QAOATrace, QAOACircuitImage } from '../types/qaoa';
import { ArrowLeft, Download, Play, Cpu, BookOpen, GitBranch } from 'lucide-react';

const sortCaseIds = (ids: string[]) =>
  [...ids].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

// ── Graph Visualization (SVG) ─────────────────────────────────────────────────
function GraphVisualization({
  nodes,
  edges,
  partition,
  title,
}: {
  nodes: number[];
  edges: [number, number][];
  partition?: number[];
  title?: string;
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = nodes.length <= 3 ? 70 : nodes.length <= 4 ? 65 : 55;
  const nodeR = 18;

  const pos = nodes.map((_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
  }));

  const isCut = (i: number, j: number) =>
    partition ? partition[i] !== partition[j] : false;

  const nodeColor = (i: number) => {
    if (!partition) return '#3b82f6';
    return partition[i] === 0 ? '#3b82f6' : '#f59e0b';
  };

  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>}
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-48 h-48">
          {/* Edges */}
          {edges.map(([i, j], idx) => (
            <line
              key={idx}
              x1={pos[i].x}
              y1={pos[i].y}
              x2={pos[j].x}
              y2={pos[j].y}
              stroke={isCut(i, j) ? '#ef4444' : '#94a3b8'}
              strokeWidth={isCut(i, j) ? 2.5 : 1.5}
              strokeDasharray={isCut(i, j) ? '6,3' : undefined}
            />
          ))}
          {/* Nodes */}
          {nodes.map((node, i) => (
            <g key={i}>
              <circle
                cx={pos[i].x}
                cy={pos[i].y}
                r={nodeR}
                fill={nodeColor(i)}
                stroke="white"
                strokeWidth={2}
              />
              <text
                x={pos[i].x}
                y={pos[i].y + 5}
                textAnchor="middle"
                fill="white"
                fontSize={13}
                fontWeight="bold"
              >
                {node}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {partition && (
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            Partition 0
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            Partition 1
          </span>
        </div>
      )}
    </div>
  );
}

// ── Cut History Chart (SA) ────────────────────────────────────────────────────
function CutHistoryChart({
  data,
  optimalCut,
  title,
}: {
  data: number[];
  optimalCut: number;
  title: string;
}) {
  if (!data || data.length === 0) return null;

  const vw = 460;
  const vh = 170;
  const pad = { left: 40, right: 20, top: 15, bottom: 32 };
  const cw = vw - pad.left - pad.right;
  const ch = vh - pad.top - pad.bottom;

  const minV = 0;
  const maxV = Math.max(optimalCut + 0.5, Math.max(...data) + 0.5);

  const tx = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * cw;
  const ty = (v: number) => pad.top + ch - ((v - minV) / (maxV - minV)) * ch;

  const d = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${tx(i).toFixed(1)},${ty(v).toFixed(1)}`)
    .join(' ');

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="bg-gray-50 rounded-lg overflow-auto">
        <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full" style={{ minWidth: 260 }}>
          {/* Optimal line */}
          <line
            x1={pad.left}
            y1={ty(optimalCut)}
            x2={vw - pad.right}
            y2={ty(optimalCut)}
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="5,3"
          />
          <text x={vw - pad.right + 2} y={ty(optimalCut) + 4} fontSize={9} fill="#10b981">
            opt
          </text>

          {/* SA path */}
          <path d={d} fill="none" stroke="#3b82f6" strokeWidth={1.5} />

          {/* Axes */}
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ch} stroke="#d1d5db" />
          <line
            x1={pad.left}
            y1={pad.top + ch}
            x2={vw - pad.right}
            y2={pad.top + ch}
            stroke="#d1d5db"
          />

          {/* Y ticks */}
          {[0, optimalCut].map((v) => (
            <text key={v} x={pad.left - 4} y={ty(v) + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
              {v}
            </text>
          ))}

          {/* X label */}
          <text
            x={vw / 2}
            y={vh - 5}
            textAnchor="middle"
            fontSize={10}
            fill="#6b7280"
          >
            Iteration
          </text>
        </svg>
      </div>
    </div>
  );
}

// ── Expected-Cut Convergence Chart (QAOA optimizer) ───────────────────────────
function ConvergenceChart({
  data,
  optimalCut,
  title,
}: {
  data: number[];
  optimalCut: number;
  title: string;
}) {
  if (!data || data.length === 0) return null;

  const vw = 500;
  const vh = 200;
  const pad = { left: 54, right: 20, top: 18, bottom: 36 };
  const cw = vw - pad.left - pad.right;
  const ch = vh - pad.top - pad.bottom;

  const minV = Math.min(0, Math.min(...data) - 0.2);
  const maxV = Math.max(optimalCut + 0.5, Math.max(...data) + 0.3);
  const span = maxV - minV || 1;

  const tx = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * cw;
  const ty = (v: number) => pad.top + ch - ((v - minV) / span) * ch;

  const d = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${tx(i).toFixed(1)},${ty(v).toFixed(1)}`)
    .join(' ');

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((t) => minV + t * span);

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="bg-gray-50 rounded-lg overflow-auto">
        <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full" style={{ minWidth: 280 }}>
          {/* Grid */}
          {gridVals.map((val, i) => (
            <g key={i}>
              <line
                x1={pad.left}
                y1={ty(val)}
                x2={vw - pad.right}
                y2={ty(val)}
                stroke="#e5e7eb"
                strokeWidth={0.6}
              />
              <text x={pad.left - 5} y={ty(val) + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {val.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Optimal cut line */}
          <line
            x1={pad.left}
            y1={ty(optimalCut)}
            x2={vw - pad.right}
            y2={ty(optimalCut)}
            stroke="#10b981"
            strokeWidth={1.5}
            strokeDasharray="5,3"
          />

          {/* QAOA convergence path */}
          <path d={d} fill="none" stroke="#7c3aed" strokeWidth={2} />

          {/* Axes */}
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ch} stroke="#d1d5db" />
          <line
            x1={pad.left}
            y1={pad.top + ch}
            x2={vw - pad.right}
            y2={pad.top + ch}
            stroke="#d1d5db"
          />

          {/* X label */}
          <text x={vw / 2} y={vh - 6} textAnchor="middle" fontSize={11} fill="#6b7280">
            Iteration
          </text>

          {/* Y label */}
          <text
            x={12}
            y={pad.top + ch / 2}
            textAnchor="middle"
            fontSize={10}
            fill="#6b7280"
            transform={`rotate(-90, 12, ${pad.top + ch / 2})`}
          >
            Expected Cut
          </text>

          {/* Legend */}
          <g>
            <line
              x1={vw - pad.right - 100}
              y1={pad.top + 10}
              x2={vw - pad.right - 80}
              y2={pad.top + 10}
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="5,3"
            />
            <text x={vw - pad.right - 76} y={pad.top + 14} fontSize={9} fill="#10b981">
              Optimal
            </text>
            <line
              x1={vw - pad.right - 100}
              y1={pad.top + 22}
              x2={vw - pad.right - 80}
              y2={pad.top + 22}
              stroke="#7c3aed"
              strokeWidth={2}
            />
            <text x={vw - pad.right - 76} y={pad.top + 26} fontSize={9} fill="#7c3aed">
              QAOA
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

// ── Cut Distribution Chart (horizontal bars) ──────────────────────────────────
function CutDistributionChart({
  data,
  title,
}: {
  data: Array<{ bitstring: string; probability: number; cut: number }>;
  title: string;
}) {
  if (!data || data.length === 0) return null;
  const maxProb = Math.max(...data.map((d) => d.probability), 0.01);

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="space-y-1.5">
        {data.slice(0, 8).map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="font-mono text-gray-600 w-20 shrink-0">{item.bitstring}</span>
            <div className="flex-1 bg-gray-100 rounded-sm h-5 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-purple-400 rounded-sm"
                style={{ width: `${(item.probability / maxProb) * 100}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-end pr-1.5 font-mono text-gray-700">
                {(item.probability * 100).toFixed(1)}%
              </span>
            </div>
            <span className="text-gray-600 w-14 shrink-0 font-mono">cut: {item.cut}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Phase Badge ───────────────────────────────────────────────────────────────
const PHASE_COLORS: Record<string, string> = {
  init: 'bg-blue-100 text-blue-800',
  superposition: 'bg-cyan-100 text-cyan-800',
  cost: 'bg-orange-100 text-orange-800',
  mixer: 'bg-purple-100 text-purple-800',
  measure: 'bg-red-100 text-red-800',
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function QAOACombinedPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('QAOA-01');
  const [availableCases, setAvailableCases] = useState<string[]>(['QAOA-01']);
  const [benchmarkResult, setBenchmarkResult] = useState<QAOABenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<QAOACircuitImage | null>(null);
  const [trace, setTrace] = useState<QAOATrace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum'>('classic');

  // Load cases on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cases = await qaoaApi.getCases();
        if (cancelled) return;
        const ids = sortCaseIds(
          cases.map((c) => c.case_id).filter((id): id is string => Boolean(id))
        );
        if (ids.length > 0) {
          setAvailableCases(ids);
          setSelectedCaseId((cur) => (ids.includes(cur) ? cur : ids[0]));
        }
      } catch {
        // keep default
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCircuitImage = useCallback(async (caseId: string) => {
    try {
      const data = await qaoaApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch {
      setCircuitImage(null);
    }
  }, []);

  const loadTrace = useCallback(async (caseId: string) => {
    try {
      const data = await qaoaApi.getTrace(caseId);
      setTrace(data);
    } catch {
      setTrace(null);
    }
  }, []);

  useEffect(() => {
    void loadCircuitImage(selectedCaseId);
    void loadTrace(selectedCaseId);
  }, [selectedCaseId, loadCircuitImage, loadTrace]);

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: QAOABenchmarkParams = { case_id: selectedCaseId, shots: 1024 };
      const data = await qaoaApi.runBenchmark(params);
      setBenchmarkResult(data);
      await loadCircuitImage(selectedCaseId);
      await loadTrace(selectedCaseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, loadCircuitImage, loadTrace]);

  const handleDownload = useCallback(async () => {
    const html2canvas = (await import('html2canvas')).default;
    const el = document.getElementById('qaoa-capture');
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: '#FAFAFA', scale: 2, useCORS: true });
    const a = document.createElement('a');
    a.download = `qaoa_${selectedCaseId}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }, [selectedCaseId]);

  const tabClass = (tab: 'classic' | 'quantum') =>
    activeTab === tab
      ? 'bg-white text-gray-900 shadow-sm'
      : 'text-gray-600 hover:text-gray-900';

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Algorithms
      </Link>

      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-900">
              Quantum Approximate Optimization Algorithm
            </h1>
          </div>

          <select
            value={selectedCaseId}
            onChange={(e) => {
              setSelectedCaseId(e.target.value);
              setBenchmarkResult(null);
            }}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 transition-all cursor-pointer font-mono"
          >
            {availableCases.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Memproses...' : 'Jalankan'}
          </button>

          {benchmarkResult && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 px-4 py-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="mb-6 px-4 py-3 bg-purple-50 border border-purple-200 text-purple-700 text-sm rounded-lg flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            Menjalankan QAOA... SA dan optimisasi parameter mungkin memerlukan beberapa detik.
          </div>
        )}

        {/* ── Results ── */}
        {benchmarkResult && (
          <div id="qaoa-capture" className="space-y-6">
            {/* Tab Selector */}
            <div className="flex justify-center">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('classic')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass('classic')}`}
                >
                  <BookOpen className="w-4 h-4" />
                  Klasik (SA)
                </button>
                <button
                  onClick={() => setActiveTab('quantum')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass('quantum')}`}
                >
                  <Cpu className="w-4 h-4" />
                  Kuantum (QAOA)
                </button>
              </div>
            </div>

            {/* ── Classic Tab ── */}
            {activeTab === 'classic' && (
              <div className="space-y-6">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Simulated Annealing & Exact Max-Cut
                  </h2>

                  {/* Problem Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Nodes</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">
                        {benchmarkResult.n_nodes}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Edges</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">
                        {benchmarkResult.n_edges}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Exact Max-Cut</div>
                      <div className="text-2xl font-mono font-semibold text-green-700">
                        {benchmarkResult.exact.optimal_cut}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">SA Best Cut</div>
                      <div className="text-2xl font-mono font-semibold text-blue-700">
                        {benchmarkResult.classical.best_cut}
                      </div>
                    </div>
                  </div>

                  {/* Graph + Exact partition */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                        Graph: K{benchmarkResult.n_nodes}
                      </p>
                      <GraphVisualization
                        nodes={benchmarkResult.nodes}
                        edges={benchmarkResult.edges}
                      />
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Edges: {benchmarkResult.edges.map(([i, j]) => `(${i},${j})`).join(', ')}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                        Optimal Partition (cut = {benchmarkResult.exact.optimal_cut})
                      </p>
                      <GraphVisualization
                        nodes={benchmarkResult.nodes}
                        edges={benchmarkResult.edges}
                        partition={benchmarkResult.exact.optimal_partition}
                      />
                      <p className="text-xs text-gray-500 text-center mt-2">
                        {benchmarkResult.exact.time_complexity} — Brute Force
                      </p>
                    </div>
                  </div>

                  {/* SA Results */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">SA Best Cut</div>
                      <div className="text-2xl font-mono font-bold text-blue-900">
                        {benchmarkResult.classical.best_cut}
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        Approximation Ratio
                      </div>
                      <div className="text-2xl font-mono font-bold text-gray-900">
                        {benchmarkResult.classical.approx_ratio.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        SA Execution Time
                      </div>
                      <div className="text-2xl font-mono font-bold text-gray-900">
                        {benchmarkResult.classical.execution_time_ms.toFixed(2)} ms
                      </div>
                    </div>
                  </div>

                  {/* SA cut history chart */}
                  {benchmarkResult.classical.cut_history.length > 0 && (
                    <CutHistoryChart
                      data={benchmarkResult.classical.cut_history}
                      optimalCut={benchmarkResult.exact.optimal_cut}
                      title="Simulated Annealing — Cut Value vs Iteration"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ── Quantum Tab ── */}
            {activeTab === 'quantum' && (
              <div className="space-y-6">
                {/* QAOA Metrics */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Quantum Approximate Optimization Algorithm (QAOA)
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Qubits</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">
                        {benchmarkResult.quantum.n_qubits}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">p Layers</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">
                        {benchmarkResult.quantum.p_layers}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Circuit Depth</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">
                        {benchmarkResult.quantum.circuit_depth}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Gate Count</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">
                        {benchmarkResult.quantum.gate_count}
                      </div>
                    </div>
                  </div>

                  {/* QAOA Result cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">QAOA Best Cut</div>
                      <div className="text-3xl font-mono font-bold text-purple-900">
                        {benchmarkResult.quantum.best_cut}
                      </div>
                      <div className="text-xs text-purple-700 mt-1">
                        bitstring: {benchmarkResult.quantum.best_bitstring}
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expected Cut</div>
                      <div className="text-3xl font-mono font-bold text-gray-900">
                        {benchmarkResult.quantum.expected_cut.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-xs text-green-600 uppercase tracking-wide mb-1">
                        Approx. Ratio
                      </div>
                      <div className="text-3xl font-mono font-bold text-green-800">
                        {benchmarkResult.quantum.approx_ratio.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  {/* Optimal parameters */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    {benchmarkResult.quantum.optimal_gamma.map((g, i) => (
                      <span key={`g${i}`} className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-mono rounded-full">
                        γ{i + 1}: {g.toFixed(4)}
                      </span>
                    ))}
                    {benchmarkResult.quantum.optimal_beta.map((b, i) => (
                      <span key={`b${i}`} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded-full">
                        β{i + 1}: {b.toFixed(4)}
                      </span>
                    ))}
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded-full">
                      {benchmarkResult.quantum.iterations} iterations
                    </span>
                  </div>

                  {/* Convergence chart */}
                  {benchmarkResult.quantum.expected_cut_history.length > 0 && (
                    <div className="mb-6">
                      <ConvergenceChart
                        data={benchmarkResult.quantum.expected_cut_history}
                        optimalCut={benchmarkResult.exact.optimal_cut}
                        title="QAOA Optimizer — Expected Cut vs Iteration"
                      />
                    </div>
                  )}

                  {/* Cut distribution */}
                  {benchmarkResult.quantum.cut_distribution.length > 0 && (
                    <div className="mb-6">
                      <CutDistributionChart
                        data={benchmarkResult.quantum.cut_distribution}
                        title="Measurement Probability Distribution (top bitstrings)"
                      />
                    </div>
                  )}

                  {/* Circuit image */}
                  {circuitImage && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">QAOA Circuit</h3>
                      <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                        <img
                          src={`data:image/png;base64,${circuitImage.image}`}
                          alt="QAOA Circuit"
                          className="max-w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Trace Table */}
                {trace && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">QAOA Circuit Trace</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Step</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Operation</th>
                            {Array.from({ length: trace.n_nodes }, (_, i) => (
                              <th key={i} className="text-center py-2 px-2 font-medium text-gray-700">
                                q{i}
                              </th>
                            ))}
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Phase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trace.stages.map((stage) => (
                            <tr
                              key={stage.step}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="py-2 px-3 font-mono text-gray-900">{stage.step}</td>
                              <td className="py-2 px-3 text-gray-700 text-xs">{stage.operation}</td>
                              {Array.from({ length: trace.n_nodes }, (_, i) => (
                                <td key={i} className="text-center py-2 px-2 font-mono text-sm">
                                  <span
                                    className={
                                      stage.wire_markers[i] === '●'
                                        ? 'text-purple-700 font-bold'
                                        : stage.wire_markers[i] === '⊕'
                                          ? 'text-orange-600 font-bold'
                                          : stage.wire_markers[i] === 'M'
                                            ? 'text-red-600 font-bold'
                                            : stage.wire_markers[i] === 'H'
                                              ? 'text-blue-700 font-bold'
                                              : stage.wire_markers[i] === 'Rz'
                                                ? 'text-orange-700 font-semibold'
                                                : stage.wire_markers[i] === 'Rx'
                                                  ? 'text-green-700 font-semibold'
                                                  : 'text-gray-500'
                                    }
                                  >
                                    {stage.wire_markers[i] || '-'}
                                  </span>
                                </td>
                              ))}
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-flex px-2 py-0.5 text-xs rounded ${PHASE_COLORS[stage.phase] ?? 'bg-gray-100 text-gray-700'}`}
                                >
                                  {stage.phase}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Comparison */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Comparison: Exact vs SA vs QAOA
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-xs text-green-600 uppercase tracking-wide mb-1">
                        Exact (Brute Force)
                      </div>
                      <div className="text-2xl font-mono font-bold text-green-900">
                        Cut = {benchmarkResult.comparison.exact_cut}
                      </div>
                      <div className="text-sm text-green-700 mt-1">ratio: 1.000</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">
                        SA (Simulated Annealing)
                      </div>
                      <div className="text-2xl font-mono font-bold text-blue-900">
                        Cut = {benchmarkResult.comparison.sa_cut}
                      </div>
                      <div className="text-sm text-blue-700 mt-1">
                        ratio: {benchmarkResult.comparison.sa_approx_ratio.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">
                        QAOA (Quantum)
                      </div>
                      <div className="text-2xl font-mono font-bold text-purple-900">
                        Cut = {benchmarkResult.comparison.qaoa_cut}
                      </div>
                      <div className="text-sm text-purple-700 mt-1">
                        ratio: {benchmarkResult.comparison.qaoa_approx_ratio.toFixed(3)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> {benchmarkResult.comparison.note}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!benchmarkResult && !isLoading && (
          <div className="text-center py-20">
            <p className="text-gray-500">
              Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QAOA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
