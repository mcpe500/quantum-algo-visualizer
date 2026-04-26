import React from 'react';
import { ArrowLeft, ArrowRight, GitBranch, Sparkles, X } from 'lucide-react';
import type { FormulaStudioScenario } from '../scenarios';

interface StudioFlowPanelProps {
  scenario: FormulaStudioScenario;
  activeStepIndex: number;
  onStepChange: (index: number) => void;
  onClose: () => void;
}

export const StudioFlowPanel: React.FC<StudioFlowPanelProps> = ({
  scenario,
  activeStepIndex,
  onStepChange,
  onClose,
}) => {
  const steps = scenario.flowSteps;
  const activeStep = steps[activeStepIndex] ?? steps[0];
  const canGoPrev = activeStepIndex > 0;
  const canGoNext = activeStepIndex < steps.length - 1;

  if (!activeStep) return null;

  return (
    <div className="absolute left-4 right-4 bottom-4 z-40 pointer-events-auto">
      <div className="rounded-2xl border border-cyan-500/25 bg-slate-950/90 shadow-2xl shadow-cyan-950/20 backdrop-blur-md overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-800/70">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">
              <GitBranch className="w-3.5 h-3.5" />
              Studio Data Flow · {scenario.algorithm.toUpperCase()}
            </div>
            <h3 className="mt-1 text-sm font-semibold text-slate-100 truncate">{scenario.title}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400 max-w-4xl">{scenario.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-100 hover:bg-slate-800/70 transition-colors"
            title="Tutup flow panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-[auto,1fr,auto] gap-3 px-4 py-3 items-center">
          <button
            type="button"
            onClick={() => canGoPrev && onStepChange(activeStepIndex - 1)}
            disabled={!canGoPrev}
            className="p-2 rounded-xl border border-slate-700/60 text-slate-400 hover:text-white hover:border-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Flow sebelumnya"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[11px] font-bold text-cyan-300">
                {activeStepIndex + 1}
              </span>
              <div className="text-sm font-semibold text-slate-100 truncate">{activeStep.title}</div>
              <div className="ml-auto hidden md:flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2 py-0.5">
                <Sparkles className="w-3 h-3" />
                node dan koneksi aktif sedang disorot
              </div>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{activeStep.description}</p>
          </div>

          <button
            type="button"
            onClick={() => canGoNext && onStepChange(activeStepIndex + 1)}
            disabled={!canGoNext}
            className="p-2 rounded-xl border border-slate-700/60 text-slate-400 hover:text-white hover:border-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Flow berikutnya"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 px-4 pb-3 overflow-x-auto">
          {steps.map((step, index) => {
            const active = index === activeStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(index)}
                className={`h-1.5 rounded-full shrink-0 transition-all ${
                  active ? 'w-16 bg-cyan-300 shadow-lg shadow-cyan-500/30' : 'w-8 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`${index + 1}. ${step.title}`}
                aria-label={`Pilih flow ${index + 1}: ${step.title}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
