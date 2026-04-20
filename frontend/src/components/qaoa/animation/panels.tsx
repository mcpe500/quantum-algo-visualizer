import { ChevronRight } from 'lucide-react';
import { GraphVisualization } from '../../charts/GraphVisualization';
import { DetailCard } from '../../../shared/components/DetailCard';
import type {
  QAOAAnimationCheckpoint,
  QAOAAnimationPayload,
  QAOAAnimationStep,
} from '../../../types/qaoa';
import { CHECKPOINT_LABEL, PHASE_COLOR, PHASE_LABEL } from './constants';
import { buildHybridLoopModel } from './hybrid-loop';
import { formatPercent, formatRadians, getActivePhases, getPartitionFromBitstring } from './helpers';
import { getStepExplanation, getStepHeadline } from './narration';

export { DetailCard };

export function CheckpointRail({
  checkpoints,
  activeCheckpointKey,
  onJump,
}: {
  checkpoints: QAOAAnimationCheckpoint[];
  activeCheckpointKey: string;
  onJump: (checkpointKey: string) => void;
}) {
  return (
    <div className="px-4 pt-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Checkpoint Optimizer</p>
      <div className="mt-2 flex items-center gap-2 overflow-x-auto">
        {checkpoints.map((checkpoint, index) => {
          const isActive = checkpoint.key === activeCheckpointKey;
          return (
            <div key={checkpoint.key} className="flex items-center gap-2 shrink-0">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
              <button
                onClick={() => onJump(checkpoint.key)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {CHECKPOINT_LABEL[checkpoint.kind] || checkpoint.label}
                <span className="ml-1 opacity-80">iter {checkpoint.eval_index}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PhaseStepper({
  data,
  activeStep,
  onJump,
}: {
  data: QAOAAnimationPayload;
  activeStep: QAOAAnimationStep;
  onJump: (phase: string) => void;
}) {
  const phases = getActivePhases(data, activeStep.checkpoint_key);

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {phases.map((phase, index) => {
          const isActive = phase === activeStep.phase;
          return (
            <div key={phase} className="flex items-center gap-1.5 shrink-0">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
              <button
                onClick={() => onJump(phase)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
                style={isActive ? { borderColor: PHASE_COLOR[phase], backgroundColor: PHASE_COLOR[phase] } : undefined}
              >
                {PHASE_LABEL[phase] || phase}
              </button>
            </div>
          );
        })}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Step Aktif</p>
        <p className="mt-1 text-[15px] font-semibold text-slate-900">
          Step {activeStep.step + 1} · {activeStep.operation}
        </p>
        <p className="mt-1 text-[13px] leading-6 text-slate-600">{getStepExplanation(activeStep)}</p>
      </div>
    </div>
  );
}

export function ReadingGuideCard({ step }: { step: QAOAAnimationStep }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Reading Guide</p>
      <p className="mt-1 text-[15px] font-semibold text-slate-900">{getStepHeadline(step)}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-slate-600">{getStepExplanation(step)}</p>
    </div>
  );
}

export function ProblemGraphPanel({ data }: { data: QAOAAnimationPayload }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Problem Graph</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <DetailCard label="Nodes" value={`${data.n_nodes}`} hint="Dari dataset" />
          <DetailCard label="Edges" value={`${data.n_edges}`} hint="Graf Max-Cut" />
          <DetailCard label="p" value={`${data.p_layers}`} hint="Ansatz layer" />
          <DetailCard label="Shots" value={`${data.shots}`} hint="Sesuai proposal" />
        </div>
        <GraphVisualization nodes={data.nodes} edges={data.edges} />
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-blue-700">{data.hamiltonian.label}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{data.hamiltonian.formula}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.hamiltonian.terms.map((term) => (
              <span
                key={`${term.edge[0]}-${term.edge[1]}`}
                className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-mono text-slate-600"
              >
                ({term.edge[0]}, {term.edge[1]}) {'->'} {term.pauli}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HybridLoopPanel({ data, activeStep }: { data: QAOAAnimationPayload; activeStep: QAOAAnimationStep }) {
  const model = buildHybridLoopModel(data, activeStep);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hybrid Loop</p>
      <p className="mt-1 text-[15px] font-semibold text-slate-900">Optimizer klasik {'->'} evaluasi kuantum</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{model.intro}</p>

      {model.activeCheckpoint && (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-700">{model.activeCheckpoint.label}</span>
            <span className="text-[10px] font-medium text-blue-600">iter {model.activeCheckpoint.eval_index}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {model.activeCheckpoint.gamma.map((gamma, index) => (
              <span key={`g-${index}`} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-mono text-blue-700">
                gamma{index + 1}={gamma.toFixed(3)}
              </span>
            ))}
            {model.activeCheckpoint.beta.map((beta, index) => (
              <span key={`b-${index}`} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-mono text-teal-700">
                beta{index + 1}={beta.toFixed(3)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {data.checkpoints.map((checkpoint) => {
          const width = model.bestExpected > 0 ? (checkpoint.expected_cut / model.bestExpected) * 100 : 0;
          const isActive = checkpoint.key === activeStep.checkpoint_key;
          return (
            <div key={checkpoint.key} className={`rounded-lg border px-3 py-2 ${isActive ? 'border-blue-300 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-800">{checkpoint.label}</span>
                <span className="text-[10px] font-mono text-slate-500">{checkpoint.expected_cut.toFixed(3)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(8, width)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CostMixerPanel({ activeStep }: { activeStep: QAOAAnimationStep }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cost + Mixer</p>
      <p className="mt-1 text-[15px] font-semibold text-slate-900">{activeStep.operation}</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{activeStep.description}</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Layer</p>
          <p className="text-sm font-bold text-slate-900">{activeStep.layer ?? '-'}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Phase</p>
          <p className="text-sm font-bold text-slate-900">{PHASE_LABEL[activeStep.phase] || activeStep.phase}</p>
        </div>
      </div>

      {activeStep.edge && (
        <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-orange-700">Edge aktif</p>
          <p className="mt-1 text-[11px] text-orange-700">({activeStep.edge[0]}, {activeStep.edge[1]}) pada Hamiltonian cost.</p>
        </div>
      )}

      {activeStep.target_qubit !== undefined && (
        <div className="mt-3 rounded-lg border border-teal-100 bg-teal-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-teal-700">Qubit aktif</p>
          <p className="mt-1 text-[11px] text-teal-700">q{activeStep.target_qubit} dengan sudut {formatRadians((activeStep.beta[0] ?? 0) * 2)}</p>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {activeStep.qubit_summaries.map((summary) => (
          <div key={summary.qubit} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700">q{summary.qubit}</span>
              <span className="text-[10px] font-mono text-slate-500">p(1)={formatPercent(summary.p_one)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CutResultPanel({ data, activeStep }: { data: QAOAAnimationPayload; activeStep: QAOAAnimationStep }) {
  const activePartition = getPartitionFromBitstring(activeStep.candidate_bitstring, data.n_nodes);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cut Result</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <DetailCard label="Exact" value={`${data.exact.optimal_cut}`} hint="Optimum" />
          <DetailCard label="SA" value={`${data.classical.best_cut}`} hint="Comparator" />
          <DetailCard label="QAOA" value={`${data.quantum.best_cut}`} hint="Best quantum" />
        </div>
        <GraphVisualization nodes={data.nodes} edges={data.edges} partition={activePartition} />
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-800">Bitstring aktif</span>
            <span className="text-[10px] font-mono text-slate-500">{activeStep.candidate_bitstring ?? '-'}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600">Cut = {activeStep.cut_value ?? '-'} | expected cut = {activeStep.expected_cut.toFixed(3)}</p>
        </div>
        <div className="space-y-2">
          {activeStep.measurement_distribution.slice(0, 5).map((item) => (
            <div key={item.bitstring} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-700">{item.bitstring}</span>
                <span className="text-slate-500">cut {item.cut}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(8, item.probability * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}