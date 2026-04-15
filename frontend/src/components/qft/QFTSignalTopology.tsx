import { useEffect, useMemo, useState } from 'react';
import { Activity, Waves, Zap, GitCommitHorizontal } from 'lucide-react';
import { qftApi } from '../../services/api';
import type { QFTCase } from '../../types/qft';

interface SignalWaveformProps {
  data: number[];
  gradientId: string;
}

function SignalWaveform({ data, gradientId }: SignalWaveformProps) {
  const isEmpty = data.length === 0;
  const chartData = isEmpty ? [0] : data;

  const { pathLine, pathArea, zeroYPercent, chartPoints } = useMemo(() => {
    const maxVal = Math.max(...chartData);
    const minVal = Math.min(...chartData);
    const range = maxVal - minVal || 1;
    const padding = range * 0.15;
    const yMin = minVal - padding;
    const yMax = maxVal + padding;
    const yRange = yMax - yMin || 1;

    const width = 600;
    const height = 240;
    const denominator = Math.max(1, chartData.length - 1);

    const chartPointsLocal = chartData.map((val, i) => {
      const x = (i / denominator) * width;
      const y = height - ((val - yMin) / yRange) * height;
      return { x, y };
    });

    const points = chartPointsLocal.map((point) => `${point.x},${point.y}`);
    const pathLineLocal = `M ${points.join(' L ')}`;
    const zeroYRaw = height - ((0 - yMin) / yRange) * height;
    const zeroY = Math.min(height, Math.max(0, zeroYRaw));
    const pathAreaLocal = `${pathLineLocal} L ${width},${zeroY} L 0,${zeroY} Z`;

    return {
      pathLine: pathLineLocal,
      pathArea: pathAreaLocal,
      zeroYPercent: (zeroY / height) * 100,
      chartPoints: chartPointsLocal,
    };
  }, [chartData]);

  if (isEmpty) {
    return (
      <div className="relative w-full h-48 sm:h-64 bg-white rounded-xl border-2 border-slate-200 overflow-hidden flex items-center justify-center">
        <span className="text-sm font-semibold text-slate-400 tracking-wide">Signal data kosong</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 sm:h-64 bg-white rounded-xl border-2 border-slate-200 overflow-hidden flex items-center justify-center group">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(to right, #CBD5E1 1px, transparent 1px), linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div
        className="absolute left-0 w-full border-t-2 border-slate-300 border-dashed pointer-events-none"
        style={{ top: `${zeroYPercent}%` }}
      />

      <svg viewBox="0 0 600 240" className="w-full h-full drop-shadow-sm overflow-visible px-4 sm:px-6" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <path d={pathArea} fill={`url(#${gradientId})`} className="transition-all duration-700 ease-in-out" />

        <path
          d={pathLine}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-700 ease-in-out group-hover:drop-shadow-[0_6px_10px_rgba(59,130,246,0.4)]"
        />

        {chartPoints.map((point, i) => {
          return (
            <circle
              key={`point-${i}`}
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="#FFFFFF"
              stroke="#3B82F6"
              strokeWidth="2"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          );
        })}
      </svg>
    </div>
  );
}

interface DatasetCardProps {
  data: QFTCase;
  index: number;
  mounted: boolean;
}

function DatasetCard({ data, index, mounted }: DatasetCardProps) {
  const isMixed = data.signal_type.includes('mixed');
  const Icon = isMixed ? Activity : Waves;
  const signalLabel = data.signal_type.replace('synthetic_', '').replace('_', ' ');

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col h-full transform transition-all duration-700 ease-out shadow-sm hover:shadow-[0_16px_50px_rgb(0,0,0,0.08)] ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="p-8 sm:p-10 pb-6 flex justify-between items-start bg-white">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-blue-500">
              <Zap size={24} />
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight">{data.case_id}</h2>
          </div>
          <span className="text-sm sm:text-base font-bold text-slate-400 tracking-widest uppercase ml-9">
            {signalLabel}
          </span>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
          <Icon strokeWidth={2.5} size={32} />
        </div>
      </div>

      <div className="px-8 sm:px-10 pb-8 flex-grow flex items-center justify-center bg-white">
        <SignalWaveform data={data.signal_data} gradientId={`qft-gradient-${data.case_id.toLowerCase()}`} />
      </div>

      <div className="bg-blue-50 border-t border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <GitCommitHorizontal size={20} className="text-slate-400" />
          </div>
          <span className="text-base font-bold text-slate-800">{data.description}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-blue-500 tracking-widest uppercase shadow-sm">
            {data.n_points} Data Points
          </div>
        </div>
      </div>
    </div>
  );
}

export function QFTSignalTopology() {
  const [mounted, setMounted] = useState(false);
  const [cases, setCases] = useState<QFTCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await qftApi.getCases();
        const sorted = [...data].sort((a, b) =>
          a.case_id.localeCompare(b.case_id, undefined, { numeric: true, sensitivity: 'base' })
        );
        setCases(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat dataset QFT');
      } finally {
        setLoading(false);
      }
    };

    void loadCases();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat dataset QFT dari JSON...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl border border-red-200 p-8 max-w-md">
          <p className="text-red-500 font-bold mb-2">Error</p>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <p className="text-slate-500">Tidak ada dataset QFT ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans selection:bg-blue-200">
      <div className="max-w-[1400px] mx-auto mb-16 text-center flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 mb-6 tracking-tight inline-flex items-center gap-4">
          <Activity className="text-blue-500" size={56} />
          Signal Topology
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
          Visualisasi murni pola array <strong>Quantum Fourier Transform</strong>. Sekilas lihat lekukan grafiknya: Kurva repetitif rapi
          menandakan sinyal <strong className="text-slate-800">periodik</strong>, kurva berpola tumpang tindih menandakan frekuensi{' '}
          <strong className="text-blue-500">campuran (mixed)</strong>.
        </p>
      </div>

      <div className="max-w-[1500px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:gap-14">
          {cases.map((data, index) => (
            <DatasetCard key={data.case_id} data={data} index={index} mounted={mounted} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default QFTSignalTopology;
