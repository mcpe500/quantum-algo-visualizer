import { useEffect } from 'react';
import { BookOpen, Cpu, GitBranch, LoaderCircle, PlayCircle } from 'lucide-react';
import { useQAOA } from '../hooks/useQAOA';
import { AlgorithmPageShell } from '../shared/components/AlgorithmPageShell';
import { QAOAClassicTab, QAOAHybridAnimation, QAOAQuantumTab } from '../components/qaoa';
import { CAPTURE_IDS } from '../constants/app';

interface QAOACombinedPageProps {
  initialTab?: 'classic' | 'quantum' | 'animation';
}

export default function QAOACombinedPage({ initialTab = 'classic' }: QAOACombinedPageProps) {
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

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, setActiveTab]);

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
        { id: 'classic', label: 'Klasik', icon: BookOpen },
        { id: 'quantum', label: 'Kuantum', icon: Cpu },
        { id: 'animation', label: 'Animasi 3D', icon: PlayCircle },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      captureId={CAPTURE_IDS.qaoa}
      emptyMessage={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QAOA.'}
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
