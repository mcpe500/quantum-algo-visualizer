import { Zap, CheckCircle2 } from 'lucide-react';
import type { DJBenchmarkResult } from '../../types/dj';

interface SpeedupCardProps {
  result: DJBenchmarkResult | null;
}

export function SpeedupCard({ result }: SpeedupCardProps) {
  if (!result) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-3xl p-8">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Zap className="w-32 h-32 text-cyan-400" />
      </div>
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h4 className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-2">
            Pecutan Kuantum (Speedup)
          </h4>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black text-white">
              {result.comparison.speedup_factor}x
            </span>
            <span className="text-slate-400 font-medium">
              lebih sedikit panggilan
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-bold uppercase">
              Klasifikasi Berjaya
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            ID Transaksi: DJ-{Math.floor(Math.random() * 100000)}
          </div>
        </div>
      </div>
    </div>
  );
}
