import type { DJQuantumTrace, DJTracePartition, DJTraceStage } from '../../types/dj';

interface QuantumPhaseGroupedPreviewProps {
  trace: DJQuantumTrace;
}

const PHASE_THEME: Record<string, { badge: string; border: string; bg: string; text: string }> = {
  init: { badge: 'bg-blue-600', border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-800' },
  prep: { badge: 'bg-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-800' },
  oracle: { badge: 'bg-amber-600', border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-800' },
  interference: { badge: 'bg-violet-600', border: 'border-violet-200', bg: 'bg-violet-50', text: 'text-violet-800' },
  measure: { badge: 'bg-rose-600', border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-800' },
};

function parseDiracStates(input: string): string[] {
  const tokens: string[] = [];
  let pos = 0;

  while (pos < input.length) {
    const chunk = input.slice(pos, pos + 3);
    if (chunk === '|0⟩' || chunk === '|1⟩' || chunk === '|+⟩' || chunk === '|−⟩') {
      tokens.push(chunk);
      pos += 3;
      continue;
    }

    tokens.push(input[pos] || '-');
    pos += 1;
  }

  return tokens;
}

function formatStepRange(stages: DJTraceStage[]): string {
  if (stages.length === 0) {
    return 'Tanpa stage';
  }

  const first = stages[0].step;
  const last = stages[stages.length - 1].step;
  return first === last ? `Step ${first}` : `Step ${first} - ${last}`;
}

function buildPhaseGroups(trace: DJQuantumTrace) {
  return trace.partitions
    .map((partition: DJTracePartition) => ({
      partition,
      stages: trace.stages.slice(partition.start, partition.end),
    }))
    .filter(({ stages }) => stages.length > 0);
}

export function QuantumPhaseGroupedPreview({ trace }: QuantumPhaseGroupedPreviewProps) {
  const groups = buildPhaseGroups(trace);
  const inputLabels = Array.from({ length: trace.n_qubits }, (_, i) => `q${i}`);
  const ancLabel = `q${trace.n_qubits}`;

  return (
    <section className="bg-white border border-purple-200 rounded-xl overflow-hidden">
      <header className="text-center pt-4 pb-2 px-4">
        <p className="text-[10px] tracking-[0.2em] text-purple-600 font-bold uppercase">Grouped Quantum Preview</p>
        <h2 className="text-[16px] font-semibold text-gray-900 mt-1">
          {trace.case_id} - {trace.classification}
        </h2>
        <p className="text-[11px] text-gray-500 mt-1">
          Phase trace dinamis dari JSON aktif. Group mengikuti init, prep, oracle, interference, measure.
        </p>
      </header>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {groups.map(({ partition, stages }, idx) => {
            const theme = PHASE_THEME[partition.stageId] || PHASE_THEME.oracle;

            return (
              <article key={`${partition.stageId}-${idx}`} className={`rounded-xl border-2 ${theme.border} ${theme.bg} p-3 shadow-sm`}>
                <div className="flex items-start justify-between gap-2">
                  <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${theme.badge} text-white text-[11px] font-bold`}>
                    {idx + 1}
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme.text}`}>
                      {partition.label}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {formatStepRange(stages)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {stages.map((stage) => {
                    const stateTokens = parseDiracStates(stage.inputs);

                    return (
                      <div key={stage.step} className="rounded-lg border border-white/80 bg-white/85 px-2 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-bold ${theme.badge} text-white`}>
                            {stage.step}
                          </span>
                          <span className="text-[10px] font-medium text-gray-700 text-right leading-tight">
                            {stage.operation}
                          </span>
                        </div>

                        <div
                          className="mt-2 grid gap-1 text-[10px]"
                          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(86px, 1fr))' }}
                        >
                          {inputLabels.map((label, i) => (
                            <div key={label} className="rounded-md bg-white border border-gray-200 px-1.5 py-1 font-mono text-gray-700">
                              <span className="text-gray-500">{label}</span> {stateTokens[i] || '-'}
                            </div>
                          ))}
                          <div className="rounded-md bg-white border border-gray-200 px-1.5 py-1 font-mono text-gray-700 col-span-2">
                            <span className="text-gray-500">{ancLabel}</span> {stage.ancilla}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
