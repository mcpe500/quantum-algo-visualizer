import { ArrowRight, Search } from 'lucide-react';
import { SectionCard } from '../layout';
import type { QFTBenchmarkResult, QFTCase } from '../../types/qft';

interface QFTProblemStatementProps {
  className?: string;
  caseData?: QFTCase | null;
  result?: QFTBenchmarkResult | null;
}

type SpectrumBin = { bin: number; magnitude: number };

function nextPowerOfTwo(value: number): number {
  if (value <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(value));
}

function padSignalToPowerOfTwo(signal: number[]): number[] {
  const targetLength = nextPowerOfTwo(signal.length);
  if (signal.length >= targetLength) return signal;
  return [...signal, ...Array.from({ length: targetLength - signal.length }, () => 0)];
}

function computeSpectrum(signal: number[]): SpectrumBin[] {
  const paddedSignal = padSignalToPowerOfTwo(signal);
  const n = paddedSignal.length;
  if (n === 0) return [];

  return Array.from({ length: n }, (_, k) => {
    let re = 0;
    let im = 0;
    for (let t = 0; t < n; t += 1) {
      const angle = (-2 * Math.PI * k * t) / n;
      re += paddedSignal[t] * Math.cos(angle);
      im += paddedSignal[t] * Math.sin(angle);
    }
    return { bin: k, magnitude: Math.sqrt(re * re + im * im) };
  });
}

function topBins(spectrum: SpectrumBin[], count = 4) {
  return [...spectrum]
    .sort((a, b) => (b.magnitude === a.magnitude ? a.bin - b.bin : b.magnitude - a.magnitude))
    .slice(0, count)
    .map((item) => item.bin);
}

function filterExistingBins(bins: number[], spectrum: SpectrumBin[], count = 4): number[] {
  const spectrumBins = new Set(spectrum.map((item) => item.bin));
  const uniqueBins: number[] = [];

  bins.forEach((bin) => {
    if (!spectrumBins.has(bin) || uniqueBins.includes(bin)) return;
    uniqueBins.push(bin);
  });

  return uniqueBins.length > 0 ? uniqueBins.slice(0, count) : topBins(spectrum, count);
}

function formatPrimaryBin(dominantBins: number[], spectrumLength: number): string {
  const first = dominantBins[0] ?? 0;
  const mirror = dominantBins.find((bin) => bin !== first && spectrumLength > 0 && bin === spectrumLength - first);
  return mirror === undefined ? `${first}` : `${first} / ${mirror}`;
}

