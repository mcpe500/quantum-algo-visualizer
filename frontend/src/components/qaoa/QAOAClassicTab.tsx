import type { QAOABenchmarkResult } from '../../types/qaoa';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { GraphVisualization } from '../charts/GraphVisualization';
import { CutHistoryChart } from '../charts/CutHistoryChart';
import { InlineEmptyState, SectionCard } from '../layout';
import { BookOpen, GitBranch, Zap, Cpu } from 'lucide-react';
import { SURFACE_CLASSES, UI_MESSAGES } from '../../constants/ui';
import { QAOASimulatedAnnealingFlow } from './QAOASimulatedAnnealingFlow';

interface QAOAClassicTabProps {
  result: QAOABenchmarkResult | null;
}

export function QAOAClassicTab({ result }: QAOAClassicTabProps) {
  if (!result) {
    return <InlineEmptyState message={UI_MESSAGES.emptyClassic} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionCard title="QAOA Hybrid: Simulated Annealing + Parameter Optimization" icon={<GitBranch className="w-5 h-5" />}>
        <div className="mb-5">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-200">Problem: Max-Cut</span>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-mono rounded-full">K{result.n_nodes} graph</span>
          </div>

          {/* Flow Diagram */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-2">
              {/* SA Section */}
              <div className="flex-1 text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-bold text-blue-900 mb-1">Classical</p>
                <p className="text-xs text-blue-700 font-medium">SA explores solution space</p>
                <p className="text-xs text-blue-600 mt-1">finds approximate optimum</p>
              </div>

              {/* Arrow */}
              <div className="flex items-center">
                <svg width="60" height="24" viewBox="0 0 60 24" className="text-slate-400">
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                    </marker>
                  </defs>
                  <line x1="0" y1="12" x2="50" y2="12" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowhead)" />
                </svg>
              </div>

              {/* QAOA Section */}
              <div className="flex-1 text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-bold text-purple-900 mb-1">QAOA</p>
                <p className="text-xs text-purple-700 font-medium">Parameterized circuit (P={result.p_layers} steps)</p>
                <p className="text-xs text-purple-600 mt-1">Cost: H_C = Σ (I - Z_i Z_j)/2</p>
              </div>
            </div>

            {/* Cost Function */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="px-3 py-1.5 bg-amber-50 text-amber-800 rounded-full border border-amber-200 font-mono">
                  |ψ(γ,β)⟩ = Π U_C(γ) U_B(β) |+⟩
                </span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 font-mono">
                  Cost = ⟨ψ|H_C|ψ⟩
                </span>
              </div>
            </div>
          </div>
        </div>

        <MetricsGrid>
          <MetricCard label="Nodes" value={result.n_nodes} />
          <MetricCard label="Edges" value={result.n_edges} />
          <MetricCard label="Exact Max-Cut" value={result.exact.optimal_cut} variant="highlight" />
          <MetricCard label="SA Best Cut" value={result.classical.best_cut} variant="success" />
        </MetricsGrid>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className={SURFACE_CLASSES.subtleCard}>
            <p className="text-sm font-medium text-gray-700 mb-3 text-center">
              Graph: K{result.n_nodes}
            </p>
            <GraphVisualization
              nodes={result.nodes}
              edges={result.edges}
            />
            <p className="text-xs text-gray-500 text-center mt-2">
              Edges: {result.edges.map(([i, j]) => `(${i},${j})`).join(', ')}
            </p>
          </div>
          <div className={SURFACE_CLASSES.subtleCard}>
            <p className="text-sm font-medium text-gray-700 mb-3 text-center">
              Optimal Partition (cut = {result.exact.optimal_cut})
            </p>
            <GraphVisualization
              nodes={result.nodes}
              edges={result.edges}
              partition={result.exact.optimal_partition}
            />
            <p className="text-xs text-gray-500 text-center mt-2">
              {result.exact.time_complexity} — Brute Force
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={SURFACE_CLASSES.subtleCard}>
            <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">SA Best Cut</div>
            <div className="text-2xl font-mono font-bold text-blue-900">{result.classical.best_cut}</div>
          </div>
          <div className={SURFACE_CLASSES.subtleCard}>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Approximation Ratio</div>
            <div className="text-2xl font-mono font-bold text-gray-900">{result.classical.approx_ratio.toFixed(3)}</div>
          </div>
          <div className={SURFACE_CLASSES.subtleCard}>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">SA Execution Time</div>
            <div className="text-2xl font-mono font-bold text-gray-900">{result.classical.execution_time_ms.toFixed(2)} ms</div>
          </div>
        </div>

        {result.classical.cut_history.length > 0 && (
          <CutHistoryChart
            data={result.classical.cut_history}
            optimalCut={result.exact.optimal_cut}
            title="Simulated Annealing — Cut Value vs Iteration"
          />
        )}
      </SectionCard>

      <QAOASimulatedAnnealingFlow result={result} />
    </div>
  );
}
