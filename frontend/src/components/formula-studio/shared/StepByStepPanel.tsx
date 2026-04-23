import React, { useMemo, useState } from 'react';
import type { FormulaDefinition, ComputationStep } from '../types';
import { X, Play, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
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
  const params = formula.computation?.requiresParams ?? [];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(params.map((param) => [param, '']))
  );
  const [steps, setSteps] = useState<ComputationStep[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const current = steps[activeStep] ?? null;
  const canRun = useMemo(
    () => params.every((param) => values[param] !== '' && Number.isFinite(Number(values[param]))),
    [params, values]
  );

  const runComputation = () => {
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
  };

  const reset = () => {
    setActiveStep(0);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
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

        <div className="p-5 border-b border-slate-800 space-y-4">
          {params.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {params.map((param) => (
                <label key={param} className="text-xs text-slate-300 space-y-1">
                  <span className="block">{toTitle(param)}</span>
                  <input
                    value={values[param] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [param]: e.target.value }))}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded text-slate-100"
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
          </div>

          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {steps.length === 0 && <p className="text-sm text-slate-400">Run computation to generate steps.</p>}

          {current && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-cyan-300">
                  Step {current.step} / {steps.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
                    disabled={activeStep === 0}
                    className="p-1.5 rounded text-slate-300 bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))}
                    disabled={activeStep >= steps.length - 1}
                    className="p-1.5 rounded text-slate-300 bg-slate-800 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 text-center">
                <FormulaDisplay latex={current.latex} displayMode fontSize="1.2rem" />
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{current.explanation}</p>

              {current.result && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                  Result: {current.result}
                </div>
              )}
            </div>
          )}

          {steps.length > 1 && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 uppercase tracking-wide">All Steps</div>
              <div className="grid gap-2">
                {steps.map((step, index) => (
                  <button
                    key={`${step.step}-${index}`}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`text-left px-3 py-2 rounded border text-xs transition-colors ${
                      index === activeStep
                        ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/70'
                    }`}
                  >
                    Step {step.step}: {step.explanation}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
