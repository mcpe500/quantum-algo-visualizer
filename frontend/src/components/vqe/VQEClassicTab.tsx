import type { VQEBenchmarkResult } from '../../types/vqe';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { InlineEmptyState, SectionCard } from '../layout';
import { BookOpen } from 'lucide-react';
import { UI_MESSAGES } from '../../constants/ui';

interface VQEClassicTabProps {
  result: VQEBenchmarkResult | null;
}

export function VQEClassicTab({ result }: VQEClassicTabProps) {
  if (!result) {
    return <InlineEmptyState message={UI_MESSAGES.emptyClassic} />;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Full Configuration Interaction (FCI)" icon={<BookOpen className="w-5 h-5" />}>
        <MetricsGrid>
          <MetricCard label="Molecule" value={result.molecule} />
          <MetricCard label="Matrix Size" value={result.classical.matrix_size} />
          <MetricCard label="Complexity" value={result.classical.time_complexity} />
          <MetricCard label="Execution Time" value={`${result.classical.execution_time_ms.toFixed(2)} ms`} />
        </MetricsGrid>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">FCI Ground State Energy (Reference)</div>
          <div className="text-3xl font-mono font-bold text-blue-900">{result.classical.energy.toFixed(6)} Ha</div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Hamiltonian Pauli Terms ({Object.keys(result.hamiltonian_terms).length} terms)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(result.hamiltonian_terms).map(([pauli, coeff]) => (
              <div
                key={pauli}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex justify-between items-center gap-2"
              >
                <span className="font-mono text-purple-700 text-sm font-semibold">{pauli}</span>
                <span className={`font-mono text-sm ${coeff < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {coeff >= 0 ? '+' : ''}{coeff.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> {result.classical.note}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
