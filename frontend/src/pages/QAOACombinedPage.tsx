import { GitBranch } from 'lucide-react';
import { useQAOA } from '../hooks/useQAOA';
import {
  AlgorithmPageLayout,
  AlgorithmHeader,
  ClassicQuantumTabs,
} from '../components/layout';
import { QAOAClassicTab, QAOAQuantumTab } from '../components/qaoa';

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
          Menjalankan QAOA... SA dan optimisasi parameter mungkin memerlukan beberapa detik.
        </div>
      )}

      {/* Results */}
      {benchmarkResult && (
        <div id="qaoa-capture" className="space-y-6">
          <ClassicQuantumTabs activeTab={activeTab} onChange={setActiveTab} />

          {activeTab === 'classic' && <QAOAClassicTab result={benchmarkResult} />}

          {activeTab === 'quantum' && (
            <QAOAQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
          )}
        </div>
      )}

      {!benchmarkResult && !isLoading && (
        <div className="text-center py-20">
          <p className="text-gray-500">Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QAOA.</p>
        </div>
      )}
    </AlgorithmPageLayout>
  );
}
