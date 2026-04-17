import type { QFTBenchmarkResult } from '../../types/qft';
import type { QFTCircuitImage } from '../../services/api';
import type { QFTQuantumTrace } from '../../types/qft';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { SignalChart } from '../charts/SignalChart';
import { ProbabilityChart } from '../charts/ProbabilityChart';
import { CircuitDisplay } from '../layout/CircuitDisplay';
import { InlineEmptyState, SectionCard, TraceTable } from '../layout';
import { Cpu } from 'lucide-react';
import { UI_MESSAGES } from '../../constants/ui';

interface QFTQuantumTabProps {
  result: QFTBenchmarkResult | null;
  circuitImage: QFTCircuitImage | null;
  trace: QFTQuantumTrace | null;
}

export function QFTQuantumTab({ result, circuitImage, trace }: QFTQuantumTabProps) {
  if (!result) {
    return <InlineEmptyState message={UI_MESSAGES.emptyQuantum} />;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Quantum Fourier Transform (QFT)" icon={<Cpu className="w-5 h-5" />}>
        <MetricsGrid>
          <MetricCard label="Qubits" value={result.qft.num_qubits} />
          <MetricCard label="Circuit Depth" value={result.qft.circuit_depth} />
          <MetricCard label="Gate Count" value={result.qft.gate_count} />
          <MetricCard label="Shots" value={result.shots} />
        </MetricsGrid>

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
      </SectionCard>

      {trace && (
        <TraceTable
          stages={trace.stages}
          nQubits={trace.n_qubits}
          title="QFT Circuit Trace"
        />
      )}

      <SectionCard title="Comparison: FFT vs QFT">
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
      </SectionCard>
    </div>
  );
}
