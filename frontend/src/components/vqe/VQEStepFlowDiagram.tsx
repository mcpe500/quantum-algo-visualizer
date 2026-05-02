import { useId } from 'react';
import { VQECard, VQE_TYPOGRAPHY, VQE_DIMENSIONS } from './layout';

interface VQEStepFlowDiagramProps {
  activeCheckpoint?: number;
  /** Whether animation is actively playing */
  isAnimating?: boolean;
  /** Current animated iteration index */
  animatedIteration?: number;
  /** Total iterations in the convergence history */
  totalIterations?: number;
}

const STEPS = [
  { id: 1, label: 'Init θ', desc: 'θ⁽⁰⁾ = random', domain: 'classical', sublabel: 'Classical' },
  { id: 2, label: 'Build Ansatz', desc: 'U(θ)|0⟩', domain: 'quantum', sublabel: 'Quantum' },
  { id: 3, label: 'Prepare State', desc: '|ψ(θ)⟩', domain: 'quantum', sublabel: 'Quantum' },
  { id: 4, label: 'Measure E', desc: '⟨ψ|H|ψ⟩', domain: 'quantum', sublabel: 'Quantum' },
  { id: 5, label: 'Update θ', desc: 'θ⁽ᵗ⁺¹⁾', domain: 'classical', sublabel: 'Classical' },
  { id: 6, label: 'Converged?', desc: '|ΔE| < ε', domain: 'classical', sublabel: 'Classical' },
];

export function VQEStepFlowDiagram({
  activeCheckpoint = 0,
  isAnimating = false,
  animatedIteration = 0,
  totalIterations = 1,
}: VQEStepFlowDiagramProps) {
  const uid = useId();

  // During animation, show a pseudo-checkpoint based on iteration progress
  // This makes the flow diagram respond to the animation in real-time
  const animationProgress = totalIterations > 0 ? animatedIteration / (totalIterations - 1) : 0;
  const effectiveCheckpoint = isAnimating
    ? Math.min(4, Math.floor(animationProgress * 5))
    : activeCheckpoint;

  // Determine which steps are "active" based on checkpoint
  // Checkpoint 0 (Start): steps 1-2
  // Checkpoint 1-3 (Optimizing): steps 2-5
  // Checkpoint 4 (Final): steps 1-6 (all)
  const maxActiveStep =
    effectiveCheckpoint === 0
      ? 2
      : effectiveCheckpoint >= 4
        ? 6
        : effectiveCheckpoint + 2;

  return (
    <VQECard>
      <div className={VQE_TYPOGRAPHY.tiny + ' text-center mb-4'}>
        VQE Hybrid Iteration Flow
      </div>

      {/* Desktop: 2-row grid with arrows */}
      <div className="hidden md:block">
        <div className="relative" style={{ minHeight: VQE_DIMENSIONS.stepFlowMinHeight }}>
          {/* Row 1: Steps 1-3 */}
          <div className="flex justify-center items-start gap-4 mb-2">
            {STEPS.slice(0, 3).map((step) => (
              <StepBox
                key={step.id}
                step={step}
                isActive={step.id <= maxActiveStep}
                pulse={isAnimating && step.id === maxActiveStep}
                uid={uid}
              />
            ))}
          </div>

          {/* Row 1 arrows */}
          <div className="flex justify-center items-center gap-4 mb-4 px-8">
            <ArrowRight isActive={maxActiveStep >= 2} />
            <ArrowRight isActive={maxActiveStep >= 3} />
          </div>

          {/* Vertical connector: Step 3 → Step 4 */}
          <div
            className="flex justify-end mb-2"
            style={{ paddingRight: `${VQE_DIMENSIONS.stepFlowConnectorPadding}px` }}
          >
            <ArrowDown isActive={maxActiveStep >= 4} />
          </div>

          {/* Row 2: Steps 6-4 (reversed visual order) */}
          <div className="flex justify-center items-start gap-4">
            {STEPS.slice(3).reverse().map((step) => (
              <StepBox
                key={step.id}
                step={step}
                isActive={step.id <= maxActiveStep}
                pulse={isAnimating && step.id === maxActiveStep}
                uid={uid}
              />
            ))}
          </div>

          {/* Row 2 arrows (leftward) */}
          <div className="flex justify-center items-center gap-4 mb-4 px-8">
            <ArrowLeft isActive={maxActiveStep >= 5} />
            <ArrowLeft isActive={maxActiveStep >= 6} />
          </div>

          {/* Loop arrow: Step 6 No → back to Step 2 */}
          <div 
            className="flex justify-start items-center gap-2"
            style={{ paddingLeft: `${VQE_DIMENSIONS.stepFlowConnectorPadding}px` }}
          >
            <span className={VQE_TYPOGRAPHY.caption + ' font-mono'}>No →</span>
            <svg width="120" height="40" viewBox="0 0 120 40">
              <defs>
                <marker id={`loop-arrow-${uid}`} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={maxActiveStep >= 6 ? '#3b82f6' : '#cbd5e1'} />
                </marker>
              </defs>
              <path
                d="M 0 30 Q 60 0 110 30"
                fill="none"
                stroke={maxActiveStep >= 6 ? '#3b82f6' : '#cbd5e1'}
                strokeWidth="2"
                strokeDasharray="4 2"
                markerEnd={`url(#loop-arrow-${uid})`}
              />
            </svg>
            <span className={VQE_TYPOGRAPHY.caption + ' font-mono'}>→ Step ②</span>
          </div>

          {/* Done exit: Step 6 Yes */}
          <div 
            className="flex justify-end items-center gap-2 mt-1"
            style={{ paddingRight: `${VQE_DIMENSIONS.stepFlowConnectorPadding}px` }}
          >
            <span className={VQE_TYPOGRAPHY.caption + ' font-mono'}>Yes →</span>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                maxActiveStep >= 6 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              Done
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: vertical stack */}
      <div className="md:hidden space-y-3">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center">
            <StepBox step={step} isActive={step.id <= maxActiveStep} />
            {idx < STEPS.length - 1 && (
              <ArrowDown isActive={step.id < maxActiveStep} />
            )}
          </div>
        ))}

        {/* Mobile loop */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={VQE_TYPOGRAPHY.caption + ' font-mono'}>No → loop to Step ②</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className={VQE_TYPOGRAPHY.caption + ' font-mono'}>Yes →</span>
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              maxActiveStep >= 6 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            Done
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-6 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          <span className={VQE_TYPOGRAPHY.small}>Classical (CPU)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300" />
          <span className={VQE_TYPOGRAPHY.small}>Quantum (QPU/Sim)</span>
        </div>
      </div>
    </VQECard>
  );
}

