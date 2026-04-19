import type { QubitState } from './constants';

interface StateInfoPanelProps {
  state: QubitState;
  pZero: number;
  pOne: number;
  historyLength: number;
}

export function StateInfoPanel({ state, pZero, pOne, historyLength }: StateInfoPanelProps) {
  const thetaDeg = ((state.theta * 180) / Math.PI).toFixed(1);
  const phiDeg = ((state.phi * 180) / Math.PI).toFixed(1);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        State Information
      </div>

      <div className="space-y-2 text-[11px] font-mono">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Ket</span>
          <span className="font-semibold text-slate-800">{state.ket}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">θ (polar)</span>
          <span className="font-semibold text-slate-800">{thetaDeg}°</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">φ (azimuth)</span>
          <span className="font-semibold text-slate-800">{phiDeg}°</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">P(|0⟩)</span>
          <span className="font-semibold text-blue-600">{(pZero * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">P(|1⟩)</span>
          <span className="font-semibold text-orange-500">{(pOne * 100).toFixed(1)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Steps</span>
          <span className="font-semibold text-slate-800">{historyLength}</span>
        </div>
      </div>
    </div>
  );
}
