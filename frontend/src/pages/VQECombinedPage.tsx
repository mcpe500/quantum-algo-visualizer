import { Atom } from 'lucide-react';
import { useVQE } from '../hooks/useVQE';
import {
  AlgorithmPageLayout,
  AlgorithmHeader,
  ClassicQuantumTabs,
} from '../components/layout';
import { VQEClassicTab, VQEQuantumTab } from '../components/vqe';

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
          Menjalankan VQE... proses optimisasi mungkin memerlukan beberapa detik.
        </div>
      )}

      {/* Results */}
      {benchmarkResult && (
        <div id="vqe-capture" className="space-y-6">
          <ClassicQuantumTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'classic' && <VQEClassicTab result={benchmarkResult} />}

          {activeTab === 'quantum' && (
            <VQEQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
          )}
        </div>
      )}

      {!benchmarkResult && !isLoading && (
        <div className="text-center py-20">
          <p className="text-gray-500">Pilih kasus dan klik "Jalankan" untuk memulai benchmarking VQE.</p>
        </div>
      )}
    </AlgorithmPageLayout>
  );
}
