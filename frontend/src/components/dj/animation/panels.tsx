import { ChevronRight } from 'lucide-react';
import type { DJAnimationPartition, DJAnimationPayload, DJAnimationStep } from '../../../types/dj';
import { MARKER_STYLE, PHASE_LABEL, PROFILE_LABEL } from './constants';
import { formatPercent } from './helpers';
import { getContextGlossary, getStepExplanation, getStepHeadline } from './narration';
import { buildOracleConstructionModel } from './oracle-construction';

export function MarkerBadge({ marker }: { marker: string }) {
  const value = marker || '-';
  const classes = MARKER_STYLE[value] || 'bg-slate-50 text-slate-400 border-slate-200';
  return <span className={`inline-flex min-w-8 justify-center rounded border px-1.5 py-0.5 font-mono text-[11px] ${classes}`}>{value}</span>;
}

export function PhaseStepper({
  partitions,
  activePhase,
  activeStep,
  onJumpPhase,
  disabled,
}: {
  partitions: DJAnimationPartition[];
  activePhase: string;
  activeStep: DJAnimationStep;
  onJumpPhase: (phase: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="px-4 pb-4 pt-2 space-y-2">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {partitions.map((partition, index) => {
          const isActive = partition.phase === activePhase;
          return (
            <div key={`${partition.phase}-${partition.start_col}`} className="flex items-center gap-1.5 shrink-0">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
              <button
                onClick={() => onJumpPhase(partition.phase)}
                disabled={disabled}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                  isActive
                    ? 'border-violet-400 bg-violet-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {PHASE_LABEL[partition.phase] || partition.label}
                <span className="ml-1 opacity-80">({partition.count})</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Active Column</p>
        <p className="mt-1 text-[15px] font-semibold text-slate-900">Step {activeStep.step} · {activeStep.operation}</p>
        {activeStep.comment && (
          <p className="mt-1 text-[13px] font-medium text-violet-600">{activeStep.comment}</p>
        )}
        <p className="mt-1 text-[13px] leading-6 text-slate-600">{activeStep.description}</p>
      </div>
    </div>
  );
}

export function ActiveMarkerStrip({ step, nQubits }: { step: DJAnimationStep; nQubits: number }) {
  const labels = [...Array.from({ length: nQubits }, (_, index) => `q${index}`), 'ancilla'];

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {labels.map((label, index) => {
        const marker = index === nQubits ? step.ancilla_marker : step.wire_markers[String(index)] || '-';
        return (
          <span key={`${label}-${marker}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
            <span className="text-[11px] font-medium text-slate-500">{label}</span>
            <MarkerBadge marker={marker} />
          </span>
        );
      })}
    </div>
  );
}

export function ReadingGuideCard({ step, nQubits, totalSteps }: { step: DJAnimationStep; nQubits: number; totalSteps: number }) {
  const notes = getContextGlossary(step, nQubits);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cara Baca Animasi</h3>
      <h4 className="mt-1.5 text-[14px] font-semibold text-slate-900">{getStepHeadline(step)}</h4>
      {step.comment && (
        <p className="mt-1 text-[11px] font-medium text-indigo-600">{step.comment}</p>
      )}
      <p className="mt-2 text-[12px] text-slate-600 leading-relaxed">{getStepExplanation(step, totalSteps)}</p>
      <div className="mt-3 space-y-1.5">
        {notes.map((note) => (
          <div key={note} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 leading-relaxed">{note}</div>
        ))}
      </div>
    </div>
  );
}

export function StateSummaryPanel({ step, nQubits }: { step: DJAnimationStep; nQubits: number }) {
  if (!step.bloch_states || step.bloch_states.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ringkasan State</h3>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] text-gray-400 border-b border-gray-100 bg-white">
            <th className="px-4 py-2 font-medium">Qubit</th>
            <th className="px-4 py-2 font-medium">State</th>
            <th className="px-4 py-2 text-right font-medium">P(|0⟩)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {step.bloch_states.map((bs, i) => {
            const p0 = (1 + bs.bz) / 2;
            const label = i < nQubits ? `q${i}` : 'anc';
            const stateColor = Math.abs(bs.bz - 1) < 0.05
              ? 'text-blue-600'
              : Math.abs(bs.bz + 1) < 0.05
                ? 'text-orange-600'
                : 'text-indigo-600';
            return (
              <tr key={`state-${i}`} className="bg-white">
                <td className="px-4 py-1.5 text-[11px] text-gray-600">{label}</td>
                <td className={`px-4 py-1.5 text-[11px] font-semibold ${stateColor}`}>{bs.label}</td>
                <td className="px-4 py-1.5 text-[11px] text-gray-600 text-right">{formatPercent(p0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DetailCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-base font-bold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{hint}</p>
    </div>
  );
}

export function TruthTablePanel({
  data,
  activeBits,
}: {
  data: DJAnimationPayload;
  activeBits: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dataset JSON Render</p>
      </div>
      <div className="p-3 grid grid-cols-2 gap-3 border-b border-slate-100">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Profil</p>
          <p className="text-sm font-bold text-slate-900">{PROFILE_LABEL[data.oracle_summary.profile]}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Truth Table</p>
          <p className="text-sm font-bold text-slate-900">{data.oracle_summary.total_inputs} input</p>
        </div>
      </div>
      <div className="max-h-[200px] overflow-y-auto px-4 py-3">
        <table className="w-full text-left table-fixed border-collapse align-middle">
          <colgroup>
            <col style={{ width: '60%' }} />
            <col style={{ width: '72px' }} />
            <col style={{ width: 'auto' }} />
          </colgroup>
          <thead>
            <tr className="text-[10px] text-slate-400 border-b border-slate-100">
              <th className="px-2 py-2 font-medium text-left">Input</th>
              <th className="px-2 py-2 text-center font-medium">f(x)</th>
              <th className="px-2 py-2 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.truth_table.map((entry) => {
              const isActive = activeBits === entry.input;
              return (
                <tr key={entry.input} className={`text-xs ${isActive ? 'bg-amber-50' : ''}`}>
                  <td className="px-2 py-2 align-middle font-mono text-slate-600 tracking-wider">{entry.input}</td>

                  <td className="px-2 py-2 text-center align-middle">
                    <div className={`flex items-center justify-center w-6 h-6 mx-auto rounded-full text-[12px] font-semibold ${entry.output === 1 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'}`}>
                      {entry.output}
                    </div>
                  </td>

                  <td className="px-2 py-2 text-right text-[10px] text-slate-400 align-middle">
                    <div className="inline-flex items-center justify-end">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${isActive ? 'bg-slate-200 text-slate-800' : 'bg-slate-50 text-slate-500'}`}>{isActive ? 'aktif' : 'dataset'}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OracleConstructionPanel({
  data,
  activeBits,
}: {
  data: DJAnimationPayload;
  activeBits: string | null;
}) {
  const model = buildOracleConstructionModel(data, activeBits);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Truth Table → Oracle</p>
      <p className="mt-1 text-[15px] font-semibold text-gray-900">Konstruksi Oracle dari Dataset</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600">{model.intro}</p>

      {model.overviewBlock && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-600">{model.overviewBlock.label}</span>
            <span className="text-[10px] font-medium text-gray-500">{model.overviewBlock.gateCount} gate</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-600 leading-relaxed">{model.overviewBlock.content}</p>
        </div>
      )}

      {model.rows.length > 0 ? (
        <div className="mt-3 space-y-2">
          {model.rows.map((row) => {
            const isActive = activeBits === row.inputBits;
            return (
              <div
                key={row.inputBits}
                className={`rounded-lg border px-3 py-2.5 transition-all ${
                  isActive
                    ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                      {row.stepNumber}
                    </span>
                    <span className="font-mono text-[12px] font-semibold tracking-wider text-gray-800">{row.inputBits}</span>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                    {row.gateSequence}
                  </span>
                </div>

                {isActive && (
                  <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                    {row.subSteps.map((step) => (
                      <div key={step.phase} className="rounded-md border border-indigo-100 bg-white px-2 py-1.5 text-center">
                        <p className="text-[9px] font-semibold text-indigo-600 uppercase tracking-wide">{step.phase}</p>
                        <p className="mt-0.5 text-[10px] font-bold text-gray-800">{step.gate}</p>
                        <p className="mt-0.5 text-[9px] text-gray-500 leading-tight">{step.affected}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.zeroControls.length > 0 ? (
                    row.zeroControls.map((qc) => (
                      <span key={qc} className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        {qc}=0 flip
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      semua bit 1, skip flip
                    </span>
                  )}
                </div>

                {isActive && (
                  <p className="mt-2 text-[11px] text-gray-500">{row.intro}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
          <p className="text-[11px] text-gray-600 leading-relaxed">
            {model.gateSummary}
          </p>
        </div>
      )}
    </div>
  );
}

export function MeasurementPanel({ data }: { data: DJAnimationPayload }) {
  const topStates = [...data.input_probabilities]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 4);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Measurement</h3>
      </div>
      <div className="p-3 flex flex-wrap items-center gap-2 border-b border-gray-100">
        <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold text-white ${data.measurement.classification === 'CONSTANT' ? 'bg-blue-600' : 'bg-orange-600'}`}>
          {data.measurement.classification}
        </span>
        <span className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] text-gray-600">{data.measurement.shots} shots</span>
      </div>
      <div className="p-3 space-y-2">
        {topStates.map((entry) => (
          <div key={entry.input_bits}>
            <div className="flex items-center justify-between text-[11px] text-gray-700">
              <span className="font-mono font-semibold tracking-wider">{entry.input_bits}</span>
              <span className="text-gray-500">{formatPercent(entry.probability)}</span>
            </div>
            <div className="mt-0.5 h-1.5 rounded-full bg-gray-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(entry.probability * 100, 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
