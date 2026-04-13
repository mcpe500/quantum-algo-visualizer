import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { vqeApi } from '../services/api';
import type { VQEBenchmarkResult, VQEBenchmarkParams, VQETrace, VQECircuitImage } from '../types/vqe';
import { ArrowLeft, Download, Play, Cpu, BookOpen, Atom } from 'lucide-react';

const sortCaseIds = (ids: string[]) =>
  [...ids].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

// ── SVG Convergence Chart ─────────────────────────────────────────────────────
function ConvergenceChart({
  data,
  targetValue,
  title,
  yLabel,
}: {
  data: number[];
  targetValue?: number;
  title: string;
  yLabel: string;
}) {
  if (!data || data.length === 0) return null;

  const vw = 500;
  const vh = 200;
  const pad = { left: 62, right: 20, top: 18, bottom: 36 };
  const cw = vw - pad.left - pad.right;
  const ch = vh - pad.top - pad.bottom;

  const allVals = targetValue !== undefined ? [...data, targetValue] : data;
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const span = maxV - minV || 1;

  const tx = (i: number) => pad.left + (i / Math.max(data.length - 1, 1)) * cw;
  const ty = (v: number) => pad.top + ch - ((v - minV) / span) * ch;

  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(' ');

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((t) => maxV - t * span);

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="bg-gray-50 rounded-lg overflow-auto">
        <svg viewBox={`0 0 ${vw} ${vh}`} className="w-full" style={{ minWidth: 280 }}>
          {/* Grid */}
          {gridVals.map((val, i) => (
            <g key={i}>
              <line
                x1={pad.left} y1={ty(val)}
                x2={vw - pad.right} y2={ty(val)}
                stroke="#e5e7eb" strokeWidth={0.6}
              />
              <text x={pad.left - 5} y={ty(val) + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {val.toFixed(3)}
              </text>
            </g>
          ))}

          {/* Target (FCI) line */}
          {targetValue !== undefined && (
            <line
              x1={pad.left} y1={ty(targetValue)}
              x2={vw - pad.right} y2={ty(targetValue)}
              stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5,3"
            />
          )}

          {/* Convergence path */}
          <path d={d} fill="none" stroke="#7c3aed" strokeWidth={2} />

          {/* Axes */}
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + ch} stroke="#d1d5db" />
          <line x1={pad.left} y1={pad.top + ch} x2={vw - pad.right} y2={pad.top + ch} stroke="#d1d5db" />

          {/* X label */}
          <text x={vw / 2} y={vh - 6} textAnchor="middle" fontSize={11} fill="#6b7280">Iteration</text>

          {/* Y label */}
          <text
            x={11}
            y={pad.top + ch / 2}
            textAnchor="middle"
            fontSize={10}
            fill="#6b7280"
            transform={`rotate(-90, 11, ${pad.top + ch / 2})`}
          >{yLabel}</text>

          {/* Legend */}
          {targetValue !== undefined && (
            <g>
              <line x1={vw - pad.right - 80} y1={pad.top + 10} x2={vw - pad.right - 60} y2={pad.top + 10} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5,3" />
              <text x={vw - pad.right - 56} y={pad.top + 14} fontSize={9} fill="#ef4444">FCI (exact)</text>
              <line x1={vw - pad.right - 80} y1={pad.top + 22} x2={vw - pad.right - 60} y2={pad.top + 22} stroke="#7c3aed" strokeWidth={2} />
              <text x={vw - pad.right - 56} y={pad.top + 26} fontSize={9} fill="#7c3aed">VQE energy</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

// ── Hamiltonian Panel ─────────────────────────────────────────────────────────
function HamiltonianPanel({ terms }: { terms: Record<string, number> }) {
  const entries = Object.entries(terms);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {entries.map(([pauli, coeff]) => (
        <div key={pauli} className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex justify-between items-center gap-2">
          <span className="font-mono text-purple-700 text-sm font-semibold">{pauli}</span>
          <span className={`font-mono text-sm ${coeff < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {coeff >= 0 ? '+' : ''}{coeff.toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Phase badge ───────────────────────────────────────────────────────────────
const PHASE_COLORS: Record<string, string> = {
  init: 'bg-blue-100 text-blue-800',
  rotation: 'bg-green-100 text-green-800',
  entanglement: 'bg-purple-100 text-purple-800',
  measure: 'bg-red-100 text-red-800',
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VQECombinedPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('VQE-01');
  const [availableCases, setAvailableCases] = useState<string[]>(['VQE-01']);
  const [benchmarkResult, setBenchmarkResult] = useState<VQEBenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<VQECircuitImage | null>(null);
  const [trace, setTrace] = useState<VQETrace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum'>('classic');

  // Load cases on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const cases = await vqeApi.getCases();
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
    return () => { cancelled = true; };
  }, []);

  // Load circuit image & trace whenever case changes
  const loadCircuitImage = useCallback(async (caseId: string) => {
    try {
      const data = await vqeApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch {
      setCircuitImage(null);
    }
  }, []);

  const loadTrace = useCallback(async (caseId: string) => {
    try {
      const data = await vqeApi.getTrace(caseId);
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
      const params: VQEBenchmarkParams = { case_id: selectedCaseId, shots: 1024 };
      const data = await vqeApi.runBenchmark(params);
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
    const el = document.getElementById('vqe-capture');
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: '#FAFAFA', scale: 2, useCORS: true });
    const a = document.createElement('a');
    a.download = `vqe_${selectedCaseId}.png`;
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
            <Atom className="w-5 h-5 text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-900">Variational Quantum Eigensolver</h1>
          </div>

          <select
            value={selectedCaseId}
            onChange={(e) => { setSelectedCaseId(e.target.value); setBenchmarkResult(null); }}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 transition-all cursor-pointer font-mono"
          >
            {availableCases.map((id) => (
              <option key={id} value={id}>{id}</option>
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
            Menjalankan VQE... proses optimisasi mungkin memerlukan beberapa detik.
          </div>
        )}

        {/* ── Results ── */}
        {benchmarkResult && (
          <div id="vqe-capture" className="space-y-6">
            {/* Tab Selector */}
            <div className="flex justify-center">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('classic')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass('classic')}`}
                >
                  <BookOpen className="w-4 h-4" />
                  Klasik (FCI)
                </button>
                <button
                  onClick={() => setActiveTab('quantum')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass('quantum')}`}
                >
                  <Cpu className="w-4 h-4" />
                  Kuantum (VQE)
                </button>
              </div>
            </div>

            {/* ── Classic Tab ── */}
            {activeTab === 'classic' && (
              <div className="space-y-6">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Full Configuration Interaction (FCI)
                  </h2>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Molecule</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.molecule}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Matrix Size</div>
                      <div className="text-lg font-mono font-semibold text-gray-900">{benchmarkResult.classical.matrix_size}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Complexity</div>
                      <div className="text-lg font-mono text-gray-900">{benchmarkResult.classical.time_complexity}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Execution Time</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.classical.execution_time_ms.toFixed(2)} ms</div>
                    </div>
                  </div>

                  {/* FCI Energy */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">FCI Ground State Energy (Reference)</div>
                    <div className="text-3xl font-mono font-bold text-blue-900">{benchmarkResult.classical.energy.toFixed(6)} Ha</div>
                  </div>

                  {/* Hamiltonian */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Hamiltonian Pauli Terms ({Object.keys(benchmarkResult.hamiltonian_terms).length} terms)
                    </h3>
                    <HamiltonianPanel terms={benchmarkResult.hamiltonian_terms} />
                  </div>

                  {/* Note */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> {benchmarkResult.classical.note}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Quantum Tab ── */}
            {activeTab === 'quantum' && (
              <div className="space-y-6">
                {/* VQE Metrics */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Variational Quantum Eigensolver (VQE)
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Qubits</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.n_qubits}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Iterations</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.quantum.iterations}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Circuit Depth</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.quantum.circuit_depth}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Gate Count</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.quantum.gate_count}</div>
                    </div>
                  </div>

                  {/* Ansatz info */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-mono rounded-full">
                      ansatz: {benchmarkResult.ansatz_type}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-mono rounded-full">
                      layers: {benchmarkResult.n_layers}
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-mono rounded-full">
                      params: {benchmarkResult.quantum.optimal_parameters.length}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded-full">
                      {benchmarkResult.quantum.time_complexity}
                    </span>
                  </div>

                  {/* Energy result */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">VQE Energy</div>
                      <div className="text-2xl font-mono font-bold text-purple-900">{benchmarkResult.quantum.energy.toFixed(6)} Ha</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-xs text-red-600 uppercase tracking-wide mb-1">Energy Error |VQE − FCI|</div>
                      <div className="text-2xl font-mono font-bold text-red-800">{benchmarkResult.quantum.energy_error.toFixed(6)} Ha</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-xs text-green-600 uppercase tracking-wide mb-1">Accuracy</div>
                      <div className="text-2xl font-mono font-bold text-green-800">{benchmarkResult.quantum.accuracy.toFixed(2)}%</div>
                    </div>
                  </div>

                  {/* Convergence Chart */}
                  {benchmarkResult.quantum.convergence_history.length > 0 && (
                    <div className="mb-6">
                      <ConvergenceChart
                        data={benchmarkResult.quantum.convergence_history}
                        targetValue={benchmarkResult.classical.energy}
                        title="VQE Convergence (Energy vs Iteration)"
                        yLabel="Energy (Ha)"
                      />
                    </div>
                  )}

                  {/* Optimal Parameters */}
                  {benchmarkResult.quantum.optimal_parameters.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Optimized Parameters (θ₀ … θ{benchmarkResult.quantum.optimal_parameters.length - 1})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {benchmarkResult.quantum.optimal_parameters.map((p, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 border border-gray-200 text-xs font-mono rounded">
                            θ{i}: {p.toFixed(4)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Circuit Image */}
                  {circuitImage && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Ansatz Circuit</h3>
                      <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                        <img
                          src={`data:image/png;base64,${circuitImage.image}`}
                          alt="VQE Ansatz Circuit"
                          className="max-w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Trace Table */}
                {trace && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Ansatz Circuit Trace</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Step</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Operation</th>
                            {Array.from({ length: trace.n_qubits }, (_, i) => (
                              <th key={i} className="text-center py-2 px-2 font-medium text-gray-700">q{i}</th>
                            ))}
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Phase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trace.stages.map((stage) => (
                            <tr key={stage.step} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3 font-mono text-gray-900">{stage.step}</td>
                              <td className="py-2 px-3 text-gray-700 text-xs">{stage.operation}</td>
                              {Array.from({ length: trace.n_qubits }, (_, i) => (
                                <td key={i} className="text-center py-2 px-2 font-mono text-sm">
                                  <span className={
                                    stage.wire_markers[i] === '●' ? 'text-purple-700 font-bold' :
                                    stage.wire_markers[i] === '⊕' ? 'text-orange-600 font-bold' :
                                    stage.wire_markers[i] === 'M' ? 'text-red-600 font-bold' :
                                    stage.wire_markers[i] === 'Ry' ? 'text-green-700 font-bold' :
                                    'text-gray-500'
                                  }>
                                    {stage.wire_markers[i] || '-'}
                                  </span>
                                </td>
                              ))}
                              <td className="py-2 px-3">
                                <span className={`inline-flex px-2 py-0.5 text-xs rounded ${PHASE_COLORS[stage.phase] ?? 'bg-gray-100 text-gray-700'}`}>
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparison: FCI vs VQE</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">FCI (Classical Exact)</div>
                      <div className="text-xl font-mono text-gray-900">{benchmarkResult.comparison.fci_energy.toFixed(6)} Ha</div>
                      <div className="text-sm text-gray-600 mt-1">{benchmarkResult.classical.time_complexity}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">VQE (Quantum Variational)</div>
                      <div className="text-xl font-mono text-gray-900">{benchmarkResult.comparison.vqe_energy.toFixed(6)} Ha</div>
                      <div className="text-sm text-gray-600 mt-1">{benchmarkResult.quantum.time_complexity}</div>
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
            <p className="text-gray-500">Pilih kasus dan klik "Jalankan" untuk memulai benchmarking VQE.</p>
          </div>
        )}
      </div>
    </div>
  );
}
