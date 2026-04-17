import { Waves } from 'lucide-react';
import { useQFT } from '../hooks/useQFT';
import {
  AlgorithmPageLayout,
  AlgorithmHeader,
  ClassicQuantumTabs,
  DatasetLink,
  PageEmptyState,
  PageErrorBanner,
  PageLoadingBanner,
} from '../components/layout';
import { QFTClassicTab, QFTQuantumTab } from '../components/qft';
import { CAPTURE_IDS } from '../constants/app';

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

      <DatasetLink to="/qft/dataset" />

      {error && <PageErrorBanner message={error} />}

      {isLoading && (
        <PageLoadingBanner message="Menjalankan QFT..." />
      )}

      {benchmarkResult && (
        <div id={CAPTURE_IDS.qft} className="space-y-6">
          <ClassicQuantumTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'classic' && <QFTClassicTab result={benchmarkResult} />}

          {activeTab === 'quantum' && (
            <QFTQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
          )}
        </div>
      )}

      {!benchmarkResult && !isLoading && (
        <PageEmptyState message={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QFT.'} />
      )}
    </AlgorithmPageLayout>
  );
}
