import type { QFTBenchmarkResult } from '../../types/qft';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { SignalChart } from '../charts/SignalChart';
import { SpectrumChart } from '../charts/SpectrumChart';
import { InlineEmptyState, SectionCard } from '../layout';
import { BookOpen, Download } from 'lucide-react';
import { UI_MESSAGES } from '../../constants/ui';
import { QFTFlowDiagram } from './QFTFlowDiagram';
import { DominantBinsExplanation } from './DominantBinsExplanation';
import { downloadElementAsPNG } from '../../utils/download';
import { QFTClassicBookFigure } from './QFTClassicBookFigure';
import { getQFTBookFigureId } from './qftBookFigure';
import { buildDominantMirrorPairs } from './dominantPairs';
import { ClassicFlowArrow } from '../classic-flow';

interface QFTClassicTabProps {
  result: QFTBenchmarkResult | null;
}

export function QFTClassicTab({ result }: QFTClassicTabProps) {
  if (!result) {
    return <InlineEmptyState message={UI_MESSAGES.emptyClassic} />;
  }

  const dominantPairs = buildDominantMirrorPairs(
    result.fft.dominant_bins,
    result.fft.dominant_magnitudes,
    result.fft.n_points
  );

  const handleDownloadBookFigure = async () => {
    await downloadElementAsPNG(
      getQFTBookFigureId(result.case_id),
      `qft-fft-book-figure-${result.case_id}.png`
    );
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Fast Fourier Transform (FFT)" icon={<BookOpen className="w-5 h-5" />}>
        <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Visualisasi Solusi Klasik: FFT (Cooley-Tukey)</h3>
              <p className="mt-1 text-sm text-slate-600">
                Diagram akademik terintegrasi: menyatukan dekomposisi domain waktu, operasi butterfly, dan spektrum frekuensi dalam satu alur komprehensif untuk dokumentasi tugas akhir.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDownloadBookFigure()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 transition-colors hover:bg-cyan-100"
            >
              <Download className="h-4 w-4" />
              Download Gambar Buku
            </button>
          </div>
          <div className="rounded-xl bg-slate-100 p-3">
            <div className="overflow-x-auto">
              <QFTClassicBookFigure result={result} mode="screen" />
            </div>
            <div className="absolute -left-[100000px] top-0 pointer-events-none opacity-0" aria-hidden="true">
              <QFTClassicBookFigure result={result} mode="export" />
            </div>
          </div>
        </div>

        <MetricsGrid columns={3}>
          <MetricCard label="Data Points" value={result.n_points_original} />
          <MetricCard label="Time Complexity" value={result.fft.time_complexity} />
          <MetricCard label="Execution Time" value={`${result.fft.execution_time_ms.toFixed(2)} ms`} />
        </MetricsGrid>

        {result.n_points_padded && result.n_points_padded !== result.n_points_original && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-700">
              <strong>Preprocessing:</strong> Sinyal {result.n_points_original} titik di-zero-pad menjadi{' '}
              {result.n_points_padded} titik (2^{Math.log2(result.n_points_padded)}) agar kompatibel dengan register kuantum{' '}
              {Math.log2(result.n_points_padded)}-qubit. FFT juga dijalankan pada data yang dipad untuk perbandingan yang adil.
            </p>
          </div>
        )}

        <details className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">
            Lihat detail trace FFT klasik
          </summary>
          <p className="mt-2 text-sm text-slate-600">
            Bagian ini mempertahankan trace FFT versi detail untuk eksplorasi web, tetapi tidak lagi menjadi visual utama buku.
          </p>
          <div className="mt-4">
            <QFTFlowDiagram
              nPointsOriginal={result.n_points_original}
              nPointsPadded={result.n_points_padded || result.n_points_original}
              dominantBins={result.fft.dominant_bins}
              paddedSignal={result.padded_signal}
            />
          </div>
        </details>

        {/* Charts with Flow Arrow */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <SignalChart data={result.input_signal} color="#2563EB" title="Input Signal (Original)" />
            </div>
            <div>
              <SpectrumChart
                data={result.fft.spectrum.map((s) => ({ bin: s.bin, magnitude: s.magnitude }))}
                title="FFT Spectrum (Magnitude)"
                highlightBins={result.fft.dominant_bins}
              />
            </div>
          </div>
          
          {/* Flow Arrow between charts - desktop only */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 transform">
            <ClassicFlowArrow tone="blue" size="sm" boxed />
          </div>
        </div>

        {/* Dominant Bins with Full Explanation */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Dominant Frequency Bin Pairs</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {dominantPairs.map((pair) => (
              <div key={pair.label} className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                <span className="font-mono text-blue-900">
                  {pair.label}: {pair.magnitude.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          
          {/* Detailed Explanation */}
          <DominantBinsExplanation 
            dominantBins={result.fft.dominant_bins}
            dominantMagnitudes={result.fft.dominant_magnitudes}
            nPoints={result.fft.n_points}
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Signal Type:</strong> {result.signal_type}
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