export function QFTProblemStatement({ className = '', caseData, result }: QFTProblemStatementProps) {
  const effectiveCase = caseData ?? (result
    ? {
        case_id: result.case_id,
        n_points: result.n_points_original,
        signal_data: result.input_signal,
        signal_type: result.signal_type,
      }
    : null);
  const signal = effectiveCase?.signal_data ?? [];
  const paddedPointCount = result?.n_points_padded ?? nextPowerOfTwo(signal.length || effectiveCase?.n_points || 1);
  const spectrum = result
    ? result.fft.spectrum.map((p) => ({ bin: p.bin, magnitude: p.magnitude }))
    : computeSpectrum(signal);
  const dominantBins = filterExistingBins(result?.fft.dominant_bins ?? topBins(spectrum), spectrum);
  const primaryBinLabel = formatPrimaryBin(dominantBins, spectrum.length);

  if (!effectiveCase || signal.length === 0 || spectrum.length === 0) {
    return (
      <div className={`space-y-6 ${className}`} data-testid="qft-problem-statement-empty">
        <SectionCard title="Problem Statement QFT" icon={<Search className="h-5 w-5" />}>
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Memuat data sinyal QFT dari dataset aktif...
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="qft-problem-statement">
      <SectionCard title="" icon={null}>
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-5 shadow-sm sm:p-6 xl:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(16,185,129,0.14),transparent_30%)]" />

          <div className="relative z-10 mb-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-px w-10 shrink-0 bg-sky-500" />
              <span className="truncate font-mono text-sm font-semibold tracking-wider text-slate-600" data-testid="qft-case-id">{effectiveCase.case_id}</span>
            </div>
            <div className="shrink-0 rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-mono text-xs tracking-wider text-slate-500 shadow-sm">
              Problem Statement
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,1fr)_56px_minmax(360px,1.12fr)_56px_minmax(280px,1fr)] xl:items-stretch">
            <ProblemPanel label="01 Input" tone="sky">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-2xl font-bold text-slate-900">x[t]</p>
                  <p className="mt-1 text-sm text-slate-500">Sinyal waktu yang masih bercampur</p>
                </div>
                <span
                  className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-slate-500"
                  data-qft-ps-check="no-overflow"
                  data-testid="qft-input-count"
                >
                  {effectiveCase.n_points === paddedPointCount ? `${effectiveCase.n_points} titik` : `${effectiveCase.n_points} -> ${paddedPointCount} titik`}
                </span>
              </div>
              <WaveformCinematic data={signal} gradientId="qft-input-wave" />
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Masukan berupa deret amplitudo terhadap waktu. Pola periodik terlihat, tetapi komponen frekuensi dominannya belum langsung terbaca dari bentuk sinyal.
              </p>
            </ProblemPanel>

            <FlowArrow />

            <ProblemPanel label="02 Masalah" tone="amber">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">Mencari frekuensi dominan</p>
                  <p className="text-sm text-slate-500">dari domain waktu ke domain frekuensi</p>
                </div>
              </div>

              <DecompositionCinematic data={signal} dominantBins={dominantBins} />

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <p className="font-mono text-sm font-semibold text-amber-900">Inti Dekomposisi</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
                  Bagaimana memecah sinyal kompleks yang rumit menjadi kumpulan gelombang murni yang teratur secara frekuensi?
                </p>
              </div>
            </ProblemPanel>

            <FlowArrow />

            <ProblemPanel label="03 Output" tone="emerald">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-2xl font-bold text-emerald-700">X[k]</p>
                  <p className="mt-1 text-sm text-slate-500">Spektrum frekuensi dan bin dominan</p>
                </div>
                <span
                  className="shrink-0 whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-xs text-emerald-700"
                  data-qft-ps-check="no-overflow"
                  data-testid="qft-output-primary-bin"
                >
                  k = {primaryBinLabel}
                </span>
              </div>
              <SpectrumCinematic data={spectrum} dominantBins={dominantBins} />
              <div className="mt-4 flex flex-wrap gap-2" data-testid="qft-dominant-bins">
                {dominantBins.slice(0, 4).map((bin) => (
                  <span key={bin} className="whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 font-mono text-sm font-semibold text-emerald-700" data-qft-ps-check="no-overflow">
                    bin {bin}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Keluaran yang dicari bukan bentuk gelombang baru, melainkan posisi puncak pada spektrum. Puncak ini menunjukkan frekuensi yang paling kuat di dalam sinyal masukan.
              </p>
            </ProblemPanel>
          </div>

          <div className="relative z-10 mt-7 flex items-center justify-center">
            <div
              className="max-w-full rounded-full border border-slate-200 bg-white/75 px-5 py-2 text-center font-mono text-xs tracking-widest text-slate-500 shadow-sm"
              data-testid="qft-flow-summary"
            >
              x[t] -&gt; Fourier/QFT -&gt; X[k] -&gt; bin frekuensi dominan
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function ProblemPanel({ children, label, tone }: { children: React.ReactNode; label: string; tone: 'sky' | 'amber' | 'emerald' }) {
  const colors = {
    sky: 'text-sky-700 border-sky-100 bg-white/82',
    amber: 'text-amber-700 border-amber-100 bg-white/86',
    emerald: 'text-emerald-700 border-emerald-100 bg-white/82',
  };

  return (
    <div className="flex min-w-0 flex-col">
      <div className={`mb-3 font-mono text-xs font-bold uppercase tracking-[0.2em] ${colors[tone].split(' ')[0]}`}>{label}</div>
      <div className={`relative flex-1 rounded-3xl border p-5 shadow-sm backdrop-blur ${colors[tone]}`}>{children}</div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex items-center justify-center py-2 xl:py-0">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
        <ArrowRight className="h-5 w-5 rotate-90 xl:rotate-0" />
      </div>
    </div>
  );
}


function WaveformCinematic({ data, gradientId }: { data: number[]; gradientId: string }) {
  if (data.length === 0) return null;

  const width = 320;
  const height = 130;
  const mid = height / 2;
  const max = Math.max(...data.map((v) => Math.abs(v)), 1);

  const points = data
    .map((value, index) => {
      const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
      const y = mid - (value / max) * (height * 0.38);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const path = `M${points.split(' ').map((p) => p.split(',').join(' ')).join(' L')}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={mid} x2={width} y2={mid} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4 8" />
      <path d={`${path} L${width} ${height} L0 ${height} Z`} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((value, index) => {
        const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
        const y = mid - (value / max) * (height * 0.38);
        return <circle key={index} cx={x} cy={y} r="2" fill="#0284c7" opacity="0.7" />;
      })}
    </svg>
  );
}

function DecompositionCinematic({ data, dominantBins }: { data: number[], dominantBins: number[] }) {
  if (data.length === 0) return null;

  const width = 320;
  const height = 200;

  const maxData = Math.max(...data.map(Math.abs), 1);
  const messyPath = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = 40 - (v / maxData) * 20;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' L ');

  const topBins = dominantBins.length > 0 ? dominantBins.slice(0, 3) : [1];
  const colors = ['#0284c7', '#4f46e5', '#059669']; // sky-600, indigo-600, emerald-600

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        {/* Highlight box behind original wave */}
        <rect x="0" y="5" width={width} height="70" rx="12" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="4 4" />
        
        {/* The complex signal */}
        <path d={`M${messyPath}`} fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x={width/2} y="70" fontSize="9" fill="#94a3b8" textAnchor="middle" className="font-mono font-bold tracking-widest uppercase">
          Sinyal Kompleks
        </text>

        {/* Central arrow indicating decomposition */}
        <g transform={`translate(${width/2}, 80)`}>
          <line x1="0" y1="0" x2="0" y2="15" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="2 2" />
          <polygon points="-4,12 4,12 0,18" fill="#cbd5e1" />
        </g>

        {/* The constituent waves */}
        {topBins.map((bin, index) => {
          const yCenter = 120 + index * 32;
          
          const wavePath = Array.from({ length: 300 }, (_, i) => {
            const x = (i / 299) * width;
            const val = Math.cos(2 * Math.PI * bin * (i / 299)); 
            const y = yCenter - val * 10;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' L ');

          return (
            <g key={bin}>
              <path d={`M${wavePath}`} fill="none" stroke={colors[index % colors.length]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x={width - 55} y={yCenter - 14} width="55" height="16" fill="white" fillOpacity="0.85" rx="4" />
              <text x={width - 4} y={yCenter - 2} fontSize="10" fill={colors[index % colors.length]} textAnchor="end" className="font-mono font-black tracking-widest uppercase">
                BIN {bin}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SpectrumCinematic({ data, dominantBins }: { data: SpectrumBin[]; dominantBins: number[] }) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((item) => item.magnitude), 1);

  return (
    <div className="flex h-32 items-end gap-1 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-3 shadow-inner">
      {data.map((item) => {
        const active = dominantBins.includes(item.bin);
        return (
          <div
            key={item.bin}
            className={`min-w-[3px] flex-1 rounded-t-md transition-all duration-300 ${active ? 'bg-emerald-500' : 'bg-slate-200'}`}
            style={{ height: `${Math.max(5, (item.magnitude / max) * 96)}px` }}
            title={`bin ${item.bin}`}
          />
        );
      })}
    </div>
  );
}
