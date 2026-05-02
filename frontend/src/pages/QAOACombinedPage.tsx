import { BookOpen, Cpu, GitBranch, HelpCircle, LoaderCircle, PlayCircle } from 'lucide-react';
import { useQAOA } from '../hooks/useQAOA';
import { AlgorithmPageShell } from '../shared/components/AlgorithmPageShell';
import { QAOAClassicTab, QAOAHybridAnimation, QAOAProblemStatement, QAOAQuantumTab } from '../components/qaoa';
import { CAPTURE_IDS } from '../constants/app';
import { useInitialTabSync } from './hooks/useInitialTabSync';

interface QAOACombinedPageProps {
  initialTab?: 'problem' | 'classic' | 'quantum' | 'animation';
}

export default function QAOACombinedPage({ initialTab = 'problem' }: QAOACombinedPageProps) {
  const {
    selectedCaseId,
    availableCases,
    selectedCaseData,
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

  useInitialTabSync(initialTab, setActiveTab);

  return (
    <AlgorithmPageShell
      title="Quantum Approximate Optimization Algorithm"
      icon={GitBranch}
      selectedCaseId={selectedCaseId}
      availableCases={availableCases}
      onCaseChange={setSelectedCaseId}
      onRun={handleRun}
      onDownload={handleDownload}
      isLoading={isLoading}
      hasResult={!!benchmarkResult}
      error={error}
      loadingMessage="Menjalankan QAOA... SA dan optimisasi parameter mungkin memerlukan beberapa detik."
      datasetLink="/qaoa/dataset"
      tabs={[
        { id: 'problem', label: 'Problem', icon: HelpCircle },
        { id: 'classic', label: 'Klasik', icon: BookOpen },
        { id: 'quantum', label: 'Kuantum', icon: Cpu },
        { id: 'animation', label: 'Animasi 3D', icon: PlayCircle },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      captureId={CAPTURE_IDS.qaoa}
      emptyMessage={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QAOA.'}
      problemTab={<QAOAProblemStatement caseData={selectedCaseData} result={benchmarkResult} />}
      classicTab={benchmarkResult ? <QAOAClassicTab result={benchmarkResult} /> : null}
      quantumTab={benchmarkResult ? (
        <QAOAQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
      ) : null}
      animationTab={
        isLoadingAnimation ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle className="w-8 h-8 animate-spin text-slate-400" />
            <span className="ml-3 text-slate-500">Memuat animasi QAOA hybrid...</span>
          </div>
        ) : animationData ? (
          <QAOAHybridAnimation data={animationData} />
        ) : null
      }
    />
  );
}
