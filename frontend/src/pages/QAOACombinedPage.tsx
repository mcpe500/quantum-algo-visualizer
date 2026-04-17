import { GitBranch } from 'lucide-react';
import { useQAOA } from '../hooks/useQAOA';
import {
  AlgorithmPageLayout,
  AlgorithmHeader,
  ClassicQuantumTabs,
  DatasetLink,
  PageEmptyState,
  PageErrorBanner,
  PageLoadingBanner,
} from '../components/layout';
import { QAOAClassicTab, QAOAQuantumTab } from '../components/qaoa';
import { CAPTURE_IDS } from '../constants/app';

export default function QAOACombinedPage() {
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
  } = useQAOA();

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
          <ClassicQuantumTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'classic' && <QAOAClassicTab result={benchmarkResult} />}

          {activeTab === 'quantum' && (
            <QAOAQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
          )}
        </div>
      )}

      {!benchmarkResult && !isLoading && (
        <PageEmptyState message={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QAOA.'} />
      )}
    </AlgorithmPageLayout>
  );
}
