import type { VQEBenchmarkResult } from '../../types/vqe';
import type { VQECircuitImage } from '../../services/api';
import type { VQETrace } from '../../types/vqe';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { ConvergenceChart } from '../charts/ConvergenceChart';
import { CircuitDisplay } from '../layout/CircuitDisplay';
import { TraceTable } from '../layout/TraceTable';
import { InlineEmptyState, SectionCard } from '../layout';
import { Cpu } from 'lucide-react';
import { UI_MESSAGES } from '../../constants/ui';

interface VQEQuantumTabProps {
  result: VQEBenchmarkResult | null;
  circuitImage: VQECircuitImage | null;
  trace: VQETrace | null;
}

export function VQEQuantumTab({ result, circuitImage, trace }: VQEQuantumTabProps) {
  if (!result) {
    return <InlineEmptyState message={UI_MESSAGES.emptyQuantum} />;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Variational Quantum Eigensolver (VQE)" icon={<Cpu className="w-5 h-5" />}>
        <MetricsGrid>
          <MetricCard label="Qubits" value={result.n_qubits} />
          <MetricCard label="Iterations" value={result.quantum.iterations} />
          <MetricCard label="Circuit Depth" value={result.quantum.circuit_depth} />
          <MetricCard label="Gate Count" value={result.quantum.gate_count} />
        </MetricsGrid>

        <div className="flex flex-wrap gap-3 mb-6">
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-mono rounded-full">
            ansatz: {result.ansatz_type}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-mono rounded-full">
            layers: {result.n_layers}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-mono rounded-full">
            params: {result.quantum.optimal_parameters.length}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded-full">
            {result.quantum.time_complexity}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">VQE Energy</div>
            <div className="text-2xl font-mono font-bold text-purple-900">{result.quantum.energy.toFixed(6)} Ha</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-xs text-red-600 uppercase tracking-wide mb-1">Energy Error |VQE − FCI|</div>
            <div className="text-2xl font-mono font-bold text-red-800">{result.quantum.energy_error.toFixed(6)} Ha</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-xs text-green-600 uppercase tracking-wide mb-1">Accuracy</div>
            <div className="text-2xl font-mono font-bold text-green-800">{result.quantum.accuracy.toFixed(2)}%</div>
          </div>
        </div>

        {result.quantum.convergence_history.length > 0 && (
          <div className="mb-6">
            <ConvergenceChart
              data={result.quantum.convergence_history}
              optimalValue={result.classical.energy}
              title="VQE Convergence (Energy vs Iteration)"
              yLabel="Energy (Ha)"
              optimalLabel="FCI (exact)"
              dataLabel="VQE energy"
            />
          </div>
        )}

        {result.quantum.optimal_parameters.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Optimized Parameters (θ₀ … θ{result.quantum.optimal_parameters.length - 1})
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.quantum.optimal_parameters.map((p, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 border border-gray-200 text-xs font-mono rounded">
                  θ{i}: {p.toFixed(4)}
                </span>
              ))}
            </div>
          </div>
        )}

        <CircuitDisplay
          imageBase64={circuitImage?.image ?? null}
          title="Ansatz Circuit"
          alt="VQE Ansatz Circuit"
        />
      </SectionCard>

      {result.quantum.shot_evaluation && (
        <SectionCard title="Shot-Based Evaluation">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">
                Shot Energy ({result.quantum.shot_evaluation.shots.toLocaleString()} shots)
              </div>
              <div className="text-2xl font-mono font-bold text-blue-900">
                {result.quantum.shot_evaluation.energy.toFixed(6)} Ha
              </div>
              <div className="text-xs text-blue-500 mt-1">
                std: {result.quantum.shot_evaluation.std.toFixed(6)}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-xs text-red-600 uppercase tracking-wide mb-1">
                Shot Error |E_shot − FCI|
              </div>
              <div className="text-2xl font-mono font-bold text-red-800">
                {result.quantum.shot_evaluation.energy_error.toFixed(6)} Ha
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">
                Exact vs Shot
              </div>
              <div className="text-sm font-mono text-gray-800 mt-1">
                <div>Exact: {result.quantum.energy.toFixed(6)}</div>
                <div>Shot:  {result.quantum.shot_evaluation.energy.toFixed(6)}</div>
                <div>Delta: {Math.abs(result.quantum.energy - result.quantum.shot_evaluation.energy).toFixed(6)}</div>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> Optimasi VQE menggunakan Statevector (eksak) untuk konvergensi yang stabil.
              Evaluasi shot-based dilakukan pada parameter optimal dengan {result.quantum.shot_evaluation.shots.toLocaleString()} shots
              untuk mensimulasikan pengukuran pada quantum hardware nyata.
            </p>
          </div>
        </SectionCard>
      )}

      {trace && (
        <TraceTable
          stages={trace.stages}
          nQubits={trace.n_qubits}
          title="Ansatz Circuit Trace"
        />
      )}

      <SectionCard title="Comparison: FCI vs VQE">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">FCI (Classical Exact)</div>
            <div className="text-xl font-mono text-gray-900">{result.comparison.fci_energy.toFixed(6)} Ha</div>
            <div className="text-sm text-gray-600 mt-1">{result.classical.time_complexity}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">VQE (Quantum Variational)</div>
            <div className="text-xl font-mono text-gray-900">{result.comparison.vqe_energy.toFixed(6)} Ha</div>
            <div className="text-sm text-gray-600 mt-1">{result.quantum.time_complexity}</div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> {result.comparison.note}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
