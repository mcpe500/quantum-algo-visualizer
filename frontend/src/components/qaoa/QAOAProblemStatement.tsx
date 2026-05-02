import type { ReactNode } from 'react';
import { ArrowRight, GitBranch, Scissors, Target, Workflow } from 'lucide-react';
import { SectionCard } from '../layout';
import type { QAOABenchmarkResult, QAOACase } from '../../types/qaoa';

interface QAOAProblemStatementProps {
  className?: string;
  caseData?: QAOACase | null;
  result?: QAOABenchmarkResult | null;
}

type Edge = [number, number];
type Tone = 'emerald' | 'amber' | 'indigo';

type CutSolution = {
  bitstring: string;
  partition: number[];
  cut: number;
};

function getEdges(matrix: number[][]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = i + 1; j < matrix[i].length; j += 1) {
      if (matrix[i][j]) edges.push([i, j]);
    }
  }
  return edges;
}

function cutValue(matrix: number[][], bits: number[]) {
  let total = 0;
  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = i + 1; j < matrix[i].length; j += 1) {
      if (matrix[i][j] && bits[i] !== bits[j]) total += matrix[i][j];
    }
  }
  return total;
}

function solveMaxCut(matrix: number[][]): CutSolution | null {
  const n = matrix.length;
  if (n === 0) return null;

  let bestBits = Array.from({ length: n }, () => 0);
  let bestCut = -Infinity;
  const total = 2 ** Math.max(n - 1, 0);

  for (let mask = 0; mask < total; mask += 1) {
    const bits = Array.from({ length: n }, (_, i) => (mask >> i) & 1);
    const value = cutValue(matrix, bits);
    if (value > bestCut) {
      bestCut = value;
      bestBits = bits;
    }
  }

  return {
    bitstring: bestBits.join(''),
    partition: bestBits,
    cut: bestCut,
  };
}

function coords(n: number) {
  const center = 100;
  const radius = n <= 3 ? 56 : 66;
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  });
}

export function QAOAProblemStatement({ className = '', caseData, result }: QAOAProblemStatementProps) {
  const matrix = caseData?.graph?.adjacency_matrix ?? result?.adjacency_matrix ?? [];
  const edges = getEdges(matrix);
  const solved = solveMaxCut(matrix);
  const solution: CutSolution | null = result
    ? {
        bitstring: result.exact.optimal_partition.join(''),
        partition: result.exact.optimal_partition,
        cut: result.exact.optimal_cut,
      }
    : solved;

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionCard title="Problem Statement QAOA" icon={<GitBranch className="h-5 w-5" />}>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <HeaderBadge caseId={caseData?.case_id ?? result?.case_id} values={[`${matrix.length || '?'} node`, `${edges.length || '?'} edge`, `p=${caseData?.p_layers ?? result?.p_layers ?? '?'}`]} />

          <div className="grid gap-4 lg:grid-cols-[1fr_auto_0.76fr_auto_1fr] lg:items-stretch">
            <FlowBox icon={<Workflow className="h-5 w-5" />} label="Input" title="Graph G(V,E)" tone="emerald">
              <GraphFigure matrix={matrix} edges={edges} />
            </FlowBox>

            <DesktopArrow />

            <FlowBox icon={<Scissors className="h-5 w-5" />} label="Objective" title="Max-Cut Problem" tone="amber">
              <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-amber-100 bg-white p-4 text-center">
                <p className="mb-4 text-xs font-bold leading-relaxed text-amber-700">
                  Maksimalkan jumlah sisi (edge) yang terpotong antar dua partisi
                </p>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <GroupBadge label="0" color="bg-blue-600" />
                  <div className="flex flex-col items-center px-1">
                    <Scissors className="h-6 w-6 text-amber-500" />
                    <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-amber-500">Cut</span>
                  </div>
                  <GroupBadge label="1" color="bg-red-600" />
                </div>
                <div className="mt-4 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 font-mono text-lg font-black text-amber-700 shadow-sm">
                  max C(z)
                </div>
              </div>
            </FlowBox>

            <DesktopArrow />

            <FlowBox icon={<Target className="h-5 w-5" />} label="Output" title="Partition + cut" tone="indigo">
              <GraphFigure matrix={matrix} edges={edges} partition={solution?.partition} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <OutputPill label="z" value={solution?.bitstring ?? '-'} />
                <OutputPill label="cut" value={solution?.cut ?? '-'} />
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
          <span key={value} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function FlowBox({ icon, label, title, tone, children }: { icon: ReactNode; label: string; title: string; tone: Tone; children: ReactNode }) {
  const toneClass = {
    emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-600',
    amber: 'border-amber-200 bg-amber-50/60 text-amber-600',
    indigo: 'border-indigo-200 bg-indigo-50/60 text-indigo-600',
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

function GraphFigure({ matrix, edges, partition }: { matrix: number[][]; edges: Edge[]; partition?: number[] }) {
  if (matrix.length === 0) {
    return <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">Graph belum tersedia.</div>;
  }

  const points = coords(matrix.length);

  return (
    <svg viewBox="0 0 200 200" className="mx-auto h-56 w-full rounded-2xl border border-slate-100 bg-white" role="img" aria-label="Max-Cut graph">
      {edges.map(([u, v]) => {
        const crossing = partition ? partition[u] !== partition[v] : false;
        return (
          <line
            key={`${u}-${v}`}
            x1={points[u].x}
            y1={points[u].y}
            x2={points[v].x}
            y2={points[v].y}
            stroke={crossing ? '#f59e0b' : '#94a3b8'}
            strokeWidth={crossing ? 5 : 3}
            strokeLinecap="round"
          />
        );
      })}
      {points.map((point, index) => {
        const group = partition?.[index] ?? 0;
        return (
          <g key={index} transform={`translate(${point.x}, ${point.y})`}>
            <circle r="18" fill={partition ? (group === 0 ? '#2563eb' : '#dc2626') : '#10b981'} stroke="white" strokeWidth="4" />
            <text y="5" textAnchor="middle" fill="white" fontSize="13" fontWeight="800">
              {index}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GroupBadge({ label, color }: { label: string; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${color} text-2xl font-black text-white`}>{label}</div>
    </div>
  );
}

function OutputPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">{label}</p>
      <p className="mt-1 font-mono text-base font-black text-indigo-800">{value}</p>
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
