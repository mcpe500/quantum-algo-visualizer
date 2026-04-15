import { Link } from 'react-router-dom';
import { Waves, Grid } from 'lucide-react';
import { useQFT } from '../hooks/useQFT';
import {
  AlgorithmPageLayout,
  AlgorithmHeader,
  ClassicQuantumTabs,
} from '../components/layout';
import { QFTClassicTab, QFTQuantumTab } from '../components/qft';

export default function QFTCombinedPage() {
  const {
    selectedCaseId,
    availableCases,
    benchmarkResult,
    circuitImage,
    trace,
    isLoading,
    error,
    activeTab,
    setSelectedCaseId,
    setActiveTab,
    handleRun,
    handleDownload,
  } = useQFT();

  return (
    <AlgorithmPageLayout>
      <AlgorithmHeader
        title="Quantum Fourier Transform"
        icon={Waves}
        selectedCaseId={selectedCaseId}
        availableCases={availableCases}
        onCaseChange={(id) => {
          setSelectedCaseId(id);
        }}
        onRun={handleRun}
        onDownload={handleDownload}
        isLoading={isLoading}
        hasResult={!!benchmarkResult}
      />

      <Link
        to="/qft/topography"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors"
      >
        <Grid className="w-4 h-4" />
        Signal Topography
      </Link>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="mb-6 px-4 py-3 bg-purple-50 border border-purple-200 text-purple-700 text-sm rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          Menjalankan QFT...
        </div>
      )}

      {/* Results */}
      {benchmarkResult && (
        <div id="capture-area" className="space-y-6">
          <ClassicQuantumTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'classic' && <QFTClassicTab result={benchmarkResult} />}

          {activeTab === 'quantum' && (
            <QFTQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
          )}
        </div>
      )}

      {!benchmarkResult && !isLoading && (
        <div className="text-center py-20">
          <p className="text-gray-500">Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QFT.</p>
        </div>
      )}
    </AlgorithmPageLayout>
  );
}
