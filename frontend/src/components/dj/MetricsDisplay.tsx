import { Cpu, BarChart3 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Metric } from '../ui/Metric';
import type { DJBenchmarkResult } from '../../types/dj';

interface MetricsDisplayProps {
  result: DJBenchmarkResult | null;
}

export function MetricsDisplay({ result }: MetricsDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Metrik Kuantum" icon={Cpu}>
        {result ? (
          <div className="grid grid-cols-2 gap-6">
            <Metric
              label="Masa Laksana"
              value={result.quantum.execution_time_ms.toFixed(2)}
              unit="ms"
              color="text-cyan-400"
            />
            <Metric
              label="Kedalaman Litar"
              value={result.quantum.circuit_depth}
              color="text-white"
            />
            <Metric
              label="Bil. Get"
              value={result.quantum.gate_count}
              color="text-white"
            />
            <Metric
              label="Ketepatan"
              value="100"
              unit="%"
              color="text-emerald-400"
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </Card>

      <Card title="Metrik Klasik (BF)" icon={BarChart3}>
        {result ? (
          <div className="grid grid-cols-2 gap-6">
            <Metric
              label="Penilaian Orakel"
              value={result.classic.num_evaluations}
              color="text-amber-400"
            />
            <Metric
              label="Kes Terburuk"
              value={result.classic.worst_case_evaluations}
              color="text-slate-300"
            />
            <Metric
              label="Kompleksiti"
              value={result.classic.time_complexity.replace('O', '')}
              color="text-white"
            />
            <Metric
              label="Hasil"
              value={result.classic.result}
              color={
                result.classic.result === 'CONSTANT'
                  ? 'text-blue-400'
                  : 'text-purple-400'
              }
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
      <span className="text-xs text-slate-600 font-mono tracking-widest">
        MENUNGGU_DATA...
      </span>
    </div>
  );
}
