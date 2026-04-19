import { BookOpen, Cpu, LoaderCircle, PlayCircle, Waves } from 'lucide-react';
import { useQFT } from '../hooks/useQFT';
import {
  AlgorithmPageLayout,
  AlgorithmHeader,
  DatasetLink,
  PageEmptyState,
  PageErrorBanner,
  PageLoadingBanner,
} from '../components/layout';
import { QFTClassicTab, QFTQuantumTab, QFTQuantumAnimation } from '../components/qft';
import { CAPTURE_IDS } from '../constants/app';

export default function QFTCombinedPage() {
  const {
    selectedCaseId,
    availableCases,
    benchmarkResult,
    circuitImage,
    trace,
    animationData,
    isLoading,
    isLoadingAnimation,
    error,
    activeTab,
    setSelectedCaseId,
    setActiveTab,
    handleRun,
    handleDownload,
  } = useQFT();

  const tabClass = (tab: 'classic' | 'quantum' | 'animation') =>
    activeTab === tab
      ? 'bg-white text-slate-900 shadow-sm'
      : 'text-slate-600 hover:text-slate-900';

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

      <DatasetLink to="/qft/dataset" />

      {error && <PageErrorBanner message={error} />}

      {isLoading && (
        <PageLoadingBanner message="Menjalankan QFT..." />
      )}

      {benchmarkResult && (
        <div id={CAPTURE_IDS.qft} className="space-y-6">
          <div className="flex justify-center mb-4">
            <div className="inline-flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('classic')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass('classic')}`}
              >
                <BookOpen className="w-4 h-4" />
                Klasik
              </button>
              <button
                onClick={() => setActiveTab('quantum')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass('quantum')}`}
              >
                <Cpu className="w-4 h-4" />
                Kuantum
              </button>
              <button
                onClick={() => setActiveTab('animation')}
                className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass('animation')}`}
              >
                <PlayCircle className="w-4 h-4" />
                Animasi 3D
              </button>
            </div>
          </div>

          {activeTab === 'classic' && <QFTClassicTab result={benchmarkResult} />}

          {activeTab === 'quantum' && (
            <QFTQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
          )}

          {activeTab === 'animation' && (
            isLoadingAnimation ? (
              <div className="flex items-center justify-center py-20">
                <LoaderCircle className="w-8 h-8 animate-spin text-slate-400" />
                <span className="ml-3 text-slate-500">Memuat animasi QFT...</span>
              </div>
            ) : animationData ? (
              <QFTQuantumAnimation data={animationData} />
            ) : (
              <PageEmptyState message="Klik tab lain lalu jalankan benchmark terlebih dahulu untuk melihat animasi." />
            )
          )}
        </div>
      )}

      {!benchmarkResult && !isLoading && (
        <PageEmptyState message={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QFT.'} />
      )}
    </AlgorithmPageLayout>
  );
}
