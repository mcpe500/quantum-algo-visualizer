import { Layers } from 'lucide-react';
import { Card } from '../ui/Card';
import type { DJCircuit } from '../../types/dj';

interface CircuitVisualizerProps {
  circuit: DJCircuit | null;
}

export function CircuitVisualizer({ circuit }: CircuitVisualizerProps) {
  return (
    <Card title="Skema Litar Kuantum" icon={Layers}>
      <div className="bg-slate-950/80 rounded-2xl p-8 overflow-x-auto min-h-[200px] border border-slate-800 flex items-center">
        {circuit ? (
          <div className="flex items-center gap-6 min-w-max">
            <CircuitWires nQubits={circuit.n_qubits} />
            <CircuitGates gates={circuit.gates} />
          </div>
        ) : (
          <div className="w-full text-center py-12">
            <span className="text-xs text-slate-700 font-mono italic">
              Sila jalankan penanda aras untuk visualisasi litar
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

interface CircuitWiresProps {
  nQubits: number;
}

function CircuitWires({ nQubits }: CircuitWiresProps) {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: nQubits }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="text-xs font-mono text-cyan-400 w-6">q[{i}]</span>
          <div className="h-[2px] w-24 bg-slate-800 relative">
            <div className="absolute inset-0 bg-cyan-400/20 blur-sm" />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-purple-400 w-6">anc</span>
        <div className="h-[2px] w-24 bg-slate-800" />
      </div>
    </div>
  );
}

interface CircuitGatesProps {
  gates: Array<{
    name: string;
    qubits: number[];
    params: unknown[];
  }>;
}

function CircuitGates({ gates }: CircuitGatesProps) {
  return (
    <div className="flex gap-4">
      {gates.slice(0, 10).map((g, idx) => (
        <div key={idx} className="flex flex-col items-center gap-2">
          <GateBox name={g.name} />
          <div className="text-[8px] text-slate-600 font-mono">STEP_{idx + 1}</div>
        </div>
      ))}
      {gates.length > 10 && (
        <div className="flex items-center text-slate-700 font-bold px-4">...</div>
      )}
    </div>
  );
}

interface GateBoxProps {
  name: string;
}

function GateBox({ name }: GateBoxProps) {
  const isH = name === 'h';
  const isX = name === 'x';

  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold border ${
        isH
          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
          : isX
          ? 'bg-purple-500 text-white border-purple-400'
          : 'bg-slate-800 text-slate-300 border-slate-700'
      }`}
    >
      {name.toUpperCase()}
    </div>
  );
}
