import { Atom, BookOpen, Cpu } from 'lucide-react';
import { useVQE } from '../hooks/useVQE';
import { AlgorithmPageShell } from '../shared/components/AlgorithmPageShell';
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
    <AlgorithmPageShell
      title="Variational Quantum Eigensolver"
      icon={Atom}
      selectedCaseId={selectedCaseId}
      availableCases={availableCases}
      onCaseChange={setSelectedCaseId}
      onRun={handleRun}
      onDownload={handleDownload}
      isLoading={isLoading}
      hasResult={!!benchmarkResult}
      error={error}
      loadingMessage="Menjalankan VQE... proses optimisasi mungkin memerlukan beberapa detik."
      tabs={[
        { id: 'classic', label: 'Klasik', icon: BookOpen },
        { id: 'quantum', label: 'Kuantum', icon: Cpu },
      ]}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as 'classic' | 'quantum')}
      captureId={CAPTURE_IDS.vqe}
      emptyMessage={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking VQE.'}
      classicTab={benchmarkResult ? <VQEClassicTab result={benchmarkResult} /> : null}
      quantumTab={benchmarkResult ? (
        <VQEQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
      ) : null}
    />
  );
}
