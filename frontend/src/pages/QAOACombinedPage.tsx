import { BookOpen, Cpu, GitBranch, LoaderCircle, PlayCircle } from 'lucide-react';
import { useQAOA } from '../hooks/useQAOA';
import {
  AlgorithmPageLayout,
  AlgorithmHeader,
  DatasetLink,
  PageEmptyState,
  PageErrorBanner,
  PageLoadingBanner,
} from '../components/layout';
import { QAOAClassicTab, QAOAHybridAnimation, QAOAQuantumTab } from '../components/qaoa';
import { CAPTURE_IDS } from '../constants/app';

export default function QAOACombinedPage() {
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
  } = useQAOA();

  const tabClass = (tab: 'classic' | 'quantum' | 'animation') =>
    activeTab === tab
      ? 'bg-white text-slate-900 shadow-sm'
      : 'text-slate-600 hover:text-slate-900';

  return (
    <AlgorithmPageLayout>
      <AlgorithmHeader
        title="Quantum Approximate Optimization Algorithm"
        icon={GitBranch}
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

      <DatasetLink to="/qaoa/dataset" />

      {error && <PageErrorBanner message={error} />}

      {isLoading && (
        <PageLoadingBanner message="Menjalankan QAOA... SA dan optimisasi parameter mungkin memerlukan beberapa detik." />
      )}

      {benchmarkResult && (
        <div id={CAPTURE_IDS.qaoa} className="space-y-6">
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

          {activeTab === 'classic' && <QAOAClassicTab result={benchmarkResult} />}

          {activeTab === 'quantum' && (
            <QAOAQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
          )}

          {activeTab === 'animation' && (
            isLoadingAnimation ? (
              <div className="flex items-center justify-center py-20">
                <LoaderCircle className="w-8 h-8 animate-spin text-slate-400" />
                <span className="ml-3 text-slate-500">Memuat animasi QAOA hybrid...</span>
              </div>
            ) : animationData ? (
              <QAOAHybridAnimation data={animationData} />
            ) : (
              <PageEmptyState message="Klik tab lain lalu jalankan benchmark terlebih dahulu untuk melihat animasi." />
            )
          )}
        </div>
      )}

      {!benchmarkResult && !isLoading && (
        <PageEmptyState message={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QAOA.'} />
      )}
    </AlgorithmPageLayout>
  );
}
