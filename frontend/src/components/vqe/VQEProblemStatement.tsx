import type { ReactNode } from 'react';
import { ArrowRight, Atom, Sigma, Target } from 'lucide-react';
import { SectionCard } from '../layout';
import type { VQEBenchmarkResult, VQECase, VQEMoleculeSpec, VQEPreprocessingSpec } from '../../types/vqe';

interface VQEProblemStatementProps {
  className?: string;
  caseData?: VQECase | null;
  result?: VQEBenchmarkResult | null;
}

type Tone = 'violet' | 'indigo' | 'emerald';

function valueText(value: string | number | undefined, fallback = 'Belum tersedia') {
  return value === undefined || value === '' ? fallback : String(value);
}

function pretty(value: string | undefined) {
  return value ? value.replace(/_/g, ' ') : 'Belum tersedia';
}

function readMolecule(caseData?: VQECase | null): VQEMoleculeSpec {
  return caseData?.molecule_spec ?? caseData?.raw_spec?.molecule_spec ?? {};
}

function readPreprocessing(caseData?: VQECase | null): VQEPreprocessingSpec {
  return caseData?.preprocessing ?? caseData?.raw_spec?.preprocessing ?? caseData?.transform ?? {};
}

export function VQEProblemStatement({ className = '', caseData, result }: VQEProblemStatementProps) {
  const molecule = readMolecule(caseData);
  const preprocessing = readPreprocessing(caseData);
  const experiment = caseData?.experiment ?? caseData?.raw_spec?.experiment;
  const formula = molecule.formula ?? result?.molecule ?? caseData?.molecule;
  const initialQubits = preprocessing.initial_qubits;
  const targetQubits = preprocessing.target_qubits ?? result?.n_qubits ?? caseData?.qubits;
  const terms = Object.entries(result?.hamiltonian_terms ?? caseData?.hamiltonian?.terms ?? {}).slice(0, 4);

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionCard title="Problem Statement VQE" icon={<Atom className="h-5 w-5" />}>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <HeaderBadge
            caseId={caseData?.case_id ?? result?.case_id}
            values={[valueText(formula), valueText(molecule.basis).toUpperCase(), `${valueText(initialQubits, '?')} → ${valueText(targetQubits, '?')} qubit`]}
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
            <FlowBox icon={<Atom className="h-5 w-5" />} label="Input" title="Molecule" tone="violet">
              <div className="rounded-2xl border border-violet-100 bg-white p-5">
                <div className="flex items-center justify-center gap-5">
                  <AtomNode label="H" />
                  <div className="min-w-24 text-center">
                    <div className="h-px bg-violet-300" />
                    <div className="mt-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
                      {valueText(molecule.interatomic_distance_angstrom, '?')} Å
                    </div>
                  </div>
                  <AtomNode label="H" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
                  <InfoPill label="Formula" value={valueText(formula)} />
                  <InfoPill label="Basis" value={valueText(molecule.basis).toUpperCase()} />
                  <InfoPill label="Charge" value={valueText(molecule.charge, '0')} />
                  <InfoPill label="Spin" value={valueText(molecule.multiplicity, '1')} />
                </div>
              </div>
            </FlowBox>

            <DesktopArrow />

            <FlowBox icon={<Sigma className="h-5 w-5" />} label="Transform" title="H + ansatz" tone="indigo">
              <div className="space-y-3">
                <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-center">
                  <div className="font-mono text-2xl font-black text-indigo-800">H = Σ cᵢPᵢ</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <InfoPill label="Mapping" value={pretty(preprocessing.mapping)} />
                    <InfoPill label="Qubits" value={`${valueText(initialQubits, '?')} → ${valueText(targetQubits, '?')}`} />
                    <InfoPill label="Ansatz" value={experiment?.ansatz_type ?? result?.ansatz_type ?? 'ry linear'} />
                    <InfoPill label="Optimizer" value={experiment?.optimizer ?? result?.quantum?.optimizer_name ?? 'COBYLA'} />
                  </div>
                </div>
                {terms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {terms.map(([pauli, coeff]) => (
                      <span key={pauli} className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 font-mono text-[10px] font-black text-indigo-700">
                        {pauli} {Number(coeff).toFixed(3)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </FlowBox>

            <DesktopArrow />

            <FlowBox icon={<Target className="h-5 w-5" />} label="Output" title="Energy" tone="emerald">
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 text-center">
                <div className="font-mono text-2xl font-black text-emerald-700">E₀ = min⟨ψ|H|ψ⟩</div>
                <div className="mt-4 grid gap-2">
                  <EnergyLine label="VQE" value={result ? `${result.quantum.energy.toFixed(6)} Ha` : '—'} tone="violet" />
                  <EnergyLine label="FCI" value={result ? `${result.classical.energy.toFixed(6)} Ha` : 'ref'} tone="slate" />
                </div>
              </div>
            </FlowBox>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function HeaderBadge({ caseId, values }: { caseId?: string; values: string[] }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Data aktif</p>
        <h3 className="mt-1 text-xl font-black text-slate-900">{caseId ?? 'Belum tersedia'}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <span key={value} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function FlowBox({ icon, label, title, tone, children }: { icon: ReactNode; label: string; title: string; tone: Tone; children: ReactNode }) {
  const toneClass = {
    violet: 'border-violet-200 bg-violet-50/60 text-violet-600',
    indigo: 'border-indigo-200 bg-indigo-50/60 text-indigo-600',
    emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-600',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-white p-2 shadow-sm">{icon}</div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">{label}</p>
          <h3 className="text-base font-black text-slate-900">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  );
}

function AtomNode({ label }: { label: string }) {
  return <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-black text-white shadow-lg">{label}</div>;
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function EnergyLine({ label, value, tone }: { label: string; value: string; tone: 'violet' | 'slate' }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${tone === 'violet' ? 'border-violet-200 bg-violet-50 text-violet-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
      <span className="font-bold">{label}</span>
      <span className="font-mono font-black">{value}</span>
    </div>
  );
}

function DesktopArrow() {
  return (
    <div className="hidden h-10 w-10 self-center items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 lg:flex">
      <ArrowRight className="h-5 w-5" />
    </div>
  );
}
