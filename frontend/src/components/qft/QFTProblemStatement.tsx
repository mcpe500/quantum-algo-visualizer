import type { ReactNode } from 'react';
import { ArrowRight, BarChart3, RadioTower, Waves, Zap } from 'lucide-react';
import { SectionCard } from '../layout';
import type { QFTBenchmarkResult, QFTCase } from '../../types/qft';

interface QFTProblemStatementProps {
  className?: string;
  caseData?: QFTCase | null;
  result?: QFTBenchmarkResult | null;
}

type SpectrumBin = { bin: number; magnitude: number };

type Tone = 'cyan' | 'indigo' | 'emerald';

function computeSpectrum(signal: number[]): SpectrumBin[] {
  const n = signal.length;
  if (n === 0) return [];

  return Array.from({ length: Math.ceil(n / 2) }, (_, k) => {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t += 1) {
      const angle = (-2 * Math.PI * k * t) / n;
      re += signal[t] * Math.cos(angle);
      im += signal[t] * Math.sin(angle);
    }
    return { bin: k, magnitude: Math.sqrt(re * re + im * im) };
  });
}

function topBins(spectrum: SpectrumBin[], count = 3) {
  return [...spectrum]
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, count)
    .map((item) => item.bin);
}

export function QFTProblemStatement({ className = '', caseData, result }: QFTProblemStatementProps) {
  const signal = caseData?.signal_data ?? result?.input_signal ?? [];
  const spectrum = result
    ? result.fft.spectrum.map((point) => ({ bin: point.bin, magnitude: point.magnitude })).slice(0, Math.ceil(result.fft.n_points / 2))
    : computeSpectrum(signal);
  const dominantBins = result?.fft.dominant_bins ?? topBins(spectrum);
  const nPoints = caseData?.n_points ?? result?.n_points_original ?? signal.length;

  return (
    <div className={`space-y-6 ${className}`}>
      <SectionCard title="Problem Statement QFT" icon={<Waves className="h-5 w-5" />}>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <HeaderBadge
            caseId={caseData?.case_id ?? result?.case_id}
            values={[`${nPoints || '?'} titik`, caseData?.signal_type ?? result?.signal_type ?? 'signal', caseData?.description ?? 'domain waktu → frekuensi']}
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_auto_0.7fr_auto_1fr] lg:items-stretch">
            <FlowBox icon={<Waves className="h-5 w-5" />} label="Input" title="x[t]" tone="cyan">
              <Waveform data={signal} />
            </FlowBox>

            <DesktopArrow />

            <FlowBox icon={<Zap className="h-5 w-5" />} label="Transform" title="𝓕" tone="indigo">
              <div className="flex h-56 flex-col items-center justify-center rounded-2xl border border-indigo-100 bg-white text-center">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <SignalGlyph label="time" />
                  <ArrowRight className="h-6 w-6 text-indigo-400" />
                  <SignalGlyph label="freq" bars />
                </div>
                <div className="mt-5 rounded-full bg-indigo-100 px-4 py-2 font-mono text-3xl font-black text-indigo-700">QFT</div>
              </div>
            </FlowBox>

            <DesktopArrow />

            <FlowBox icon={<BarChart3 className="h-5 w-5" />} label="Output" title="X[k]" tone="emerald">
              <Spectrum data={spectrum} dominantBins={dominantBins} />
              <div className="mt-3 flex flex-wrap gap-2">
                {dominantBins.slice(0, 3).map((bin) => (
                  <span key={bin} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                    bin {bin}
                  </span>
                ))}
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
          <span key={value} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function FlowBox({ icon, label, title, tone, children }: { icon: ReactNode; label: string; title: string; tone: Tone; children: ReactNode }) {
  const toneClass = {
    cyan: 'border-cyan-200 bg-cyan-50/60 text-cyan-600',
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

function Waveform({ data }: { data: number[] }) {
  if (data.length === 0) {
    return <EmptyCanvas text="Sinyal belum tersedia." />;
  }

  const width = 280;
  const height = 160;
  const mid = height / 2;
  const max = Math.max(...data.map((value) => Math.abs(value)), 1);
  const points = data
    .map((value, index) => {
      const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
      const y = mid - (value / max) * (height * 0.38);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full rounded-2xl border border-cyan-100 bg-white" role="img" aria-label="Input signal waveform">
      <line x1="0" y1={mid} x2={width} y2={mid} stroke="#cbd5e1" strokeWidth="1" />
      <polyline points={points} fill="none" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((value, index) => {
        const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
        const y = mid - (value / max) * (height * 0.38);
        return <circle key={index} cx={x} cy={y} r="2" fill="#06b6d4" />;
      })}
      <text x="12" y="20" fill="#0891b2" fontSize="11" fontWeight="800">x[t]</text>
    </svg>
  );
}

function SignalGlyph({ label, bars = false }: { label: string; bars?: boolean }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-center">
      <div className="flex h-16 w-20 items-end justify-center gap-1">
        {bars ? (
          [26, 44, 18, 56, 32].map((h, i) => <div key={i} className="w-2 rounded-t bg-indigo-500" style={{ height: h }} />)
        ) : (
          <svg viewBox="0 0 80 48" className="h-12 w-20">
            <path d="M2 24 C14 4 25 4 38 24 S62 44 78 24" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-indigo-500">{label}</p>
    </div>
  );
}

function Spectrum({ data, dominantBins }: { data: SpectrumBin[]; dominantBins: number[] }) {
  if (data.length === 0) {
    return <EmptyCanvas text="Spektrum belum tersedia." />;
  }

  const max = Math.max(...data.map((item) => item.magnitude), 1);

  return (
    <div className="flex h-56 items-end gap-1 rounded-2xl border border-emerald-100 bg-white p-3">
      {data.map((item) => {
        const active = dominantBins.includes(item.bin);
        return (
          <div key={item.bin} className="flex flex-1 flex-col items-center justify-end gap-1" title={`bin ${item.bin}: ${item.magnitude.toFixed(3)}`}>
            <div
              className={`w-full rounded-t-sm ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}
              style={{ height: `${Math.max(4, (item.magnitude / max) * 150)}px` }}
            />
            {active && <RadioTower className="h-3 w-3 text-emerald-600" />}
          </div>
        );
      })}
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

function EmptyCanvas({ text }: { text: string }) {
  return <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">{text}</div>;
}
