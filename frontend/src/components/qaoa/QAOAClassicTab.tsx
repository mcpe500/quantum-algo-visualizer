import type { QAOABenchmarkResult } from '../../types/qaoa';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { GraphVisualization } from '../charts/GraphVisualization';
import { CutHistoryChart } from '../charts/CutHistoryChart';
import { BookOpen } from 'lucide-react';

interface QAOAClassicTabProps {
  result: QAOABenchmarkResult | null;
}

export function QAOAClassicTab({ result }: QAOAClassicTabProps) {
  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Belum ada data klasik. Klik "Jalankan" dulu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Simulated Annealing & Exact Max-Cut
        </h2>

        <MetricsGrid>
          <MetricCard label="Nodes" value={result.n_nodes} />
          <MetricCard label="Edges" value={result.n_edges} />
          <MetricCard label="Exact Max-Cut" value={result.exact.optimal_cut} variant="highlight" />
          <MetricCard label="SA Best Cut" value={result.classical.best_cut} variant="success" />
        </MetricsGrid>

        {/* Graph + Exact partition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
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
          <div className="bg-gray-50 rounded-lg p-4">
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

        {/* SA Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">SA Best Cut</div>
            <div className="text-2xl font-mono font-bold text-blue-900">{result.classical.best_cut}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Approximation Ratio</div>
            <div className="text-2xl font-mono font-bold text-gray-900">{result.classical.approx_ratio.toFixed(3)}</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">SA Execution Time</div>
            <div className="text-2xl font-mono font-bold text-gray-900">{result.classical.execution_time_ms.toFixed(2)} ms</div>
          </div>
        </div>

        {/* SA cut history chart */}
        {result.classical.cut_history.length > 0 && (
          <CutHistoryChart
            data={result.classical.cut_history}
            optimalCut={result.exact.optimal_cut}
            title="Simulated Annealing — Cut Value vs Iteration"
          />
        )}
      </div>
    </div>
  );
}
