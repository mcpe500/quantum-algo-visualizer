import {
  ArrowRight,
  Atom,
  Binary,
  Braces,
  Calculator,
  CircleDot,
  FunctionSquare,
  Grid3X3,
  Sigma,
  Sparkles,
} from 'lucide-react';
import type { VQEBenchmarkResult } from '../../../types/vqe';
import { buildFCIVisualizationModel } from './engine';

interface FCIBookFigureProps {
  result: VQEBenchmarkResult;
}

const toneClass = {
  blue: 'border-blue-200 bg-blue-50 text-blue-900',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  rose: 'border-rose-200 bg-rose-50 text-rose-900',
  slate: 'border-slate-200 bg-slate-50 text-slate-900',
  violet: 'border-violet-200 bg-violet-50 text-violet-900',
} as const;

type Tone = keyof typeof toneClass;

function MiniPanel({
  title,
  children,
  tone = 'slate',
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border p-2 ${toneClass[tone]} ${className}`}>
      <div className="mb-1.5 text-[9px] font-black uppercase tracking-wide opacity-65">{title}</div>
      {children}
    </div>
  );
}

function FlowRail({ model }: { model: ReturnType<typeof buildFCIVisualizationModel> }) {
  const icons = [Atom, CircleDot, Braces, FunctionSquare, ArrowRight, Binary, Grid3X3, Calculator];

  return (
    <div className="grid grid-cols-8 gap-1.5">
      {model.flow.map((step, index) => {
        const Icon = icons[index] ?? CircleDot;
        return (
          <div key={step.id} className="relative rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
            {index < model.flow.length - 1 && (
              <div className="absolute -right-2 top-1/2 z-10 h-px w-2 bg-slate-300" />
            )}
            <div className="mb-0.5 flex items-center gap-1">
              <Icon className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-[9px] font-black uppercase tracking-wide text-slate-500">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="text-[11px] font-black leading-tight text-slate-900">{step.title}</div>
            <div className="mt-1 font-mono text-[10px] font-semibold leading-tight text-slate-700">{step.value}</div>
            <div className="mt-0.5 text-[8px] font-medium leading-tight text-slate-500">{step.detail}</div>
          </div>
        );
      })}
    </div>
  );
}

function MoleculeSketch({ model }: { model: ReturnType<typeof buildFCIVisualizationModel> }) {
  return (
    <MiniPanel title="input pure fci" tone="blue" className="col-span-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="text-xl font-black leading-none">{model.molecule.formula}</div>
          <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
            <span>R: {model.molecule.distanceAngstrom.toFixed(3)} A</span>
            <span>{model.distanceBohr.toFixed(5)} bohr</span>
            <span>{model.molecule.basis}</span>
            <span>q={model.molecule.charge}, M={model.molecule.multiplicity}</span>
          </div>
          <div className="rounded-md bg-white/70 px-2 py-1 font-mono text-[10px] font-bold text-blue-700">
            FCI(VQE-01) = FCI(VQE-02)
          </div>
        </div>
        <div className="relative flex w-36 shrink-0 items-center justify-center py-6">
          <div className="absolute h-1 w-24 rounded-full bg-blue-200" />
          <div className="absolute top-1/2 -mt-6 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-black text-blue-700 shadow-sm">
            0.735 A
          </div>
          <div className="z-10 grid h-12 w-12 place-items-center rounded-full border-2 border-blue-200 bg-white text-lg font-black text-blue-700">
            H
          </div>
          <div className="z-10 ml-14 grid h-12 w-12 place-items-center rounded-full border-2 border-rose-200 bg-white text-lg font-black text-rose-700">
            H
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {model.ignoredVqeFields.map((field) => (
          <span key={field} className="rounded-full bg-white/75 px-2 py-0.5 text-[9px] font-black text-slate-500 line-through">
            {field}
          </span>
        ))}
      </div>
    </MiniPanel>
  );
}

function OrbitalStack({ model }: { model: ReturnType<typeof buildFCIVisualizationModel> }) {
  return (
    <MiniPanel title="basis -> molecular orbital" tone="emerald" className="col-span-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="space-y-2">
          {model.spatialOrbitals.slice(0, 2).map((orbital) => (
            <div key={orbital.id} className="rounded-md bg-white/75 p-2">
              <div className="font-mono text-[12px] font-black">{orbital.label}</div>
              <div className="text-[10px] font-semibold text-emerald-700">{orbital.role}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-1 text-emerald-700">
          <Sigma className="h-5 w-5" />
          <span className="font-mono text-[10px] font-black">C</span>
        </div>
        <div className="space-y-2">
          {model.spatialOrbitals.slice(2).reverse().map((orbital) => (
            <div key={orbital.id} className="rounded-md bg-white/75 p-2">
              <div className="font-mono text-[12px] font-black">{orbital.label}</div>
              <div className="text-[10px] font-semibold text-emerald-700">{orbital.role}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-md bg-white/70 px-2 py-1 font-mono text-[10px] font-bold text-emerald-800">
        phi_p = sum_mu C_mu,p chi_mu
      </div>
    </MiniPanel>
  );
}

function SpinOrbitalLadder({ model }: { model: ReturnType<typeof buildFCIVisualizationModel> }) {
  return (
    <MiniPanel title="spin orbital dan reference" tone="amber" className="col-span-2">
      <div className="space-y-2">
        <div>
          <div className="mb-1 text-[10px] font-bold text-amber-700">Energy naik</div>
          <div className="space-y-2">
            <div className="rounded-md bg-white/75 p-2">
              <div className="mb-1 font-mono text-[10px] font-black">phi2 antibonding</div>
              <div className="flex gap-2">
                <span className="grid h-6 flex-1 place-items-center rounded border border-amber-200 bg-white text-[12px] font-black"> </span>
                <span className="grid h-6 flex-1 place-items-center rounded border border-amber-200 bg-white text-[12px] font-black"> </span>
              </div>
            </div>
            <div className="rounded-md bg-white/75 p-2">
              <div className="mb-1 font-mono text-[10px] font-black">phi1 bonding</div>
              <div className="flex gap-2">
                <span className="grid h-6 flex-1 place-items-center rounded border border-amber-200 bg-white text-[12px] font-black">up</span>
                <span className="grid h-6 flex-1 place-items-center rounded border border-amber-200 bg-white text-[12px] font-black">dn</span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-md bg-white/75 p-2 text-[10px] font-bold leading-tight">
          {model.electronCount} elektron, S={model.totalSpin}, Nalpha={model.alphaElectrons}, Nbeta={model.betaElectrons}
        </div>
      </div>
    </MiniPanel>
  );
}

function DeterminantCloud({ model }: { model: ReturnType<typeof buildFCIVisualizationModel> }) {
  const classNameBySpin = {
    singlet: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    mixed: 'border-blue-200 bg-blue-100 text-blue-800',
    triplet: 'border-slate-200 bg-white text-slate-500',
  };

  return (
    <MiniPanel title="determinant -> csf singlet" tone="violet" className="col-span-4">
      <div className="grid grid-cols-[1fr_1.15fr] gap-3">
        <div>
          <div className="mb-2 text-[10px] font-bold text-violet-700">C(4,2)=6 determinant</div>
          <div className="grid grid-cols-2 gap-1.5">
            {model.determinants.map((determinant) => (
              <div
                key={determinant.bitstring}
                className={`rounded-md border px-2 py-1 font-mono text-[11px] font-black ${classNameBySpin[determinant.spinClass]}`}
                title={determinant.label}
              >
                |{determinant.bitstring}&gt;
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-bold text-violet-700">3 CSF singlet untuk FCI</div>
          <div className="space-y-1.5">
            {model.singletConfigurations.map((configuration) => (
              <div key={configuration.id} className="rounded-md bg-white/80 p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] font-black">{configuration.name}</span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-black text-violet-700">
                    {configuration.notation}
                  </span>
                </div>
                <div className="mt-0.5 text-[9px] font-semibold leading-tight text-slate-600">
                  {configuration.interpretation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MiniPanel>
  );
}

function HamiltonianMatrix() {
  const labels = ['Phi1', 'Phi2', 'Phi3'];
  const cells = ['H11', 'H12', 'H13', 'H21', 'H22', 'H23', 'H31', 'H32', 'H33'];

  return (
    <MiniPanel title="matrix hamiltonian" tone="rose" className="col-span-4">
      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
        <div className="grid grid-cols-3 gap-1">
          {cells.map((cell) => {
            const isDiagonal = cell[1] === cell[2];
            return (
              <div
                key={cell}
                className={`grid h-8 w-11 place-items-center rounded-md border font-mono text-[10px] font-black ${
                  isDiagonal ? 'border-rose-300 bg-white text-rose-700' : 'border-slate-200 bg-rose-100/70 text-slate-700'
                }`}
              >
                {cell}
              </div>
            );
          })}
        </div>
        <div className="space-y-2">
          <div className="rounded-md bg-white/75 p-2 font-mono text-[11px] font-black">
            H_ij = &lt;Phi_i | H | Phi_j&gt;
          </div>
          <div className="rounded-md bg-white/75 p-2 text-[10px] font-bold leading-tight text-rose-800">
            diagonal = energi konfigurasi, off-diagonal = mixing korelasi elektron.
          </div>
          <div className="flex flex-wrap gap-1">
            {labels.map((label) => (
              <span key={label} className="rounded-full bg-white px-2 py-0.5 font-mono text-[10px] font-black text-rose-700">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </MiniPanel>
  );
}

function ResultPanel({ model }: { model: ReturnType<typeof buildFCIVisualizationModel> }) {
  return (
    <MiniPanel title="hasil akhir" tone="slate" className="col-span-4">
      <div className="grid h-full grid-cols-[1.1fr_0.9fr] gap-3">
        <div className="rounded-lg bg-white p-3">
          <div className="text-[10px] font-black uppercase tracking-wide text-slate-500">ground-state energy</div>
          <div className="mt-1 font-mono text-xl font-black leading-none text-slate-950">
            {model.output.energyHartree.toFixed(6)} Ha
          </div>
          <div className="mt-2 rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-black text-slate-700">
            {model.output.eigenProblem}
          </div>
        </div>
        <div className="space-y-2">
          <div className="rounded-md bg-white p-2">
            <div className="text-[10px] font-black text-slate-500">wavefunction</div>
            <div className="mt-1 font-mono text-[11px] font-black leading-tight text-slate-900">
              Psi0 = C1 Phi1 + C2 Phi2 + C3 Phi3
            </div>
          </div>
          <div className="rounded-md bg-white p-2">
            <div className="text-[10px] font-black text-slate-500">laporan</div>
            <div className="mt-1 text-[10px] font-bold leading-tight text-slate-700">
              {model.output.matrixSize}; total energy sudah mengikuti referensi FCI backend.
            </div>
          </div>
        </div>
      </div>
    </MiniPanel>
  );
}

export function FCIBookFigure({ result }: FCIBookFigureProps) {
  const model = buildFCIVisualizationModel(result);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[1180px] rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-950">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-black leading-tight">Pure FCI Engine - H2 / STO-3G</h3>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Alur klasik eksak: dataset molekul {'->'} integral {'->'} konfigurasi {'->'} matrix {'->'} eigenvalue ground state.
            </p>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-right">
            <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">rasio figure</div>
            <div className="font-mono text-sm font-black text-slate-900">landscape 16:9 ready</div>
          </div>
        </div>

        <FlowRail model={model} />

        <div className="mt-2 grid grid-cols-12 gap-2">
          <MoleculeSketch model={model} />
          <OrbitalStack model={model} />
          <SpinOrbitalLadder model={model} />
          <DeterminantCloud model={model} />
          <HamiltonianMatrix />
          <ResultPanel model={model} />
        </div>
      </div>
    </div>
  );
}
