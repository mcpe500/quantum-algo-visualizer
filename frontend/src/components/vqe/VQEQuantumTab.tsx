import { useState } from 'react';
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
import { VQEHybridSplitView } from './VQEHybridSplitView';
import { VQECheckpointTimeline } from './VQECheckpointTimeline';
import { VQEStepFlowDiagram } from './VQEStepFlowDiagram';
import { VQESection, VQEMetricsGrid, VQECard, VQE_TYPOGRAPHY } from './layout';

interface VQEQuantumTabProps {
  result: VQEBenchmarkResult | null;
  circuitImage: VQECircuitImage | null;
  trace: VQETrace | null;
}

export function VQEQuantumTab({ result, circuitImage, trace }: VQEQuantumTabProps) {
  const [activeCheckpoint, setActiveCheckpoint] = useState(0);

  if (!result) {
    return <InlineEmptyState message={UI_MESSAGES.emptyQuantum} />;
  }

  const snapshots = result.quantum.iteration_snapshots || [];
  const hasSnapshots = snapshots.length > 0;

  const safeActive = Math.min(activeCheckpoint, Math.max(0, snapshots.length - 1));
  const currentSnapshot = hasSnapshots ? snapshots[safeActive] : null;

  const displayEnergy = currentSnapshot ? currentSnapshot.energy : result.quantum.energy;
  const displayEnergyError = Math.abs(displayEnergy - result.classical.energy);
  const displayAccuracy = Math.max(
    0,
    Math.min(100, (1 - displayEnergyError / Math.max(Math.abs(result.classical.energy), 1e-10)) * 100)
  );

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

        {/* Comparison: FCI vs VQE */}
        <VQESection title="Comparison: FCI vs VQE">
          <VQEMetricsGrid columns="comparison">
            <VQECard compact variant="success">
              <div className={VQE_TYPOGRAPHY.caption}>FCI (Classical Exact)</div>
              <div className="text-xl font-mono text-emerald-900 mt-1">
                {result.comparison.fci_energy.toFixed(6)} Ha
              </div>
              <div className={VQE_TYPOGRAPHY.small + ' mt-1'}>Baseline reference</div>
            </VQECard>
            <VQECard compact variant="info">
              <div className={VQE_TYPOGRAPHY.caption}>VQE (Quantum Variational)</div>
              <div className="text-xl font-mono text-blue-900 mt-1">
                {result.comparison.vqe_energy.toFixed(6)} Ha
              </div>
              <div className={VQE_TYPOGRAPHY.small + ' mt-1'}>
                Error: {result.comparison.energy_error.toFixed(6)} Ha | {result.comparison.accuracy_percent.toFixed(2)}% accuracy
              </div>
            </VQECard>
          </VQEMetricsGrid>
          <div className="mt-4">
            <VQECard compact variant="warning">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> {result.comparison.note}
              </p>
            </VQECard>
          </div>
        </VQESection>

        {/* Step Flow Diagram */}
        {hasSnapshots && (
          <VQESection>
            <VQEStepFlowDiagram activeCheckpoint={safeActive} />
          </VQESection>
        )}

        {/* Convergence Chart */}
        {result.quantum.convergence_history.length > 0 && (
          <VQESection>
            <ConvergenceChart
              data={result.quantum.convergence_history}
              optimalValue={result.classical.energy}
              title="VQE Convergence (Energy vs Iteration)"
              yLabel="Energy (Ha)"
              optimalLabel="FCI (exact)"
              dataLabel="VQE energy"
            />
          </VQESection>
        )}

        {/* Checkpoint Timeline */}
        {hasSnapshots && (
          <VQESection>
            <VQECheckpointTimeline
              snapshots={snapshots}
              active={safeActive}
              onChange={setActiveCheckpoint}
            />
          </VQESection>
        )}

        {/* Hybrid Split View + Energy Cards */}
        {hasSnapshots && currentSnapshot && (
          <VQESection>
            <VQEHybridSplitView
              snapshot={currentSnapshot}
              fciEnergy={result.classical.energy}
              ansatzType={result.ansatz_type}
              nLayers={result.n_layers}
              hamiltonianTerms={result.hamiltonian_terms}
              nQubits={result.n_qubits}
              totalIterations={result.quantum.iterations}
              optimizerName={result.quantum.optimizer_name || 'COBYLA'}
              measurementMethod={result.quantum.measurement_method || 'Statevector (exact)'}
            />
          </VQESection>
        )}

        {/* Energy Cards */}
        <VQESection>
          <VQEMetricsGrid columns="energy">
            <VQECard compact variant="info">
              <div className={VQE_TYPOGRAPHY.caption}>
                {hasSnapshots ? `VQE Energy (Itr ${currentSnapshot?.iteration})` : 'VQE Energy'}
              </div>
              <div className="text-2xl font-mono font-bold text-blue-900 mt-1">
                {displayEnergy.toFixed(6)} Ha
              </div>
            </VQECard>
            <VQECard compact variant="error">
              <div className={VQE_TYPOGRAPHY.caption}>Energy Error |VQE − FCI|</div>
              <div className="text-2xl font-mono font-bold text-red-800 mt-1">
                {displayEnergyError.toFixed(6)} Ha
              </div>
            </VQECard>
            <VQECard compact variant="success">
              <div className={VQE_TYPOGRAPHY.caption}>Accuracy</div>
              <div className="text-2xl font-mono font-bold text-emerald-800 mt-1">
                {displayAccuracy.toFixed(2)}%
              </div>
            </VQECard>
          </VQEMetricsGrid>
        </VQESection>

        {/* Circuit Display */}
        <VQESection>
          <CircuitDisplay
            imageBase64={circuitImage?.image ?? null}
            title="Final Ansatz Circuit"
            alt="VQE Ansatz Circuit"
          />
        </VQESection>

        {/* Optimal Parameters */}
        {result.quantum.optimal_parameters.length > 0 && (
          <VQESection>
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
          </VQESection>
        )}
      </SectionCard>

      {/* Shot-Based Evaluation */}
      {result.quantum.shot_evaluation && (
        <SectionCard title="Shot-Based Evaluation">
          <VQEMetricsGrid columns="energy">
            <VQECard compact variant="info">
              <div className={VQE_TYPOGRAPHY.caption}>
                Shot Energy ({result.quantum.shot_evaluation.shots.toLocaleString()} shots)
              </div>
              <div className="text-2xl font-mono font-bold text-blue-900 mt-1">
                {result.quantum.shot_evaluation.energy.toFixed(6)} Ha
              </div>
              <div className={VQE_TYPOGRAPHY.small + ' mt-1'}>
                std: {result.quantum.shot_evaluation.std.toFixed(6)}
              </div>
            </VQECard>
            <VQECard compact variant="error">
              <div className={VQE_TYPOGRAPHY.caption}>Shot Error |E_shot − FCI|</div>
              <div className="text-2xl font-mono font-bold text-red-800 mt-1">
                {result.quantum.shot_evaluation.energy_error.toFixed(6)} Ha
              </div>
            </VQECard>
            <VQECard compact>
              <div className={VQE_TYPOGRAPHY.caption}>Exact vs Shot</div>
              <div className="text-sm font-mono text-gray-800 mt-1">
                <div>Exact: {result.quantum.energy.toFixed(6)}</div>
                <div>Shot:  {result.quantum.shot_evaluation.energy.toFixed(6)}</div>
                <div>Delta: {Math.abs(result.quantum.energy - result.quantum.shot_evaluation.energy).toFixed(6)}</div>
              </div>
            </VQECard>
          </VQEMetricsGrid>
          <div className="mt-4">
            <VQECard compact variant="warning">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Optimasi VQE menggunakan Statevector (eksak) untuk konvergensi yang stabil.
                Evaluasi shot-based dilakukan pada parameter optimal dengan {result.quantum.shot_evaluation.shots.toLocaleString()} shots
                untuk mensimulasikan pengukuran pada quantum hardware nyata.
              </p>
            </VQECard>
          </div>
        </SectionCard>
      )}

      {/* Trace Table */}
      {trace && (
        <TraceTable
          stages={trace.stages}
          nQubits={trace.n_qubits}
          title="Ansatz Circuit Trace"
        />
      )}
    </div>
  );
}
