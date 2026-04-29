import { useEffect, useMemo, useState } from 'react';
import { Activity, Waves, Zap, GitCommitHorizontal, Camera } from 'lucide-react';
import { qftApi } from '../../services/api';
import type { QFTCase } from '../../types/qft';
import { sortCaseIds } from '../../utils/sorting';
import { downloadElementAsPNG } from '../../utils/download';

interface SignalWaveformProps {
  data: number[];
  gradientId: string;
  captureMode: boolean;
}

function SignalWaveform({ data, gradientId, captureMode }: SignalWaveformProps) {
  const isEmpty = data.length === 0;
  const isDense = data.length > 32;
  const dotRadius = isDense ? 3 : 4.5;
  const dotStroke = isDense ? 1 : 1.5;
  const labelFontSize = captureMode ? 8 : isDense ? 6 : 8.5;
  const chartHeightClass = captureMode ? 'h-[360px]' : 'h-48 sm:h-64';
  const shouldShowPointLabel = (index: number) => {
    if (!captureMode) return true;
    return index % (isDense ? 8 : 4) === 0 || index === data.length - 1;
  };

  const { pathLine, pathArea, zeroYPercent, chartPoints } = useMemo(() => {
    const chartData = data.length === 0 ? [0] : data;
    const maxVal = Math.max(...chartData);
    const minVal = Math.min(...chartData);
    const range = maxVal - minVal || 1;
    const padding = range * (captureMode ? 0.06 : 0.15);
    const yMin = minVal - padding;
    const yMax = maxVal + padding;
    const yRange = yMax - yMin || 1;

    const width = 600;
    const height = 240;
    const paddingX = isDense ? 30 : 28;
    const paddingY = captureMode ? 16 : isDense ? 24 : 18;
    const plotWidth = width - paddingX * 2;
    const plotHeight = height - paddingY * 2;
    const denominator = Math.max(1, chartData.length - 1);

    const chartPointsLocal = chartData.map((val, i) => {
      const x = paddingX + (i / denominator) * plotWidth;
      const y = paddingY + (1 - (val - yMin) / yRange) * plotHeight;
      return { x, y };
    });

    const points = chartPointsLocal.map((point) => `${point.x},${point.y}`);
    const pathLineLocal = `M ${points.join(' L ')}`;
    const zeroYRaw = paddingY + (1 - (0 - yMin) / yRange) * plotHeight;
    const zeroY = Math.min(height - paddingY, Math.max(paddingY, zeroYRaw));
    const firstX = chartPointsLocal[0]?.x ?? paddingX;
    const lastX = chartPointsLocal[chartPointsLocal.length - 1]?.x ?? width - paddingX;
    const pathAreaLocal = `${pathLineLocal} L ${lastX},${zeroY} L ${firstX},${zeroY} Z`;

    return {
      pathLine: pathLineLocal,
      pathArea: pathAreaLocal,
      zeroYPercent: (zeroY / height) * 100,
      chartPoints: chartPointsLocal,
    };
  }, [data, isDense, captureMode]);

  if (isEmpty) {
    return (
      <div className={`relative w-full ${chartHeightClass} bg-white rounded-xl border-2 border-slate-200 overflow-hidden flex items-center justify-center`}>
        <span className="text-sm font-semibold text-slate-400 tracking-wide">Signal data kosong</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${chartHeightClass} bg-white rounded-xl border-2 border-slate-200 overflow-hidden flex items-center justify-center group`}>
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
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-700 ease-in-out group-hover:drop-shadow-[0_6px_10px_rgba(59,130,246,0.4)]"
        />

        {chartPoints.map((point, i) => {
          const verticalOffsets = isDense ? [-9, 11] : [-14, 18];
          const labelY = point.y + verticalOffsets[i % verticalOffsets.length];
          const labelX = Math.min(592, Math.max(8, point.x));
          const textAnchor = point.x < 18 ? 'start' : point.x > 582 ? 'end' : 'middle';
          const showPointLabel = shouldShowPointLabel(i);
          return (
            <g key={`point-group-${i}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={dotRadius}
                fill="#F97316"
                stroke="#FFFFFF"
                strokeWidth={dotStroke}
                className="group-hover:drop-shadow-[0_2px_4px_rgba(249,115,22,0.4)]"
              />
              {showPointLabel && !captureMode && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  fontSize={labelFontSize}
                  fill="#64748B"
                  fontFamily="monospace"
                  fontWeight="600"
                  dominantBaseline="middle"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  paintOrder="stroke"
                  strokeLinejoin="round"
                >
                  {i}
                </text>
              )}
              {showPointLabel && captureMode && (
                <>
                  <line x1={point.x} y1="210" x2={point.x} y2="215" stroke="#94A3B8" strokeWidth="1" />
                  <text
                    x={labelX}
                    y="224"
                    textAnchor={textAnchor}
                    fontSize={labelFontSize}
                    fill="#475569"
                    fontFamily="monospace"
                    fontWeight="700"
                    dominantBaseline="middle"
                  >
                    {i}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Axis labels intentionally omitted in book figure — explained in caption instead */}
      </svg>
    </div>
  );
}

interface DatasetCardProps {
  data: QFTCase;
  index: number;
  mounted: boolean;
  captureMode: boolean;
}

function DatasetCard({ data, index, mounted, captureMode }: DatasetCardProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const isMixed = data.signal_type.includes('mixed');
  const Icon = isMixed ? Activity : Waves;
  const signalLabel = data.signal_type.replace('synthetic_', '').replace('_', ' ');

  const handleTakePicture = async () => {
    if (isCapturing) return;

    setIsCapturing(true);

    try {
      await downloadElementAsPNG(`qft-signal-${data.case_id}`, `qft-signal-${data.case_id}.png`);
    } finally {
      window.setTimeout(() => setIsCapturing(false), 10_000);
    }
  };

  return (
    <div
      id={`qft-signal-${data.case_id}`}
      data-capture-root
      className={`bg-white border border-slate-200 overflow-hidden flex flex-col h-full transform transition-all duration-700 ease-out ${
        captureMode ? 'rounded-2xl shadow-none' : 'rounded-3xl shadow-sm hover:shadow-[0_16px_50px_rgb(0,0,0,0.08)]'
      } ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} ${
        captureMode ? 'qft-book-capture' : ''
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={`${captureMode ? 'p-4 pb-3' : 'p-8 sm:p-10 pb-6'} flex justify-between items-start bg-white`}>
        <div>
          <div className={`flex items-center ${captureMode ? 'gap-2 mb-1' : 'gap-3 mb-3'}`}>
            {!captureMode && <div className="text-blue-500">
              <Zap size={24} />
            </div>}
            <h2 className={`inline-flex items-center font-black text-slate-800 tracking-tight leading-none ${captureMode ? 'min-h-8 text-3xl' : 'min-h-12 text-4xl sm:text-5xl'}`}>
              <span className="block translate-y-[-0.02em]">{data.case_id}</span>
            </h2>
          </div>
          <span className={`inline-flex min-h-5 items-center font-bold text-slate-400 tracking-widest uppercase leading-none ${captureMode ? 'text-xs ml-0' : 'text-sm sm:text-base ml-9'}`}>
            {signalLabel}
          </span>
        </div>

        {!captureMode && <div className="flex items-center gap-3 shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
            <Icon strokeWidth={2.5} size={32} />
          </div>
          <button
            type="button"
            onClick={() => void handleTakePicture()}
            disabled={isCapturing}
            data-html2canvas-ignore
            className={`p-2 rounded-lg border border-gray-200 text-gray-500 transition-all ${
              isCapturing ? 'cursor-wait opacity-40' : 'hover:bg-gray-50'
            }`}
            title="Take Picture"
            aria-label={`Take picture ${data.case_id}`}
          >
            <Camera size={20} />
          </button>
        </div>}
      </div>

      <div className={`${captureMode ? 'px-4 pb-4' : 'px-8 sm:px-10 pb-8'} flex-grow flex items-center justify-center bg-white`}>
        <SignalWaveform data={data.signal_data} gradientId={`qft-gradient-${data.case_id.toLowerCase()}`} captureMode={captureMode} />
      </div>

      <div className={`bg-blue-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between ${captureMode ? 'p-3 gap-2' : 'p-6 sm:p-8 gap-4'}`}>
        <div className="flex items-center gap-3">
          {!captureMode && <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <GitCommitHorizontal size={20} className="text-slate-400" />
          </div>}
          <span className={`inline-flex min-h-6 items-center font-bold text-slate-800 leading-none ${captureMode ? 'text-sm' : 'text-base'}`}>{data.description}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center justify-center bg-white border border-slate-200 rounded-lg font-black text-blue-500 tracking-widest uppercase leading-none tabular-nums shadow-sm ${captureMode ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'}`}>
            <span className="block translate-y-[-0.02em]">{data.n_points} Data Points</span>
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
  const captureParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('capture') : null;
  const captureMode = captureParam === null || captureParam === '1';

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await qftApi.getCases();
        const sortedIds = sortCaseIds(data.map((item) => item.case_id));
        const sorted = sortedIds
          .map((caseId) => data.find((item) => item.case_id === caseId))
          .filter((item): item is QFTCase => Boolean(item));
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
    <div className={`min-h-screen bg-slate-50 font-sans selection:bg-blue-200 ${captureMode ? 'p-4' : 'p-6 sm:p-10 md:p-16'}`}>
      {!captureMode && <div className="max-w-[1400px] mx-auto mb-16 text-center flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 mb-6 tracking-tight inline-flex items-center gap-4">
          <Activity className="text-blue-500" size={56} />
          Signal Topology
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
          Visualisasi murni pola array <strong>Quantum Fourier Transform</strong>. Sekilas lihat lekukan grafiknya: Kurva repetitif rapi
          menandakan sinyal <strong className="text-slate-800">periodik</strong>, kurva berpola tumpang tindih menandakan frekuensi{' '}
          <strong className="text-blue-500">campuran (mixed)</strong>.
        </p>
      </div>}

      <div className={`${captureMode ? 'max-w-[1180px]' : 'max-w-[1500px]'} mx-auto`}>
        <div className={`grid grid-cols-1 ${captureMode ? 'gap-6' : 'xl:grid-cols-2 gap-10 xl:gap-14'}`}>
          {cases.map((data, index) => (
            <DatasetCard key={data.case_id} data={data} index={index} mounted={mounted} captureMode={captureMode} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default QFTSignalTopology;
