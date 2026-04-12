import { Zap, Play, Activity } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  onRun: () => void;
  loading: boolean;
}

export function Header({ onRun, loading }: HeaderProps) {
  return (
    <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <span className="text-cyan-400 font-bold tracking-tighter text-xl">
            QUANTUM.LAB
          </span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          Algoritma Deutsch-Jozsa
        </h1>
        <p className="text-slate-400 mt-2 max-w-xl text-sm leading-relaxed">
          Menentukan sama ada fungsi adalah{' '}
          <span className="text-cyan-400 font-semibold italic">Pemalar (Constant)</span>{' '}
          atau{' '}
          <span className="text-purple-400 font-semibold italic">Seimbang (Balanced)</span>{' '}
          dalam satu penilaian tunggal.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        <div className="px-4 py-2 border-r border-slate-800">
          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
            Status Enjin
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400">READY_SIM_AER</span>
          </div>
        </div>
        <Button
          icon={loading ? Activity : Play}
          onClick={onRun}
          loading={loading}
          disabled={loading}
        >
          JALANKAN PENANDA ARAS
        </Button>
      </div>
    </header>
  );
}
