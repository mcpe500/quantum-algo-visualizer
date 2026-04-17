import { ChevronRight } from 'lucide-react';
import type { DJAnimationPartition, DJAnimationPayload, DJAnimationStep } from '../../../types/dj';
import { MARKER_STYLE, PHASE_LABEL, PROFILE_LABEL } from './constants';
import { formatPercent } from './helpers';
import { getContextGlossary, getStepExplanation, getStepHeadline } from './narration';

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
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cara Baca Animasi</p>
      <p className="mt-2 text-[16px] font-semibold text-slate-900">{getStepHeadline(step)}</p>
      {step.comment && (
        <p className="mt-1 text-[13px] font-medium text-violet-600">{step.comment}</p>
      )}
      <p className="mt-2 text-[14px] leading-7 text-slate-600">{getStepExplanation(step, totalSteps)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {notes.map((note) => (
          <span key={note} className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] leading-5 text-slate-600">
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StateSummaryPanel({ step, nQubits }: { step: DJAnimationStep; nQubits: number }) {
  if (!step.bloch_states || step.bloch_states.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ringkasan State</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-1.5 pr-3 font-semibold text-slate-500">Qubit</th>
              <th className="pb-1.5 pr-3 font-semibold text-slate-500">State</th>
              <th className="pb-1.5 pr-3 font-semibold text-slate-500">θ</th>
              <th className="pb-1.5 pr-3 font-semibold text-slate-500">φ</th>
              <th className="pb-1.5 pr-3 font-semibold text-slate-500">P(|0⟩)</th>
              <th className="pb-1.5 font-semibold text-slate-500">P(|1⟩)</th>
            </tr>
          </thead>
          <tbody>
            {step.bloch_states.map((bs, i) => {
              const p0 = (1 + bs.bz) / 2;
              const p1 = 1 - p0;
              const label = i < nQubits ? `q${i}` : 'anc';
              const stateColor = Math.abs(bs.bz - 1) < 0.05
                ? 'text-blue-600'
                : Math.abs(bs.bz + 1) < 0.05
                  ? 'text-orange-600'
                  : 'text-violet-600';
              return (
                <tr key={`state-${i}`} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3 font-mono text-slate-700">{label}</td>
                  <td className={`py-1.5 pr-3 font-semibold ${stateColor}`}>{bs.label}</td>
                  <td className="py-1.5 pr-3 text-slate-600">{(bs.theta * 180 / Math.PI).toFixed(0)}°</td>
                  <td className="py-1.5 pr-3 text-slate-600">{(bs.phi * 180 / Math.PI).toFixed(0)}°</td>
                  <td className="py-1.5 pr-3 text-slate-600">{formatPercent(p0)}</td>
                  <td className="py-1.5 text-slate-600">{formatPercent(p1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DetailCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-[16px] font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[12px] leading-5 text-slate-600">{hint}</p>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Dataset JSON Render</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <DetailCard label="Profil" value={PROFILE_LABEL[data.oracle_summary.profile]} hint="Diambil langsung dari sebaran 0 dan 1 pada truth table." />
        <DetailCard label="Truth Table" value={`${data.oracle_summary.total_inputs} input`} hint={`1 sebanyak ${data.oracle_summary.ones_count}, 0 sebanyak ${data.oracle_summary.zeros_count}.`} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
        <div className="grid grid-cols-[1fr_72px_88px] gap-2 border-b border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span>Input</span>
          <span>f(x)</span>
          <span>Status</span>
        </div>
        <div className="max-h-[340px] overflow-auto px-2 py-2">
          {data.truth_table.map((entry) => {
            const isActive = activeBits === entry.input;
            return (
              <div
                key={entry.input}
                className={`grid grid-cols-[1fr_72px_88px] items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors ${
                  isActive
                    ? 'bg-violet-100 ring-1 ring-violet-300'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <span className="font-mono font-semibold tracking-[0.2em] text-slate-800">{entry.input}</span>
                <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[12px] font-semibold ${entry.output === 1 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {entry.output}
                </span>
                <span className="text-[12px] text-slate-500">{isActive ? 'sedang dipakai' : 'dataset'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function FinalAmplitudePanel({ data }: { data: DJAnimationPayload }) {
  const topStates = [...data.input_probabilities]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 6);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Distribusi Input Setelah Interferensi</p>
      <div className="mt-3 space-y-2">
        {topStates.map((entry) => (
          <div key={entry.input_bits}>
            <div className="flex items-center justify-between text-[13px] text-slate-700">
              <span className="font-mono font-semibold tracking-[0.18em]">{entry.input_bits}</span>
              <span>{formatPercent(entry.probability)}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(entry.probability * 100, 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MeasurementPanel({ data }: { data: DJAnimationPayload }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Measurement Nyata</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1.5 text-[13px] font-semibold text-white ${data.measurement.classification === 'CONSTANT' ? 'bg-blue-600' : 'bg-orange-600'}`}>
          {data.measurement.classification}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-600">{data.measurement.shots} shots</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(data.measurement.counts).map(([state, count]) => (
          <span key={state} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[12px] text-slate-700">
            |{state}⟩ : {count}
          </span>
        ))}
      </div>
    </div>
  );
}
