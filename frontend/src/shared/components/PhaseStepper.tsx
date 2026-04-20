import { ChevronRight } from 'lucide-react';

interface PhaseStepperProps {
  partitions: Array<{
    phase: string;
    label: string;
    count: number;
    start_col?: number;
    start?: number;
  }>;
  activePhase: string;
  activeStep: {
    step: number;
    operation: string;
    description: string;
    comment?: string;
  };
  onJumpPhase: (phase: string) => void;
  disabled: boolean;
  color?: 'violet' | 'teal';
  activeLabel?: string;
  startKey?: 'start_col' | 'start';
}

export function PhaseStepper({
  partitions,
  activePhase,
  activeStep,
  onJumpPhase,
  disabled,
  color = 'violet',
  activeLabel = 'Active Column',
  startKey = 'start_col',
}: PhaseStepperProps) {
  const activeColorClass = color === 'teal'
    ? 'border-teal-400 bg-teal-600'
    : 'border-violet-400 bg-violet-600';

  return (
    <div className="px-4 pb-4 pt-2 space-y-2">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {partitions.map((partition, index) => {
          const isActive = partition.phase === activePhase;
          const startVal = startKey === 'start_col' ? partition.start_col : partition.start;
          return (
            <div key={`${partition.phase}-${startVal}`} className="flex items-center gap-1.5 shrink-0">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
              <button
                onClick={() => onJumpPhase(partition.phase)}
                disabled={disabled}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                  isActive
                    ? `${activeColorClass} text-white`
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {partition.label}
                <span className="ml-1 opacity-80">({partition.count})</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{activeLabel}</p>
        <p className="mt-1 text-[15px] font-semibold text-slate-900">Step {activeStep.step} · {activeStep.operation}</p>
        {activeStep.comment && (
          <p className="mt-1 text-[13px] font-medium text-violet-600">{activeStep.comment}</p>
        )}
        <p className="mt-1 text-[13px] leading-6 text-slate-600">{activeStep.description}</p>
      </div>
    </div>
  );
}