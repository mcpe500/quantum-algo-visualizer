import { useState, useEffect, useRef } from 'react';
import type { VQEBenchmarkResult } from '../../types/vqe';
import type { VQECircuitImage } from '../../services/api';
import type { VQETrace } from '../../types/vqe';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { ConvergenceChart } from '../charts/ConvergenceChart';
import { CircuitDisplay } from '../layout/CircuitDisplay';
import { TraceTable } from '../layout/TraceTable';
import { InlineEmptyState, SectionCard } from '../layout';
import { Cpu, Play, Pause, SkipForward } from 'lucide-react';
import { UI_MESSAGES } from '../../constants/ui';
import { VQEHybridSplitView } from './VQEHybridSplitView';
import { VQECheckpointTimeline } from './VQECheckpointTimeline';
import { VQEStepFlowDiagram } from './VQEStepFlowDiagram';
import { VQEComputationalTracePanel } from './VQEComputationalTracePanel';
import { VQESection, VQEMetricsGrid, VQECard, VQE_TYPOGRAPHY } from './layout';

const ANIMATION_INTERVAL_MS = 120;

interface VQEQuantumTabProps {
  result: VQEBenchmarkResult | null;
  circuitImage: VQECircuitImage | null;
  trace: VQETrace | null;
}

export function VQEQuantumTab({ result, circuitImage, trace }: VQEQuantumTabProps) {
  const [activeCheckpoint, setActiveCheckpoint] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedIteration, setAnimatedIteration] = useState(0);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalIterations = result?.quantum.convergence_history.length ?? 0;

  // Animation: advance through convergence history
  useEffect(() => {
    if (isAnimating && totalIterations > 0) {
      animationRef.current = setInterval(() => {
        setAnimatedIteration((prev) => {
          const next = prev + 1;
          if (next >= totalIterations - 1) {
            setIsAnimating(false);
            return totalIterations - 1;
          }
          return next;
        });
      }, ANIMATION_INTERVAL_MS);
    }
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isAnimating, totalIterations]);

  if (!result) {
    return <InlineEmptyState message={UI_MESSAGES.emptyQuantum} />;
  }

  const convergenceHistory = result.quantum.convergence_history;
  const snapshots = result.quantum.iteration_snapshots || [];
  const hasSnapshots = snapshots.length > 0;

  // Keep activeCheckpoint in bounds
  const safeActive = Math.min(activeCheckpoint, Math.max(0, snapshots.length - 1));
  const currentSnapshot = hasSnapshots ? snapshots[safeActive] : null;

  const displayEnergy = currentSnapshot ? currentSnapshot.energy : result.quantum.energy;
  const displayEnergyError = Math.abs(displayEnergy - result.classical.energy);
  const displayAccuracy = Math.max(
    0,
    Math.min(100, (1 - displayEnergyError / Math.max(Math.abs(result.classical.energy), 1e-10)) * 100)
  );


  const handlePlay = () => {
    setAnimatedIteration(0);
    setIsAnimating(true);
  };

  const handlePause = () => {
    setIsAnimating(false);
  };

  const handleStep = () => {
    setIsAnimating(false);
    setAnimatedIteration((prev) => Math.min(prev + 1, totalIterations - 1));
  };

  const handleReset = () => {
    setIsAnimating(false);
    setAnimatedIteration(0);
  };

  // Sync animatedIteration with checkpoint when user clicks a checkpoint
  const handleCheckpointChange = (idx: number) => {
    setIsAnimating(false);
    setActiveCheckpoint(idx);
    // Map checkpoint index to convergence history index
    const convIdx = hasSnapshots
      ? Math.min(snapshots[idx]?.iteration ?? idx * Math.ceil(totalIterations / snapshots.length), totalIterations - 1)
      : idx;
    setAnimatedIteration(convIdx);
  };

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
            <VQEStepFlowDiagram
              activeCheckpoint={safeActive}
              isAnimating={isAnimating}
              animatedIteration={animatedIteration}
              totalIterations={totalIterations}
            />
          </VQESection>
        )}

        {/* Convergence Chart */}
        {convergenceHistory.length > 0 && (
          <VQESection>
            {/* Current phase indicator + animation controls */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Animation
                </span>
                {/* Phase badge: shows which phase of the hybrid loop is active */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isAnimating
                    ? 'bg-purple-100 text-purple-700'
                    : animatedIteration === 0
                      ? 'bg-blue-100 text-blue-700'
                      : animatedIteration >= totalIterations - 2
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                }`}>
                  {isAnimating
                    ? 'Running...'
                    : animatedIteration === 0
                      ? 'Initializing θ'
                      : animatedIteration >= totalIterations - 2
                        ? 'Converged!'
                        : 'Optimizing'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePlay}
                  disabled={isAnimating || animatedIteration >= totalIterations - 1}
                  className="p-1.5 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Play"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handlePause}
                  disabled={!isAnimating}
                  className="p-1.5 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Pause"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleStep}
                  disabled={animatedIteration >= totalIterations - 1}
                  className="p-1.5 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Step forward"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleReset}
                  className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-medium"
                >
                  Reset
                </button>
              </div>
              <span className="text-xs font-mono text-slate-400">
                iteration {animatedIteration} / {totalIterations - 1}
              </span>
            </div>
            <ConvergenceChart
              data={convergenceHistory}
              optimalValue={result.classical.energy}
              title="VQE Convergence (Energy vs Iteration)"
              yLabel="Energy (Ha)"
              optimalLabel="FCI (exact)"
              dataLabel="VQE energy"
              animatedUpTo={animatedIteration}
            />
          </VQESection>
        )}

        {/* Checkpoint Timeline */}
        {hasSnapshots && (
          <VQESection>
            <VQECheckpointTimeline
              snapshots={snapshots}
              active={safeActive}
              onChange={handleCheckpointChange}
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

      {/* Computational Trace */}
      {result.computational_trace && (
        <VQEComputationalTracePanel trace={result.computational_trace} />
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
