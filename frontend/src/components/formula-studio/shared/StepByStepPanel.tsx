import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormulaDefinition, ComputationStep } from '../types';
import { X, Play, ChevronLeft, ChevronRight, RotateCcw, Info } from 'lucide-react';
import { FormulaDisplay } from './FormulaDisplay';

interface StepByStepPanelProps {
  formula: FormulaDefinition;
  onClose: () => void;
}

function toTitle(param: string): string {
  return param
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (ch) => ch.toUpperCase());
}

export const StepByStepPanel: React.FC<StepByStepPanelProps> = ({ formula, onClose }) => {
  const params = useMemo(() => formula.computation?.requiresParams ?? [], [formula.computation]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((param) => [param, '']))
  );
  const [steps, setSteps] = useState<ComputationStep[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const current = steps[activeStep] ?? null;
  const canRun = useMemo(
    () => params.every((param) => values[param] !== '' && Number.isFinite(Number(values[param]))),
    [params, values]
  );

  const runComputation = useCallback(() => {
    if (!formula.computation) return;
    const parsedParams: Record<string, number> = {};
    for (const param of params) {
      const value = Number(values[param]);
      if (!Number.isFinite(value)) {
        setError(`Parameter '${param}' harus berupa angka valid.`);
        return;
      }
      parsedParams[param] = value;
    }

    try {
      const resultSteps = formula.computation.steps(parsedParams);
      setSteps(resultSteps);
      setActiveStep(0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Computation failed');
    }
  }, [formula.computation, params, values]);

  const reset = () => {
    setActiveStep(0);
    setSteps([]);
    setError(null);
    setIsPlaying(false);
  };

  const goNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const goPrev = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;
    if (activeStep >= steps.length - 1) {
      queueMicrotask(() => setIsPlaying(false));
      return;
    }
    const timer = setTimeout(() => {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 1200);
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, steps.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowRight') {
        goNext();
        return;
      }
      if (e.key === 'ArrowLeft') {
        goPrev();
        return;
      }
      if (e.key === ' ' && steps.length > 0) {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, onClose, steps.length]);

  if (!formula.computation) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-slate-100 text-lg font-semibold">Step-by-Step Computation</h3>
              <p className="text-xs text-slate-400 mt-1">{formula.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-slate-800/50">
              <Info className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <p className="text-slate-200 font-medium mb-1">Tidak tersedia untuk formula ini</p>
              <p className="text-slate-500 text-sm">
                Formula dengan definisi matriks atau persamaan tidak memiliki konfigurasi komputasi step-by-step.
                Gunakan Studio untuk memvisualisasikan hubungan antar formula.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/70"
              type="button"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-cyan-400 text-xs font-medium">
                {current ? `Step ${activeStep + 1} / ${steps.length}` : 'Ready'}
              </span>
            </div>
            <div>
              <h3 className="text-slate-100 text-lg font-semibold leading-tight">{formula.title}</h3>
              <p className="text-xs text-slate-500">Step-by-Step Computation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 border-b border-slate-800 space-y-4">
          {params.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {params.map((param) => (
                <label key={param} className="text-xs text-slate-300 space-y-1">
                  <span className="block font-medium">{toTitle(param)}</span>
                  <input
                    value={values[param] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [param]: e.target.value }))}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm"
                    placeholder="0"
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Formula ini tidak memerlukan parameter input.</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={runComputation}
              disabled={params.length > 0 && !canRun}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              Run
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/70"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            {steps.length > 0 && (
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/70"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{error}</p>
          )}

          {steps.length > 0 && (
            <div className="flex items-center gap-1.5">
              {steps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    index === activeStep
                      ? 'w-6 bg-cyan-400'
                      : index < activeStep
                      ? 'w-3 bg-cyan-500/50'
                      : 'w-3 bg-slate-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {steps.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="text-slate-600 text-4xl">⚡</div>
              <p className="text-slate-400 text-sm">Masukkan parameter dan klik Run untuk memulai komputasi.</p>
              <p className="text-slate-600 text-xs">Hint: Gunakan ← → untuk navigasi step, Space untuk play/pause, Esc untuk tutup.</p>
            </div>
          )}

          {current && (
            <div
              key={activeStep}
              className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4 animate-fade-in"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    Step {current.step}
                  </span>
                  <span className="text-xs text-slate-500">
                    {current.explanation}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={activeStep === 0}
                    className="p-1.5 rounded text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={activeStep >= steps.length - 1}
                    className="p-1.5 rounded text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-5 text-center">
                <FormulaDisplay latex={current.latex} displayMode fontSize="1.5rem" />
              </div>

              {current.result && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-mono">
                  Result: {current.result}
                </div>
              )}
            </div>
          )}

          {steps.length > 1 && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 uppercase tracking-wide font-medium">Semua Steps</div>
              <div className="grid gap-1.5">
                {steps.map((step, index) => (
                  <button
                    key={`${step.step}-${index}`}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`text-left px-3 py-2 rounded border text-xs transition-colors ${
                      index === activeStep
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/70 hover:text-slate-300'
                    }`}
                  >
                    <span className="font-medium">{step.step}.</span> {step.explanation}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 150ms ease-out;
        }
      `}</style>
    </div>
  );
};
