import { useId } from 'react';
import { VQECard, VQE_TYPOGRAPHY } from './layout';

interface FCIFlowDiagramProps {
  activeCheckpoint?: number;
}

/**
 * FCI Classical Preprocessing Flow Diagram
 *
 * Shows the complete pipeline from molecule geometry to exact FCI energy:
 * 1. Input: Molecule geometry → AO basis functions
 * 2. AO integrals: overlap S, kinetic T, nuclear V, ERI
 * 3. RHF SCF: self-consistent field → MO coefficients
 * 4. MO transform: rotate to molecular orbital basis
 * 5. Jordan-Wigner: map fermionic operators to Pauli
 * 6. Exact diagonalization: get FCI ground state energy
 */
const FCI_STEPS = [
  {
    id: 1,
    label: 'Molecule + AO Basis',
    math: 'H₂ | STO-3G',
    detail: 'Geometry + basis functions',
    why: 'Define what system to solve and how to represent it',
  },
  {
    id: 2,
    label: 'AO Integrals',
    math: '{S, T, V, (μν|λσ)}',
    detail: '4 integral types',
    why: 'The language of the electronic Hamiltonian in atomic orbital basis',
  },
  {
    id: 3,
    label: 'RHF SCF',
    math: 'C = MO coeffs',
    detail: 'Self-consistent field',
    why: 'Find mean-field solution (Slater determinant) as starting point',
  },
  {
    id: 4,
    label: 'MO Transform',
    math: 'h₁, (pq|rs)',
    detail: 'Molecular orbital basis',
    why: 'Rotate integrals to delocalized MO basis for second quantization',
  },
  {
    id: 5,
    label: 'Jordan-Wigner',
    math: 'FermionicOp → Σ cᵢPᵢ',
    detail: 'Map to Pauli operators',
    why: 'Convert fermionic algebra to qubit operators for quantum simulation',
  },
  {
    id: 6,
    label: 'Exact Diag.',
    math: 'E₀ = min eig(H)',
    detail: 'FCI ground state energy',
    why: 'Diagonalize Pauli Hamiltonian classically to get exact reference energy',
  },
];

