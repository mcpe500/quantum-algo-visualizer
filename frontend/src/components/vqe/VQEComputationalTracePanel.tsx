import { ArrowRight, BookOpen, CheckCircle2, Cpu, ListTree, Sigma } from 'lucide-react';
import type {
  VQEComputationalTrace,
  VQEComputationalTraceStep,
  VQEComputationalTraceTrack,
  VQEComputationalTraceValue,
} from '../../types/vqe';
import { SectionCard } from '../layout';
import { VQECard, VQE_TYPOGRAPHY } from './layout';

interface VQEComputationalTracePanelProps {
  trace: VQEComputationalTrace;
}

const toneClasses = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  purple: 'border-purple-200 bg-purple-50 text-purple-800',
  red: 'border-red-200 bg-red-50 text-red-800',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
} as const;

const phaseClasses = {
  input: 'bg-blue-100 text-blue-700',
  orbital: 'bg-emerald-100 text-emerald-700',
  configuration: 'bg-amber-100 text-amber-700',
  hamiltonian: 'bg-purple-100 text-purple-700',
  diagonalization: 'bg-emerald-100 text-emerald-700',
  reference: 'bg-slate-100 text-slate-700',
  parse: 'bg-blue-100 text-blue-700',
  mapping: 'bg-purple-100 text-purple-700',
  ansatz: 'bg-emerald-100 text-emerald-700',
  expectation: 'bg-slate-100 text-slate-700',
  optimization: 'bg-amber-100 text-amber-700',
  shots: 'bg-indigo-100 text-indigo-700',
  comparison: 'bg-red-100 text-red-700',
} as const;

function getToneClass(tone?: string): string {
  return toneClasses[tone as keyof typeof toneClasses] ?? toneClasses.slate;
}

function getPhaseClass(phase: string): string {
  return phaseClasses[phase as keyof typeof phaseClasses] ?? 'bg-slate-100 text-slate-700';
}

function MetricPill({ value }: { value: VQEComputationalTraceValue }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${getToneClass(value.tone)}`}>
      <div className="text-[9px] font-black uppercase tracking-wide opacity-70">{value.label}</div>
      <div className="mt-0.5 font-mono text-xs font-bold">{value.value}</div>
    </div>
  );
}

function PauliTerms({ step }: { step: VQEComputationalTraceStep }) {
  if (!step.pauli_terms?.length) return null;
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className={`${VQE_TYPOGRAPHY.tiny} mb-2`}>Pauli terms</div>
      <div className="flex flex-wrap gap-1.5">
        {step.pauli_terms.map((term) => (
          <span
            key={`${step.step}-${term.pauli}-${term.coefficient}`}
            className="rounded-md border border-purple-100 bg-purple-50 px-2 py-1 font-mono text-[10px] font-bold text-purple-800"
          >
            {term.text}
          </span>
        ))}
      </div>
    </div>
  );
}

function MatrixPreview({ step }: { step: VQEComputationalTraceStep }) {
  if (!step.matrix_preview) return null;
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className={VQE_TYPOGRAPHY.tiny}>Matrix preview</div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600">
          {step.matrix_preview.dimension}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-[10px] font-mono">
          <tbody>
            {step.matrix_preview.rows.map((row, rowIndex) => (
              <tr key={`${step.step}-row-${rowIndex}`}>
                {row.map((cell, colIndex) => (
                  <td key={`${step.step}-${rowIndex}-${colIndex}`} className="border border-slate-100 px-2 py-1 text-right text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {step.matrix_preview.truncated && (
        <div className="mt-2 text-[10px] font-semibold text-slate-400">
          Preview dipotong untuk menjaga tampilan; diagonalization memakai matriks penuh.
        </div>
      )}
    </div>
  );
}

function TraceStepCard({ step, accent }: { step: VQEComputationalTraceStep; accent: 'blue' | 'purple' }) {
  const accentClass = accent === 'blue' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white';
  return (
    <VQECard compact className="relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full w-1 ${accent === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`} />
      <div className="flex items-start gap-3 pl-2">
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${accentClass}`}>
          {step.step}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-black text-slate-900">{step.title}</h4>
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${getPhaseClass(step.phase)}`}>
              {step.phase}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600">{step.summary}</p>

          {step.formula && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs font-bold text-slate-800">
              {step.formula}
            </div>
          )}

          {step.calculation.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {step.calculation.map((line) => (
                <div key={`${step.step}-${line}`} className="flex items-start gap-2 text-xs text-slate-700">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                  <span className="font-mono">{line}</span>
                </div>
              ))}
            </div>
          )}

          {step.values.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
              {step.values.map((value) => (
                <MetricPill key={`${step.step}-${value.label}`} value={value} />
              ))}
            </div>
          )}

          <PauliTerms step={step} />
          <MatrixPreview step={step} />

          {step.result && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold leading-relaxed text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{step.result}</span>
            </div>
          )}
        </div>
      </div>
    </VQECard>
  );
}

