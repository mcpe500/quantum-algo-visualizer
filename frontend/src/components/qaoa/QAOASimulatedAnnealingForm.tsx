/**
 * Form subcomponent for QAOA Simulated Annealing.
 * Pure rendering — no state logic.
 */

import type { Matrix } from '../../engine/qaoa/simulated-annealing';
import type { QaoaSAFormState } from '../hooks/useQaoaSAController';

interface QAOASimulatedAnnealingFormProps {
  form: QaoaSAFormState;
  matrixPreview: {
    nodeCount: number;
    edgeCount: number;
    label: string;
  } | null;
  error: string;
  onFormChange: (patch: Partial<QaoaSAFormState>) => void;
  onRun: () => void;
  onReset: () => void;
  onLoadBenchmark: () => void;
}

export function QAOASimulatedAnnealingForm({
  form,
  matrixPreview,
  error,
  onFormChange,
  onRun,
  onReset,
  onLoadBenchmark,
}: QAOASimulatedAnnealingFormProps) {
  return (
    <section className="bg-white text-gray-800 p-6 rounded-xl shadow-lg border border-indigo-200 max-w-4xl mx-auto qaoa-sa-no-print">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-end mb-2 gap-3">
            <label className="text-sm font-bold text-gray-600 uppercase">Input Adjacency Matrix (JSON)</label>
            <div className="flex flex-wrap gap-2 shrink-0 justify-end">
              <button
                type="button"
                onClick={onLoadBenchmark}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold transition"
              >
                Dataset Aktif
              </button>
            </div>
          </div>
          <textarea
            value={form.jsonInput}
            onChange={(event) => onFormChange({ jsonInput: event.target.value })}
            className="w-full h-40 p-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            spellCheck={false}
          />
          {matrixPreview && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                Node: <span className="font-mono font-bold">{matrixPreview.nodeCount}</span> | Edge:{' '}
                <span className="font-mono font-bold">{matrixPreview.edgeCount}</span>
              </p>
              <p className="mt-1 leading-relaxed">Edges: {matrixPreview.label || 'tidak ada edge'}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase mb-3">Parameter Simulasi</p>
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="block text-xs font-semibold text-gray-500 mb-1">T Awal</span>
                <input
                  type="number"
                  value={form.initialTemperature}
                  step="0.1"
                  onChange={(event) => onFormChange({ initialTemperature: event.target.value })}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm"
                />
              </label>
              <label>
                <span className="block text-xs font-semibold text-gray-500 mb-1">Cooling Rate (alpha)</span>
                <input
                  type="number"
                  value={form.alpha}
                  step="0.05"
                  onChange={(event) => onFormChange({ alpha: event.target.value })}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm"
                />
              </label>
              <label>
                <span className="block text-xs font-semibold text-gray-500 mb-1">T Minimum</span>
                <input
                  type="number"
                  value={form.minTemperature}
                  step="0.01"
                  onChange={(event) => onFormChange({ minTemperature: event.target.value })}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm"
                />
              </label>
              <label>
                <span className="block text-xs font-semibold text-gray-500 mb-1">Max Step Limit</span>
                <input
                  type="number"
                  value={form.maxSteps}
                  onChange={(event) => onFormChange({ maxSteps: event.target.value })}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm"
                />
              </label>
              <label className="col-span-2">
                <span className="block text-xs font-semibold text-gray-500 mb-1">Seed Reproduksi</span>
                <input
                  type="number"
                  value={form.seed}
                  onChange={(event) => onFormChange({ seed: event.target.value })}
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm"
                />
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onRun}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-md transition active:scale-95 uppercase tracking-wider"
            >
              Jalankan Simulasi
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-lg shadow-md transition active:scale-95 uppercase tracking-wider text-xs"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