function StepBox({
  step,
  isActive,
  pulse = false,
}: {
  step: { id: number; label: string; desc: string; domain: string; sublabel: string };
  isActive: boolean;
  pulse?: boolean;
  uid?: string;
}) {
  const isClassical = step.domain === 'classical';
  const baseClasses = isClassical
    ? 'bg-blue-50 border-blue-200'
    : 'bg-purple-50 border-purple-200';
  const activeClasses = isActive
    ? 'ring-2 ring-offset-1 ' + (isClassical ? 'ring-blue-400' : 'ring-purple-400')
    : 'opacity-60';
  const titleColor = isClassical ? 'text-blue-800' : 'text-purple-800';
  const descColor = isClassical ? 'text-blue-600' : 'text-purple-600';
  const badgeBg = isClassical ? 'bg-blue-200 text-blue-800' : 'bg-purple-200 text-purple-800';

  return (
    <div
      className={`rounded-lg border p-3 text-center transition-all ${baseClasses} ${activeClasses} ${pulse ? 'animate-pulse' : ''}`}
      style={{ width: VQE_DIMENSIONS.stepFlowNodeWidth }}
    >
      <div
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mb-1.5 ${badgeBg}`}
      >
        {step.id}
      </div>
      <div className={`text-xs font-semibold leading-tight ${titleColor}`}>{step.label}</div>
      <div className={`font-mono mt-0.5 ${VQE_TYPOGRAPHY.caption} ${descColor}`}>{step.desc}</div>
      <div className={`text-[9px] mt-1 uppercase tracking-wider ${isClassical ? 'text-blue-400' : 'text-purple-400'}`}>
        {step.sublabel}
      </div>
    </div>
  );
}

function ArrowRight({ isActive }: { isActive: boolean }) {
  const color = isActive ? '#3b82f6' : '#cbd5e1';
  return (
    <svg width="40" height="16" viewBox="0 0 40 16" className="shrink-0">
      <path d="M0 8h35M28 2l7 6-7 6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowLeft({ isActive }: { isActive: boolean }) {
  const color = isActive ? '#3b82f6' : '#cbd5e1';
  return (
    <svg width="40" height="16" viewBox="0 0 40 16" className="shrink-0">
      <path d="M40 8H5M12 2L5 8l7 6" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDown({ isActive }: { isActive: boolean }) {
  const color = isActive ? '#9333ea' : '#cbd5e1';
  return (
    <svg width="16" height="32" viewBox="0 0 16 32" className="shrink-0">
      <path d="M8 0v27M2 20l6 7 6-7" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
