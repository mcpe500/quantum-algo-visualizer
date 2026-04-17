import { Atom } from 'lucide-react';
import { useVQE } from '../hooks/useVQE';
import {
  AlgorithmPageLayout,
  AlgorithmHeader,
  ClassicQuantumTabs,
  PageEmptyState,
  PageErrorBanner,
  PageLoadingBanner,
} from '../components/layout';
import { VQEClassicTab, VQEQuantumTab } from '../components/vqe';
import { CAPTURE_IDS } from '../constants/app';

export default function VQECombinedPage() {
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
  } = useVQE();

  return (
    <AlgorithmPageLayout>
      <AlgorithmHeader
        title="Variational Quantum Eigensolver"
        icon={Atom}
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

      {error && <PageErrorBanner message={error} />}

      {isLoading && (
        <PageLoadingBanner message="Menjalankan VQE... proses optimisasi mungkin memerlukan beberapa detik." />
      )}

      {benchmarkResult && (
        <div id={CAPTURE_IDS.vqe} className="space-y-6">
          <ClassicQuantumTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'classic' && <VQEClassicTab result={benchmarkResult} />}

          {activeTab === 'quantum' && (
            <VQEQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
          )}
        </div>
      )}

      {!benchmarkResult && !isLoading && (
        <PageEmptyState message={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking VQE.'} />
      )}
    </AlgorithmPageLayout>
  );
}
