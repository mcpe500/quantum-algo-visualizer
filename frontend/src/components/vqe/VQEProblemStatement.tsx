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
  const terms = Object.entries(result?.hamiltonian_terms ?? caseData?.hamiltonian?.terms ?? {});
  const nLayers = experiment?.n_layers ?? result?.n_layers ?? 1;
  const nQubits = targetQubits ?? 2;

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionCard title="Problem Statement VQE" icon={<Atom className="h-5 w-5" />}>
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-50/40 via-transparent to-emerald-50/30" />

          <div className="relative z-10">
            <HeaderBadge
              caseId={caseData?.case_id ?? result?.case_id}
              values={[valueText(formula), valueText(molecule.basis).toUpperCase(), `${valueText(initialQubits, '?')} → ${valueText(targetQubits, '?')} qubit`]}
            />

            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
              {/* Stage 1: Input Molecule */}
              <FlowBox icon={<Atom className="h-5 w-5" />} label="Input" title="Molecule" tone="violet" stage="01">
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

              {/* Stage 2: Problem Statement (Finding Ground State) */}
              <FlowBox icon={<Sigma className="h-5 w-5" />} label="Masalah" title="Ground State" tone="indigo" stage="02">
                <div className="mb-4">
                  <GroundStateCinematic />
                </div>

                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4">
                  <p className="font-mono text-sm font-semibold text-indigo-900">Inti Permasalahan</p>
                  <p className="mt-1 text-sm leading-relaxed text-indigo-900/80">
                    Sistem molekul memiliki banyak kemungkinan status energi. Tantangannya adalah menemukan konfigurasi dengan energi paling rendah (Ground State Energy, E₀).
                  </p>
                </div>
              </FlowBox>

              <DesktopArrow />

              {/* Stage 3: Output Energy */}
              <FlowBox icon={<Target className="h-5 w-5" />} label="Output" title="Energy" tone="emerald" stage="03">
                <div className="rounded-2xl border border-emerald-100 bg-white p-5 text-center">
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-300" />
                    <div className="font-mono text-2xl font-black text-emerald-700">E₀ = min⟨ψ|H|ψ⟩</div>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-300" />
                  </div>

                  {/* Energy comparison bars */}
                  <div className="space-y-3">
                    <EnergyBar label="VQE" value={result?.quantum?.energy} max={result?.classical?.energy ? Math.max(Math.abs(result.quantum.energy), Math.abs(result.classical.energy)) * 1.2 : undefined} tone="violet" />
                    <EnergyBar label="FCI" value={result?.classical?.energy} max={result?.classical?.energy ? Math.abs(result.classical.energy) * 1.2 : undefined} tone="slate" isRef />
                  </div>

                  {result && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Accuracy </span>
                      <span className="font-mono text-sm font-black text-emerald-800">{result.comparison?.accuracy_percent?.toFixed(2) ?? result.quantum?.accuracy?.toFixed(2) ?? '—'}%</span>
                    </div>
                  )}
                </div>
              </FlowBox>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Sub-components ─── */

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

function FlowBox({ icon, label, title, tone, stage, children }: { icon: ReactNode; label: string; title: string; tone: Tone; stage?: string; children: ReactNode }) {
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
          <div className="flex items-center gap-2">
            {stage && (
              <span className="rounded bg-white/80 px-1.5 py-0.5 text-[9px] font-black text-slate-400 shadow-sm">
                {stage}
              </span>
            )}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">{label}</p>
          </div>
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

function GroundStateCinematic() {
  const width = 320;
  const height = 220;

  const wellPath = "M 40,20 C 40,220 120,200 280,80";
  const minX = 100;
  const minY = 168;

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Background grid */}
        <rect x="0" y="5" width={width} height={height - 10} rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="4 4" />
        
        {/* Y-axis (Energy) */}
        <line x1="20" y1="180" x2="20" y2="20" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrow)" />
        <text x="10" y="100" transform="rotate(-90 10,100)" fontSize="10" fill="#94a3b8" textAnchor="middle" className="font-mono font-bold tracking-widest uppercase">
          Energi (E)
        </text>

        {/* X-axis (Distance) */}
        <line x1="20" y1="180" x2="300" y2="180" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#arrow)" />
        <text x="160" y="196" fontSize="10" fill="#94a3b8" textAnchor="middle" className="font-mono font-bold tracking-widest uppercase">
          Konfigurasi Molekul
        </text>

        {/* The Well Curve */}
        <path d={wellPath} fill="none" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />

        {/* Ground State Level */}
        <line x1="20" y1={minY} x2="280" y2={minY} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
        <rect x="230" y={minY - 8} width="60" height="16" fill="white" fillOpacity="0.9" rx="4" />
        <text x="260" y={minY + 3} fontSize="10" fill="#059669" textAnchor="middle" className="font-mono font-black tracking-widest uppercase">
          E₀ MIN
        </text>

        {/* The Quantum State (Ball) trying to find minimum */}
        <circle cx={minX} cy={minY} r="6" fill="#10b981" className="animate-pulse" />
        <circle cx={minX} cy={minY} r="14" fill="#10b981" fillOpacity="0.2" className="animate-ping" />

        {/* Labels for other energy states (Excited states) to show spectrum */}
        <line x1="55" y1={minY - 40} x2="240" y2={minY - 40} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
        <text x="250" y={minY - 37} fontSize="8" fill="#94a3b8" className="font-mono font-bold">E₁</text>

        <line x1="45" y1={minY - 80} x2="260" y2={minY - 80} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
        <text x="270" y={minY - 77} fontSize="8" fill="#94a3b8" className="font-mono font-bold">E₂</text>
        
        {/* Title */}
        <text x={width/2} y="30" fontSize="11" fill="#475569" textAnchor="middle" className="font-mono font-black tracking-widest uppercase">
          Spektrum Energi Molekul
        </text>

        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

function EnergyBar({ label, value, max, tone, isRef }: { label: string; value?: number; max?: number; tone: 'violet' | 'slate'; isRef?: boolean }) {
  const displayValue = value !== undefined ? `${value.toFixed(6)} Ha` : isRef ? 'ref' : '—';
  const hasValue = value !== undefined;
  const barMax = max ?? (hasValue ? Math.abs(value!) * 1.2 : 1);
  const barWidth = hasValue && barMax > 0 ? `${(Math.abs(value!) / barMax) * 100}%` : '0%';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-bold ${tone === 'violet' ? 'text-violet-800' : 'text-slate-700'}`}>{label}</span>
        <span className={`font-mono font-black ${tone === 'violet' ? 'text-violet-900' : 'text-slate-800'}`}>{displayValue}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${tone === 'violet' ? 'bg-violet-500' : 'bg-slate-400'}`}
          style={{ width: barWidth }}
        />
      </div>
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

