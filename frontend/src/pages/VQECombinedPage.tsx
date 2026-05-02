import { Atom, BookOpen, Cpu, HelpCircle } from 'lucide-react';
import { useVQE } from '../hooks/useVQE';
import { AlgorithmPageShell } from '../shared/components/AlgorithmPageShell';
import { VQEClassicTab, VQEProblemStatement, VQEQuantumTab } from '../components/vqe';
import { CAPTURE_IDS } from '../constants/app';
import { useInitialTabSync } from './hooks/useInitialTabSync';

const SHOTS_OPTIONS = [1024, 2048, 4096, 8192];

export default function VQECombinedPage() {
  const {
    selectedCaseId,
    availableCases,
    selectedCaseData,
    benchmarkResult,
    circuitImage,
    trace,
    isLoading,
    error,
    activeTab,
    shots,
    setSelectedCaseId,
    setActiveTab,
    setShots,
    handleRun,
    handleDownload,
  } = useVQE();

  useInitialTabSync('problem', setActiveTab);

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
      datasetLink="/vqe/dataset"
      tabs={[
        { id: 'problem', label: 'Problem', icon: HelpCircle },
        { id: 'classic', label: 'Klasik', icon: BookOpen },
        { id: 'quantum', label: 'Kuantum', icon: Cpu },
      ]}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as 'problem' | 'classic' | 'quantum')}
      captureId={CAPTURE_IDS.vqe}
      emptyMessage={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking VQE.'}
      extraControls={
        <select
          value={shots}
          onChange={(e) => setShots(Number(e.target.value))}
          className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 transition-all cursor-pointer font-mono"
        >
          {SHOTS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s} shots</option>
          ))}
        </select>
      }
      problemTab={<VQEProblemStatement caseData={selectedCaseData} result={benchmarkResult} />}
      classicTab={benchmarkResult ? <VQEClassicTab result={benchmarkResult} /> : null}
      quantumTab={benchmarkResult ? (
        <VQEQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
      ) : null}
    />
  );
}
