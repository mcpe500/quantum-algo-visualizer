import type { VQEBenchmarkResult } from '../../types/vqe';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { InlineEmptyState, SectionCard } from '../layout';
import { BookOpen } from 'lucide-react';
import { UI_MESSAGES } from '../../constants/ui';
import { VQESection, VQEMetricsGrid, VQECard, VQE_TYPOGRAPHY } from './layout';
import { FCIBookFigure } from './fci/FCIBookFigure';
import { FCIFlowDiagram } from './FCIFlowDiagram';

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
        <VQESection>
          <FCIFlowDiagram activeCheckpoint={1} />
        </VQESection>

        <VQESection noPadding>
          <FCIBookFigure result={result} />
        </VQESection>

        <MetricsGrid>
          <MetricCard label="Molecule" value={result.molecule} />
          <MetricCard label="Matrix Size" value={result.classical.matrix_size} />
          <MetricCard label="Complexity" value={result.classical.time_complexity} />
          <MetricCard label="Execution Time" value={`${result.classical.execution_time_ms.toFixed(2)} ms`} />
        </MetricsGrid>

        <VQESection>
          <VQECard variant="info">
            <div className={VQE_TYPOGRAPHY.caption}>FCI Ground State Energy (Reference)</div>
            <div className="text-3xl font-mono font-bold text-blue-900 mt-2">
              {result.classical.energy.toFixed(6)} Ha
            </div>
          </VQECard>
        </VQESection>

        <VQESection title={`Hamiltonian Pauli Terms (${Object.keys(result.hamiltonian_terms).length} terms)`}>
          <VQEMetricsGrid columns="metrics">
            {Object.entries(result.hamiltonian_terms).map(([pauli, coeff]) => (
              <VQECard key={pauli} compact className="flex justify-between items-center gap-2">
                <span className="font-mono text-purple-700 text-sm font-semibold">{pauli}</span>
                <span className={`font-mono text-sm ${coeff < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {coeff >= 0 ? '+' : ''}{coeff.toFixed(4)}
                </span>
              </VQECard>
            ))}
          </VQEMetricsGrid>
        </VQESection>

        <VQESection>
          <VQECard variant="warning">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> {result.classical.note}
            </p>
          </VQECard>
        </VQESection>
      </SectionCard>
    </div>
  );
}
