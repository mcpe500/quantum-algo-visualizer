import { Gauge } from 'lucide-react';
import type { DJBenchmarkResult } from '../../types/dj';
import type { DJCircuitImage } from '../../services/api';

interface QuantumVisualizationProps {
  quantum: DJBenchmarkResult['quantum'];
  circuitImage: DJCircuitImage | null;
  boxedCircuitImage: DJCircuitImage | null;
  shots: number;
  case_id: string;
  n_qubits: number;
  classification: string;
}

export function QuantumVisualization({
  quantum,
  circuitImage,
  boxedCircuitImage,
  shots,
  case_id,
  n_qubits,
  classification,
}: QuantumVisualizationProps) {
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

        {boxedCircuitImage && (
          <div className="mt-8 w-full">
            <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-700 overflow-x-auto">
              <p className="text-[10px] tracking-[0.2em] text-slate-400 font-bold uppercase mb-3">Solusi Kuantum - Phase Grouped</p>
              <img
                src={`data:image/png;base64,${boxedCircuitImage.image}`}
                alt={`Phase-grouped Quantum Circuit for ${case_id}`}
                className="max-w-full h-auto"
              />
            </div>
          </div>
        )}
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