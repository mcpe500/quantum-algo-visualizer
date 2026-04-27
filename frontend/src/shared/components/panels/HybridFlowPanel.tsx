import type { QAOAAnimationPayload, QAOAAnimationStep } from '../../../types/qaoa';

interface HybridFlowPanelProps {
  data: QAOAAnimationPayload;
  activeStep: QAOAAnimationStep;
}

const PHASE_TO_LINE: Record<string, number> = {
  optimizer: 3,
  superposition: 1,
  cost: 1,
  mixer: 1,
  measurement: 5,
  update: 3,
};

export function HybridFlowPanel({ data, activeStep }: HybridFlowPanelProps) {
  const PSEUDOCODE_LINES = [
    'Initialize γ₀, β₀ (random)',
    '→ Build QAOA circuit with γ, β',
    '→ Statevector simulation → ⟨H_C⟩ expected cut',
    '← COBYLA receives -⟨H_C⟩, updates γ, β',
    '→ Repeat until convergence',
    `→ Final: AerSimulator(shots=${data.shots}) → bitstring`,
  ];

  const activeLine = PHASE_TO_LINE[activeStep.phase] ?? -1;
  const checkpoint = data.checkpoints.find((cp) => cp.key === activeStep.checkpoint_key);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hybrid Loop</p>
      <p className="mt-1 text-[15px] font-semibold text-slate-900">Classical ↔ Quantum Iteration</p>

      {/* Flow Diagram */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <FlowBox label="Classical" sublabel="COBYLA" isActive={activeStep.phase === 'optimizer' || activeStep.phase === 'update'} color="#7c3aed" />
        <FlowArrow direction="right" isActive={activeStep.phase === 'superposition' || activeStep.phase === 'cost' || activeStep.phase === 'mixer'} />
        <FlowBox label="Quantum" sublabel="Circuit" isActive={activeStep.phase === 'superposition' || activeStep.phase === 'cost' || activeStep.phase === 'mixer'} color="#2563eb" />
        <FlowArrow direction="right" isActive={activeStep.phase === 'measurement'} />
        <FlowBox label="Measure" sublabel="Shots" isActive={activeStep.phase === 'measurement'} color="#0d9488" />
      </div>

      {/* Feedback arrows */}
      <div className="mt-2 flex items-center justify-center">
        <svg width="280" height="24" viewBox="0 0 280 24">
          <path
            d="M 20 12 Q 140 24 260 12"
            fill="none"
            stroke={activeStep.phase === 'update' || activeStep.phase === 'optimizer' ? '#7c3aed' : '#cbd5e1'}
            strokeWidth="2"
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead-left)"
          />
          <defs>
            <marker id="arrowhead-left" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={activeStep.phase === 'update' || activeStep.phase === 'optimizer' ? '#7c3aed' : '#cbd5e1'} />
            </marker>
          </defs>
        </svg>
      </div>
      <p className="text-center text-[10px] text-slate-400">Feedback: measurement → parameter update</p>

      {/* Pseudocode */}
      <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 font-mono text-[11px]">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Pseudocode</p>
        {PSEUDOCODE_LINES.map((line, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 py-0.5 ${
              index === activeLine ? 'rounded bg-blue-50 px-1.5 text-blue-800' : 'text-slate-600'
            }`}
          >
            <span className={`w-4 shrink-0 text-right ${index === activeLine ? 'text-blue-500 font-bold' : 'text-slate-400'}`}>
              {index + 1}
            </span>
            <span>{line}</span>
          </div>
        ))}
      </div>

      {/* Parameters */}
      {checkpoint && (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-blue-700">{checkpoint.label}</span>
            <span className="text-[10px] font-medium text-blue-600">iter {checkpoint.eval_index}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {checkpoint.gamma.map((gamma, index) => (
              <span key={`g-${index}`} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-mono text-blue-700">
                γ{index + 1}={gamma.toFixed(3)}
              </span>
            ))}
            {checkpoint.beta.map((beta, index) => (
              <span key={`b-${index}`} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-mono text-teal-700">
                β{index + 1}={beta.toFixed(3)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlowBox({ label, sublabel, isActive, color }: { label: string; sublabel: string; isActive: boolean; color: string }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center transition-all ${
        isActive ? 'border-opacity-100 shadow-sm' : 'border-slate-200 opacity-70'
      }`}
      style={isActive ? { borderColor: color, backgroundColor: `${color}10` } : undefined}
    >
      <p className="text-[11px] font-semibold" style={isActive ? { color } : undefined}>{label}</p>
      <p className="text-[10px] text-slate-500">{sublabel}</p>
    </div>
  );
}

function FlowArrow({ direction, isActive }: { direction: 'left' | 'right'; isActive: boolean }) {
  const color = isActive ? '#2563eb' : '#cbd5e1';
  const rotate = direction === 'left' ? 'rotate-180' : '';

  return (
    <svg width="20" height="16" viewBox="0 0 20 16" className={rotate}>
      <path d="M0 8h18M12 2l6 6-6 6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
