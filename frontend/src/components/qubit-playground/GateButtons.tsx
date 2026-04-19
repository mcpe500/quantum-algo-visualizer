import { GATES } from './constants';

interface GateButtonsProps {
  onApply: (gateIndex: number) => void;
  disabled?: boolean;
}

export function GateButtons({ onApply, disabled }: GateButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {GATES.map((gate) => (
        <button
          key={gate.symbol}
          onClick={() => onApply(GATES.indexOf(gate))}
          disabled={disabled}
          className="flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px] border-2 border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white"
          title={gate.description}
        >
          <span className="text-base font-bold font-mono text-slate-800">{gate.symbol}</span>
          <span className="text-[9px] font-medium text-slate-500 leading-tight">{gate.name}</span>
        </button>
      ))}
    </div>
  );
}
