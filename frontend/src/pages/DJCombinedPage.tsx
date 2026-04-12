import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { djApi } from '../services/api';
import type { DJCircuitImage } from '../services/api';
import { ClassicalVisualization } from '../components/dj/ClassicalVisualization';
import type { DJBenchmarkResult, DJBenchmarkParams } from '../types/dj';
import type { ClassicalResult } from '../types/classical';
import { ArrowLeft, Download, Play, Gauge } from 'lucide-react';

const caseOptions = ['DJ-01', 'DJ-02', 'DJ-03', 'DJ-04'];

function QuantumVisualization({ 
  quantum, 
  circuitImage,
  shots,
  case_id,
  n_qubits,
  classification
}: { 
  quantum: DJBenchmarkResult['quantum'];
  circuitImage: DJCircuitImage | null;
  shots: number;
  case_id: string;
  n_qubits: number;
  classification: string;
}) {
  
  return (
    <div className="bg-white border border-purple-200 rounded-xl overflow-hidden">
      <header className="text-center pt-4 pb-2 px-4">
        <p className="text-[10px] tracking-[0.2em] text-purple-600 font-bold uppercase">Solusi Kuantum - Deutsch-Jozsa</p>
        <h1 className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1">
          {case_id}: {classification}
        </h1>
        <p className="text-gray-500 mt-1 max-w-lg mx-auto text-[13px] leading-snug">
          Untuk n={n_qubits}, komputer kuantum hanya butuh 1 query untuk menyelesaikan masalah ini.
        </p>
      </header>

      <main className="mt-6 px-4 pb-4 flex flex-col items-center">
        {circuitImage ? (
          <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-700 overflow-x-auto">
            <img 
              src={`data:image/png;base64,${circuitImage.image}`} 
              alt={`Quantum Circuit for ${case_id}`}
              className="max-w-full h-auto"
            />
          </div>
        ) : (
          <div className="bg-slate-950/80 rounded-xl p-12 border border-slate-800 text-center">
            <span className="text-slate-500 font-mono text-sm">
              Circuit akan ditampilkan di sini
            </span>
          </div>
        )}

        <div className="mt-6 w-full max-w-2xl">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-[10px] font-bold tracking-widest text-purple-800 mb-3">METRICS</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Circuit Depth</p>
                  <p className="text-lg font-semibold text-gray-900">{quantum.circuit_depth}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-purple-500 flex items-center justify-center text-[8px] text-white font-bold">#</div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Gate Count</p>
                  <p className="text-lg font-semibold text-gray-900">{quantum.gate_count}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cyan-500 flex items-center justify-center text-[8px] text-white font-bold">Q</div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Qubits</p>
                  <p className="text-lg font-semibold text-gray-900">{quantum.num_qubits}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center text-[8px] text-white font-bold">t</div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Exec Time</p>
                  <p className="text-lg font-semibold text-gray-900">{quantum.execution_time_ms.toFixed(2)}ms</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-white border border-purple-200 rounded-xl p-4">
            <p className="text-[10px] font-bold tracking-widest text-purple-800 mb-3">MEASUREMENT ({shots} shots)</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(quantum.counts).map(([state, count]) => (
                <span key={state} className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-mono">
                  |{state}⟩: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-4 text-center pb-4 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-full border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <p className="text-[11px] font-medium text-purple-700">
            Kuantum: 1 query dengan superposisi dan interferensi → {classification}
          </p>
        </div>
      </footer>
    </div>
  );
}

function ComparisonSection({ result }: { result: DJBenchmarkResult }) {
  const { comparison, accuracy } = result;
  
  return (
    <div className="bg-gray-50 border border-gray-300 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Perbandingan</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Quantum Calls</p>
          <p className="text-xl font-bold text-purple-600">{comparison.quantum_calls}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Classical Calls</p>
          <p className="text-xl font-bold text-blue-600">{comparison.classic_calls}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Speedup</p>
          <p className="text-xl font-bold text-green-600">{comparison.speedup_factor}x</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Accuracy</p>
          <p className="text-xl font-bold text-gray-900">
            {accuracy.quantum_correct && accuracy.classic_correct ? '✓ Benar' : '✗ Salah'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DJCombinedPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('DJ-01');
  const [classicalResult, setClassicalResult] = useState<ClassicalResult | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<DJBenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<DJCircuitImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClassicalResult = useCallback(async (caseId: string) => {
    try {
      const data = await djApi.runClassicalDJ(caseId);
      setClassicalResult(data);
    } catch (err) {
      console.error('Failed to load classical result:', err);
    }
  }, []);

  const loadCircuitImage = useCallback(async (caseId: string) => {
    try {
      const data = await djApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch (err) {
      console.error('Failed to load circuit image:', err);
      setCircuitImage(null);
    }
  }, []);

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: DJBenchmarkParams = { case_id: selectedCaseId, shots: 1024 };
      const data = await djApi.runBenchmark(params);
      setBenchmarkResult(data);
      
      await loadClassicalResult(selectedCaseId);
      await loadCircuitImage(selectedCaseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, loadClassicalResult, loadCircuitImage]);

  const handleDownload = useCallback(async () => {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById('capture-area');
    if (!element) return;

    const canvas = await html2canvas(element, {
      backgroundColor: '#FAFAFA',
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `dj_combined_${selectedCaseId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [selectedCaseId]);

  useEffect(() => {
    loadClassicalResult(selectedCaseId);
    loadCircuitImage(selectedCaseId);
  }, [selectedCaseId, loadClassicalResult, loadCircuitImage]);

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
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 transition-all cursor-pointer font-mono"
          >
            {caseOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <button
            onClick={handleRun}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Memproses...' : 'Jalankan'}
          </button>

          {(classicalResult || benchmarkResult) && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 px-4 py-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {(classicalResult || benchmarkResult) && (
          <div id="capture-area" className="space-y-6">
            {classicalResult && (
              <>
                <ClassicalVisualization 
                  result={classicalResult} 
                  onDownload={handleDownload} 
                />
              </>
            )}

            <div className="flex justify-center py-2">
              <svg width="24" height="48" viewBox="0 0 24 48" fill="none">
                <path d="M12 5 L12 43" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 38 L12 43 L17 38" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 10 L12 5 L17 10" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {benchmarkResult && (
              <>
                <QuantumVisualization 
                  quantum={benchmarkResult.quantum}
                  circuitImage={circuitImage}
                  shots={benchmarkResult.shots}
                  case_id={benchmarkResult.case_id}
                  n_qubits={benchmarkResult.n_qubits}
                  classification={benchmarkResult.expected_classification}
                />
                <ComparisonSection result={benchmarkResult} />
              </>
            )}
          </div>
        )}

        {!classicalResult && !benchmarkResult && !isLoading && (
          <div className="text-center py-20">
            <p className="text-gray-500">Pilih kasus dan klik "Jalankan" untuk memulai.</p>
          </div>
        )}
      </div>
    </div>
  );
}
