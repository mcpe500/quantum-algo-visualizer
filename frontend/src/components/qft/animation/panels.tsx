import type {
  QFTAnimationPayload,
  QFTAnimationStep,
} from '../../../types/qft';
import { SIGNAL_TYPE_LABEL } from './constants';
import { formatRadians } from '../../../shared/utils/animation-helpers';
import { getContextGlossary, getStepExplanation, getStepHeadline } from './narration';
import { buildPhaseCascadeModel } from './phase-cascade';
import { PhaseWheelStack } from './phase-wheel';
export { DetailCard } from '../../../shared/components/DetailCard';
export { PhaseStepper } from '../../../shared/components/PhaseStepper';
import { ReadingGuideCard as SharedReadingGuideCard } from '../../../shared/components/ReadingGuideCard';
import { ProbabilityBarList } from '../../../shared/components/ProbabilityBarList';

export function SignalInputPanel({ data }: { data: QFTAnimationPayload }) {
  const signalType = SIGNAL_TYPE_LABEL[data.signal_type] || data.signal_type;
  const maxAmp = Math.max(...data.input_signal.map(Math.abs));

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Signal Input</p>
      </div>
      <div className="p-3 grid grid-cols-3 gap-3 border-b border-slate-100">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Type</p>
          <p className="text-sm font-bold text-slate-900">{signalType}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Qubits</p>
          <p className="text-sm font-bold text-slate-900">{data.n_qubits}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Raw Points</p>
          <p className="text-sm font-bold text-slate-900">{data.n_points_original}</p>
          {data.n_points_original !== data.n_points_padded && (
            <p className="text-[9px] text-slate-400">(→ {data.n_points_padded} padded)</p>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="text-[10px] font-semibold text-slate-500 mb-2">Signal Amplitude (Time Domain)</p>
        <div className="flex items-end gap-0.5 h-20">
          {data.input_signal.slice(0, Math.min(16, data.input_signal.length)).map((amp, i) => {
            const height = maxAmp > 0 ? (Math.abs(amp) / maxAmp) * 100 : 0;
            const isPositive = amp >= 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end"
                style={{ height: '100%' }}
              >
                <div
                  className={`w-full rounded-t-sm ${isPositive ? 'bg-indigo-400' : 'bg-orange-400'}`}
                  style={{ height: `${height}%`, minHeight: height > 0 ? '2px' : '0' }}
                  title={`${amp.toFixed(3)}`}
                />
              </div>
            );
          })}
        </div>
        <p className="text-[9px] text-slate-400 mt-1 text-center">showing first {Math.min(16, data.input_signal.length)} samples</p>
      </div>
      <div className="px-3 pb-3 flex flex-wrap gap-2 text-[10px] text-slate-500">
        <span className="rounded bg-slate-100 px-2 py-1">Max: {maxAmp.toFixed(3)}</span>
        <span className="rounded bg-slate-100 px-2 py-1">Min: {Math.min(...data.input_signal).toFixed(3)}</span>
      </div>
    </div>
  );
}

export function PhaseCascadePanel({ data, activeStep }: { data: QFTAnimationPayload; activeStep: QFTAnimationStep }) {
  const activeQubit = activeStep.target_qubit ?? null;
  const model = buildPhaseCascadeModel(data, activeQubit);

  const currentPhases = activeStep.qubit_phases || [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Signal → Phase Cascade</p>
      <p className="mt-1 text-[15px] font-semibold text-slate-900">Konstruksi QFT Circuit</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{model.intro}</p>

      {model.overviewBlock && (
        <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-teal-600">{model.overviewBlock.label}</span>
            <span className="text-[10px] font-medium text-slate-500">{model.overviewBlock.totalGates} gates</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{model.overviewBlock.complexity}</p>
        </div>
      )}

      {currentPhases.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold text-slate-500 mb-2">Phase Wheels (Current Step)</p>
          <PhaseWheelStack qubitPhases={currentPhases} activeQubit={activeQubit} size={45} />
        </div>
      )}

      <div className="mt-3 space-y-2">
        {model.rows.map((row) => {
          const isActive = activeQubit === row.qubitIndex;
          return (
            <div
              key={row.qubitIndex}
              className={`rounded-lg border px-3 py-2.5 transition-all ${
                isActive
                  ? 'border-teal-300 bg-teal-50 ring-1 ring-teal-200'
                  : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                    {row.stepNumber}
                  </span>
                  <span className="font-mono text-[12px] font-semibold tracking-wider text-slate-800">
                    q{row.qubitIndex}
                  </span>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono ${isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                  φ = {formatRadians(row.accumulatedPhase)}
                </span>
              </div>

              {isActive && (
                <>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {row.subSteps.slice(0, 5).map((step, i) => (
                      <span
                        key={i}
                        className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-medium text-slate-600"
                      >
                        {step.gate}
                      </span>
                    ))}
                    {row.subSteps.length > 5 && (
                      <span className="inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-medium text-slate-500">
                        +{row.subSteps.length - 5}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">{row.intro}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FFTvsQFTComparisonPanel({ data }: { data: QFTAnimationPayload }) {
  const n = data.n_qubits;
  const nPoints = data.n_points_padded;
  const quantumComplexity = `O(${n}²)`;
  const classicalComplexity = `O(${nPoints} log ${nPoints})`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">FFT vs QFT Comparison</h3>
      </div>
      <div className="p-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">FFT (Classical)</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{classicalComplexity}</div>
          <div className="text-[10px] text-slate-500 mt-1">Full spectrum analysis</div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-orange-500" style={{ width: '100%' }} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">QFT (Quantum)</div>
          <div className="text-lg font-bold text-slate-900 mt-1">{quantumComplexity}</div>
          <div className="text-[10px] text-slate-500 mt-1">Phase-based transform</div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, (n * n) / nPoints * 100)}%` }} />
          </div>
        </div>
      </div>
      <div className="px-3 pb-3">
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
          <p className="text-[11px] font-semibold text-amber-700">Speedup</p>
          <p className="text-[10px] text-amber-600 mt-1 leading-relaxed">
            Untuk N = 2^{n} = {nPoints} poin: FFT membutuhkan ~{nPoints}·{n} = {nPoints * n} operasi,
            sedangkan QFT hanya ~{n}² = {n * n} operasi.
            Speedup faktor: ~{nPoints / n}x untuk setup ini.
          </p>
        </div>
      </div>
    </div>
  );
}

export function FrequencySpectrumPanel({ data }: { data: QFTAnimationPayload }) {
  const topStates = Object.entries(data.measurement.counts)
    .map(([state, count]) => ({
      key: state,
      label: `|${state}⟩`,
      probability: count / data.measurement.shots,
    }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 6);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Frequency Spectrum</h3>
      </div>
      <div className="p-3 flex flex-wrap items-center gap-2 border-b border-slate-100">
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600">
          {data.measurement.shots} shots
        </span>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600">
          {topStates.length} bins shown
        </span>
      </div>
      <div className="p-3">
        <ProbabilityBarList items={topStates} barColor="bg-teal-500" />
      </div>
    </div>
  );
}

export function ReadingGuideCard({ step, nQubits }: { step: QFTAnimationStep; nQubits: number }) {
  return (
    <SharedReadingGuideCard
      title="Cara Baca Animasi QFT"
      headline={getStepHeadline(step)}
      explanation={getStepExplanation(step)}
      notes={getContextGlossary(step, nQubits)}
    />
  );
}