function TraceTrack({ track, accent }: { track: VQEComputationalTraceTrack; accent: 'blue' | 'purple' }) {
  const Icon = accent === 'blue' ? BookOpen : Cpu;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${accent === 'blue' ? 'text-blue-600' : 'text-purple-600'}`} />
        <h3 className="text-base font-black text-slate-900">{track.title}</h3>
      </div>
      {track.steps.map((step) => (
        <TraceStepCard key={`${track.title}-${step.step}`} step={step} accent={accent} />
      ))}
    </div>
  );
}

function IterationTrace({ trace }: { trace: VQEComputationalTrace }) {
  if (trace.iteration_trace.length === 0) return null;
  return (
    <VQECard>
      <div className="mb-3 flex items-center gap-2">
        <Sigma className="h-5 w-5 text-amber-600" />
        <h3 className="text-base font-black text-slate-900">Optimizer Checkpoint Trace</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3">Iteration</th>
              <th className="py-2 pr-3">Energy (Ha)</th>
              <th className="py-2 pr-3">Parameter θ</th>
            </tr>
          </thead>
          <tbody>
            {trace.iteration_trace.map((item) => (
              <tr key={`iter-${item.iteration}`} className="border-b border-slate-100">
                <td className="py-2 pr-3 font-mono font-bold text-slate-800">{item.iteration}</td>
                <td className="py-2 pr-3 font-mono text-slate-700">{item.energy.toFixed(6)}</td>
                <td className="py-2 pr-3 font-mono text-[11px] text-slate-500">
                  [{item.parameters.map((param) => param.toFixed(4)).join(', ')}]
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VQECard>
  );
}

function ComparisonStrip({ trace }: { trace: VQEComputationalTrace }) {
  const items: VQEComputationalTraceValue[] = [
    { label: 'E_FCI', value: `${trace.comparison.fci_energy.toFixed(6)} Ha`, tone: 'emerald' },
    { label: 'E_VQE', value: `${trace.comparison.vqe_energy.toFixed(6)} Ha`, tone: 'blue' },
    { label: 'Error', value: `${trace.comparison.energy_error.toFixed(6)} Ha`, tone: 'red' },
    { label: 'Accuracy', value: `${trace.comparison.accuracy_percent.toFixed(2)}%`, tone: 'emerald' },
    { label: 'Matrix', value: trace.comparison.matrix_size, tone: 'slate' },
    { label: 'Pauli terms', value: String(trace.comparison.pauli_terms), tone: 'purple' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <MetricPill key={item.label} value={item} />
      ))}
    </div>
  );
}

export function VQEComputationalTracePanel({ trace }: VQEComputationalTracePanelProps) {
  return (
    <SectionCard title="Computational Trace: FCI + VQE" icon={<ListTree className="h-5 w-5" />}>
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className={VQE_TYPOGRAPHY.tiny}>{trace.case_id}</div>
              <h2 className="mt-1 text-lg font-black text-slate-950">{trace.title}</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 font-mono text-[10px] font-black text-slate-600 shadow-sm">
              {trace.comparison.shots.toLocaleString()} shots
            </span>
          </div>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{trace.summary}</p>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-amber-700">{trace.numerical_policy}</p>
        </div>

        <ComparisonStrip trace={trace} />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <TraceTrack track={trace.fci} accent="blue" />
          <TraceTrack track={trace.vqe} accent="purple" />
        </div>

        <IterationTrace trace={trace} />
      </div>
    </SectionCard>
  );
}
