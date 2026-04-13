import type { QFTBenchmarkResult } from '../../types/qft';
import type { QFTCircuitImage } from '../../services/api';
import type { QFTQuantumTrace } from '../../types/qft';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { SignalChart } from '../charts/SignalChart';
import { ProbabilityChart } from '../charts/ProbabilityChart';
import { CircuitDisplay } from '../layout/CircuitDisplay';
import { Cpu } from 'lucide-react';
import { PHASE_COLORS } from '../../constants/phases';

interface QFTQuantumTabProps {
  result: QFTBenchmarkResult | null;
  circuitImage: QFTCircuitImage | null;
  trace: QFTQuantumTrace | null;
}

export function QFTQuantumTab({ result, circuitImage, trace }: QFTQuantumTabProps) {
  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Belum ada data kuantum. Klik "Jalankan" dulu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5" />
          Quantum Fourier Transform (QFT)
        </h2>

        <MetricsGrid>
          <MetricCard label="Qubits" value={result.qft.num_qubits} />
          <MetricCard label="Circuit Depth" value={result.qft.circuit_depth} />
          <MetricCard label="Gate Count" value={result.qft.gate_count} />
          <MetricCard label="Shots" value={result.shots} />
        </MetricsGrid>

        {/* Charts for Quantum QFT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <SignalChart
              data={result.qft.input_amplitudes || []}
              color="#7c3aed"
              title="Input Amplitudes (from same signal data)"
            />
          </div>
          <div>
            <ProbabilityChart
              data={result.qft.probabilities || []}
              title="QFT Measurement Probabilities"
            />
          </div>
        </div>

        <CircuitDisplay
          imageBase64={circuitImage?.image ?? null}
          title="QFT Circuit"
          alt="QFT Circuit"
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>QFT Complexity:</strong> {result.qft.time_complexity}
          </p>
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> {result.comparison.note}
          </p>
        </div>
      </div>

      {trace && (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Circuit Trace</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Step</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Operation</th>
                  {Array.from({ length: trace.n_qubits }, (_, i) => (
                    <th key={i} className="text-center py-2 px-2 font-medium text-gray-700">
                      q{i}
                    </th>
                  ))}
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Phase</th>
                </tr>
              </thead>
              <tbody>
                {trace.stages.map((stage) => (
                  <tr key={stage.step} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-gray-900">{stage.step}</td>
                    <td className="py-2 px-3">{stage.operation}</td>
                    {Array.from({ length: trace.n_qubits }, (_, i) => (
                      <td key={i} className="text-center py-2 px-2 font-mono">
                        {stage.wire_markers[i] || '-'}
                      </td>
                    ))}
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs rounded ${
                          PHASE_COLORS[stage.phase] ?? 'bg-gray-100 text-gray-700'
                        }`}
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

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparison: FFT vs QFT</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">FFT (Classical)</div>
            <div className="text-lg font-mono text-gray-900">{result.comparison.fft_complexity}</div>
            <div className="text-sm text-gray-600 mt-1">Time: {result.fft.execution_time_ms.toFixed(2)} ms</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">QFT (Quantum)</div>
            <div className="text-lg font-mono text-gray-900">{result.comparison.qft_complexity}</div>
            <div className="text-sm text-gray-600 mt-1">Depth: {result.qft.circuit_depth}</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> {result.comparison.speedup_factor}
          </p>
        </div>
      </div>
    </div>
  );
}
