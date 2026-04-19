import { PRESET_STATES } from './constants';

interface StatePresetsProps {
  onSelect: (index: number) => void;
}

export function StatePresets({ onSelect }: StatePresetsProps) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {PRESET_STATES.map((preset, index) => (
        <button
          key={preset.label}
          onClick={() => onSelect(index)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[64px] border-2 border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all bg-white"
        >
          <span className="text-sm font-bold font-mono text-slate-800">{preset.label}</span>
          <span className="text-[9px] font-medium text-slate-400 leading-tight">{preset.ket}</span>
        </button>
      ))}
    </div>
  );
}
