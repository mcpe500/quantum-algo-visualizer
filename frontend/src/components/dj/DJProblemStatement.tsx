import type { ReactNode } from 'react';
import { ArrowRight, Binary, CheckCircle2, HelpCircle, Search } from 'lucide-react';
import { SectionCard } from '../layout';
import type { DJCase } from '../../types/dj';

interface DJProblemStatementProps {
  className?: string;
  caseData?: DJCase | null;
}

type Tone = 'blue' | 'amber' | 'indigo' | 'orange';

export function DJProblemStatement({ className = '', caseData }: DJProblemStatementProps) {
  const truthTable = caseData?.oracle_definition?.truth_table ?? {};
  const entries = Object.entries(truthTable).sort(([a], [b]) => a.localeCompare(b));
  const zeros = entries.filter(([, output]) => output === 0).length;
  const ones = entries.filter(([, output]) => output === 1).length;
  const totalInputs = entries.length;
  const nQubits = caseData?.n_qubits ?? 0;
  const classification = caseData?.expected_classification ?? 'CONSTANT';
  const worstCaseQueries = nQubits > 0 ? 2 ** (nQubits - 1) + 1 : '-';

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionCard title="Problem Statement Deutsch-Jozsa" icon={<HelpCircle className="h-5 w-5" />}>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <HeaderBadge caseId={caseData?.case_id} values={[`${nQubits || '?'} qubit`, `${totalInputs || 0} input`, `${worstCaseQueries} → 1 query`]} />

          <div className="grid gap-4 lg:grid-cols-[1.15fr_auto_0.9fr_auto_0.8fr] lg:items-center">
            <FlowPanel tone="blue" icon={<Binary className="h-5 w-5" />} label="Input" title="Truth table f(x)">
              {entries.length > 0 ? (
                <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(4, Math.ceil(Math.sqrt(entries.length)))}, minmax(0, 1fr))` }}>
                  {entries.map(([input, output]) => (
                    <div key={input} className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-center">
                      <div className="font-mono text-[11px] font-bold text-slate-700">{input}</div>
                      <div className={`mt-1 rounded-md py-1 font-mono text-xs font-black text-white ${output === 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
                        {output}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyHint text="Truth table belum tersedia." />
              )}
            </FlowPanel>

            <DesktopArrow />

            <FlowPanel tone="amber" icon={<Search className="h-5 w-5" />} label="Oracle" title="0/1 balance check">
              <div className="grid grid-cols-2 gap-3">
                <CountBox label="0" value={zeros} tone="blue" total={totalInputs} />
                <CountBox label="1" value={ones} tone="orange" total={totalInputs} />
              </div>
              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-amber-200 bg-white p-3">
                <QueryBadge label="Klasik" value={String(worstCaseQueries)} />
                <ArrowRight className="h-4 w-4 text-amber-400" />
                <QueryBadge label="DJ" value="1" strong />
              </div>
            </FlowPanel>

            <DesktopArrow />

            <FlowPanel tone={classification === 'CONSTANT' ? 'indigo' : 'orange'} icon={<CheckCircle2 className="h-5 w-5" />} label="Output" title="Klasifikasi">
              <div className={`rounded-2xl border p-5 text-center ${classification === 'CONSTANT' ? 'border-indigo-200 bg-indigo-50' : 'border-orange-200 bg-orange-50'}`}>
                <div className={`text-5xl font-black ${classification === 'CONSTANT' ? 'text-indigo-700' : 'text-orange-700'}`}>
                  {classification === 'CONSTANT' ? 'C' : 'B'}
                </div>
                <div className={`mt-3 rounded-full px-3 py-1 text-xs font-black ${classification === 'CONSTANT' ? 'bg-indigo-100 text-indigo-800' : 'bg-orange-100 text-orange-800'}`}>
                  {classification}
                </div>
                <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{caseData?.case_id ?? 'Case'}</div>
              </div>
            </FlowPanel>
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
          <span key={value} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function FlowPanel({ tone, icon, label, title, children }: { tone: Tone; icon: ReactNode; label: string; title: string; children: ReactNode }) {
  const toneClass = {
    blue: 'from-blue-50 to-white border-blue-200 text-blue-600',
    amber: 'from-amber-50 to-white border-amber-200 text-amber-600',
    indigo: 'from-indigo-50 to-white border-indigo-200 text-indigo-600',
    orange: 'from-orange-50 to-white border-orange-200 text-orange-600',
  }[tone];

  return (
    <div className={`min-h-[300px] rounded-2xl border bg-gradient-to-br p-4 ${toneClass}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-white p-2 shadow-sm">{icon}</div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-75">{label}</p>
          <h3 className="mt-1 text-base font-black text-slate-900">{title}</h3>
        </div>
      </div>
      {children}
    </div>
  );
}

function DesktopArrow() {
  return (
    <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 lg:flex">
      <ArrowRight className="h-5 w-5" />
    </div>
  );
}

function CountBox({ label, value, tone, total }: { label: string; value: number; tone: 'blue' | 'orange'; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className={`rounded-xl border p-3 text-center ${tone === 'blue' ? 'border-blue-200 bg-blue-50' : 'border-orange-200 bg-orange-50'}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">f={label}</p>
      <p className={`mt-1 text-3xl font-black ${tone === 'blue' ? 'text-blue-700' : 'text-orange-700'}`}>{value}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
        <div className={tone === 'blue' ? 'h-full bg-blue-500' : 'h-full bg-orange-500'} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function QueryBadge({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`font-mono text-2xl font-black ${strong ? 'text-amber-700' : 'text-slate-700'}`}>{value}</p>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{text}</div>;
}
