import type { QAOABenchmarkResult } from '../../types/qaoa';
import type { QAOACircuitImage } from '../../services/api';
import type { QAOATrace } from '../../types/qaoa';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { ConvergenceChart } from '../charts/ConvergenceChart';
import { CutDistributionChart } from '../charts/CutDistributionChart';
import { CircuitDisplay } from '../layout/CircuitDisplay';
import { TraceTable } from '../layout/TraceTable';
import { InlineEmptyState, SectionCard } from '../layout';
import { Cpu } from 'lucide-react';
import { SURFACE_CLASSES, UI_MESSAGES } from '../../constants/ui';

interface QAOAQuantumTabProps {
  result: QAOABenchmarkResult | null;
  circuitImage: QAOACircuitImage | null;
  trace: QAOATrace | null;
}

export function QAOAQuantumTab({ result, circuitImage, trace }: QAOAQuantumTabProps) {
  if (!result) {
    return <InlineEmptyState message={UI_MESSAGES.emptyQuantum} />;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Quantum Approximate Optimization Algorithm (QAOA)" icon={<Cpu className="w-5 h-5" />}>
        <MetricsGrid>
          <MetricCard label="Qubits" value={result.quantum.n_qubits} />
          <MetricCard label="p Layers" value={result.quantum.p_layers} />
          <MetricCard label="Circuit Depth" value={result.quantum.circuit_depth} />
          <MetricCard label="Gate Count" value={result.quantum.gate_count} />
        </MetricsGrid>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">QAOA Best Cut</div>
            <div className="text-3xl font-mono font-bold text-purple-900">{result.quantum.best_cut}</div>
            <div className="text-xs text-purple-700 mt-1">bitstring: {result.quantum.best_bitstring}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expected Cut</div>
            <div className="text-3xl font-mono font-bold text-gray-900">{result.quantum.expected_cut.toFixed(3)}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-xs text-green-600 uppercase tracking-wide mb-1">Approx. Ratio</div>
            <div className="text-3xl font-mono font-bold text-green-800">{result.quantum.approx_ratio.toFixed(3)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {result.quantum.optimal_gamma.map((g, i) => (
            <span key={`g${i}`} className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-mono rounded-full">
              γ{i + 1}: {g.toFixed(4)}
            </span>
          ))}
          {result.quantum.optimal_beta.map((b, i) => (
            <span key={`b${i}`} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded-full">
              β{i + 1}: {b.toFixed(4)}
            </span>
          ))}
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded-full">
            {result.quantum.iterations} iterations
          </span>
        </div>

        {result.quantum.expected_cut_history.length > 0 && (
          <div className="mb-6">
            <ConvergenceChart
              data={result.quantum.expected_cut_history}
              optimalValue={result.exact.optimal_cut}
              title="QAOA Optimizer — Expected Cut vs Iteration"
              yLabel="Expected Cut"
              optimalLabel="Optimal"
              dataLabel="QAOA"
            />
          </div>
        )}

        {result.quantum.cut_distribution.length > 0 && (
          <div className="mb-6">
            <CutDistributionChart
              data={result.quantum.cut_distribution}
              title="Measurement Probability Distribution (top bitstrings)"
            />
          </div>
        )}

        <CircuitDisplay
          imageBase64={circuitImage?.image ?? null}
          title="QAOA Circuit"
          alt="QAOA Circuit"
        />
      </SectionCard>

      {trace && (
        <TraceTable
          stages={trace.stages}
          nQubits={trace.n_nodes}
          title="QAOA Circuit Trace"
        />
      )}

      <SectionCard title="Comparison: Exact vs SA vs QAOA">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-xs text-green-600 uppercase tracking-wide mb-1">Exact (Brute Force)</div>
            <div className="text-2xl font-mono font-bold text-green-900">Cut = {result.comparison.exact_cut}</div>
            <div className="text-sm text-green-700 mt-1">ratio: 1.000</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">SA (Simulated Annealing)</div>
            <div className="text-2xl font-mono font-bold text-blue-900">Cut = {result.comparison.sa_cut}</div>
            <div className="text-sm text-blue-700 mt-1">ratio: {result.comparison.sa_approx_ratio.toFixed(3)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-xs text-purple-600 uppercase tracking-wide mb-1">QAOA (Quantum)</div>
            <div className="text-2xl font-mono font-bold text-purple-900">Cut = {result.comparison.qaoa_cut}</div>
            <div className="text-sm text-purple-700 mt-1">ratio: {result.comparison.qaoa_approx_ratio.toFixed(3)}</div>
          </div>
        </div>
        <div className={SURFACE_CLASSES.subtleCard}>
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> {result.comparison.note}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
