import type { QFTBenchmarkResult } from '../../types/qft';
import { MetricsGrid, MetricCard } from '../layout/MetricsGrid';
import { SignalChart } from '../charts/SignalChart';
import { SpectrumChart } from '../charts/SpectrumChart';
import { InlineEmptyState, SectionCard } from '../layout';
import { BookOpen, ArrowRight } from 'lucide-react';
import { UI_MESSAGES } from '../../constants/ui';
import { QFTFlowDiagram } from './QFTFlowDiagram';
import { DominantBinsExplanation } from './DominantBinsExplanation';

interface QFTClassicTabProps {
  result: QFTBenchmarkResult | null;
}

export function QFTClassicTab({ result }: QFTClassicTabProps) {
  if (!result) {
    return <InlineEmptyState message={UI_MESSAGES.emptyClassic} />;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Fast Fourier Transform (FFT)" icon={<BookOpen className="w-5 h-5" />}>
        {/* Flow Diagram - Alur Transformasi */}
        <QFTFlowDiagram 
          nPointsOriginal={result.n_points_original}
          nPointsPadded={result.n_points_padded || result.n_points_original}
          dominantBins={result.fft.dominant_bins}
        />

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
          <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-white border-2 border-blue-300 rounded-full p-2 shadow-lg">
              <ArrowRight className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Dominant Bins with Full Explanation */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Dominant Frequency Bins</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {result.fft.dominant_bins.map((bin, idx) => (
              <div key={idx} className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                <span className="font-mono text-blue-900">
                  Bin {bin}: {result.fft.dominant_magnitudes[idx].toFixed(2)}
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