export function FCIFlowDiagram({ activeCheckpoint = 0 }: FCIFlowDiagramProps) {
  const uid = useId();

  // activeCheckpoint 0 = all steps shown (overview mode)
  // For classical tab, show all steps as the "pipeline"
  const maxActive = activeCheckpoint === 0 ? 6 : Math.min(activeCheckpoint, 6);

  return (
    <VQECard>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className={`${VQE_TYPOGRAPHY.tiny} mb-0.5`}>FCI Classical Pipeline</div>
          <h3 className="text-sm font-bold text-slate-800">Full Configuration Interaction Flow</h3>
          <p className={`${VQE_TYPOGRAPHY.small} mt-0.5 text-slate-500`}>
            H₂/STO-3G → exact ground state energy via classical diagonalization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full ${VQE_TYPOGRAPHY.tiny} bg-blue-100 text-blue-700 font-bold`}>
            6 Steps
          </span>
          <span className={`px-2 py-1 rounded-full ${VQE_TYPOGRAPHY.tiny} bg-emerald-100 text-emerald-700 font-bold`}>
            O(N³) diagonalization
          </span>
        </div>
      </div>

      {/* Main flow: horizontal steps */}
      <div className="hidden md:block">
        <div className="flex items-center justify-center gap-0">
          {FCI_STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <FCIStepBox step={step} isActive={step.id <= maxActive} />
              {idx < FCI_STEPS.length - 1 && <FCIArrow isActive={step.id < maxActive} />}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical stack */}
      <div className="md:hidden space-y-2">
        {FCI_STEPS.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center">
            <FCIStepBox step={step} isActive={step.id <= maxActive} />
            {idx < FCI_STEPS.length - 1 && <FCIVArrow isActive={step.id < maxActive} />}
          </div>
        ))}
      </div>

      {/* WHY annotations row - the pedagogical key */}
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className={`${VQE_TYPOGRAPHY.tiny} text-center text-slate-400 mb-3 tracking-widest`}>
          WHY EACH STEP — the physics reasoning
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {FCI_STEPS.map((step) => (
            <div
              key={step.id}
              className={`rounded-lg border p-2 transition-all ${
                step.id <= maxActive
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-slate-50 border-slate-100 opacity-50'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                    step.id <= maxActive
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step.id}
                </div>
                <span className={`text-[10px] font-bold ${step.id <= maxActive ? 'text-blue-800' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
              <div className={`${VQE_TYPOGRAPHY.small} ${step.id <= maxActive ? 'text-blue-700' : 'text-slate-400'}`}>
                {step.why}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key equations strip */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className={`${VQE_TYPOGRAPHY.tiny} text-center text-slate-400 mb-3`}>
          KEY EQUATIONS
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <EquationPill label="RHF SCF" equation="F = h₁ + J - K" />
          <EquationPill label="MO coef" equation="C = solve(F C = ε S C)" />
          <EquationPill label="ERI transform" equation="(pq|rs) = Σ C_{μp}C_{νq}C_{λr}C_{σs}(μν|λσ)" />
          <EquationPill label="JW mapping" equation="a†_i → ½∏_{j<i} Z_j, a_i → ½∏_{j<i} Z_j" />
          <EquationPill label="FCI energy" equation="H C = E C → E₀ = min eigenvalue" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-6 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          <span className={VQE_TYPOGRAPHY.small}>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-50 border border-slate-200" />
          <span className={VQE_TYPOGRAPHY.small}>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          <span className={VQE_TYPOGRAPHY.small}>Final result</span>
        </div>
      </div>
    </VQECard>
  );
}

function EquationPill({ label, equation }: { label: string; equation: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
      <span className="text-[9px] font-bold text-slate-600">{label}</span>
      <span className="text-[10px] font-mono text-slate-800">{equation}</span>
    </div>
  );
}

function FCIStepBox({
  step,
  isActive,
}: {
  step: (typeof FCI_STEPS)[number];
  isActive: boolean;
}) {
  const activeBg = 'bg-blue-50 border-blue-300';
  const inactiveBg = 'bg-slate-50 border-slate-200';
  const activeText = 'text-blue-900';
  const inactiveText = 'text-slate-400';
  const activeDesc = 'text-blue-600';
  const inactiveDesc = 'text-slate-300';
  const activeBadge = 'bg-blue-200 text-blue-800';
  const inactiveBadge = 'bg-slate-200 text-slate-500';

  return (
    <div
      className={`flex flex-col items-center rounded-lg border-2 p-2.5 transition-all ${
        isActive ? activeBg : inactiveBg
      }`}
      style={{ width: 108 }}
    >
      <div
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold mb-1 ${
          isActive ? activeBadge : inactiveBadge
        }`}
      >
        {step.id}
      </div>
      <span className={`text-[10px] font-bold leading-tight text-center ${isActive ? activeText : inactiveText}`}>
        {step.label}
      </span>
      <span className={`font-mono mt-0.5 text-[9px] ${isActive ? activeDesc : inactiveDesc}`}>
        {step.math}
      </span>
      <span className={`${VQE_TYPOGRAPHY.tiny} mt-0.5 ${isActive ? 'text-blue-500' : 'text-slate-300'}`}>
        {step.detail}
      </span>
    </div>
  );
}

function FCIArrow({ isActive }: { isActive: boolean }) {
  const color = isActive ? '#3b82f6' : '#cbd5e1';
  return (
    <div className="flex items-center justify-center w-6 shrink-0">
      <svg width="24" height="16" viewBox="0 0 24 16" className="shrink-0">
        <path
          d="M0 8h20M14 2l6 6-6 6"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function FCIVArrow({ isActive }: { isActive: boolean }) {
  const color = isActive ? '#3b82f6' : '#cbd5e1';
  return (
    <svg width="16" height="24" viewBox="0 0 16 24" className="shrink-0 my-0.5">
      <path
        d="M8 0v20M2 14l6 6 6-6"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}