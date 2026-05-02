import { BookOpen, Cpu, HelpCircle, LoaderCircle, PlayCircle, Waves } from 'lucide-react';
import { useQFT } from '../hooks/useQFT';
import { AlgorithmPageShell } from '../shared/components/AlgorithmPageShell';
import { QFTClassicTab, QFTProblemStatement, QFTQuantumTab, QFTQuantumAnimation } from '../components/qft';
import { CAPTURE_IDS } from '../constants/app';
import { useInitialTabSync } from './hooks/useInitialTabSync';

interface QFTCombinedPageProps {
  initialTab?: 'problem' | 'classic' | 'quantum' | 'animation';
}

export default function QFTCombinedPage({ initialTab = 'problem' }: QFTCombinedPageProps) {
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
  } = useQFT();

  useInitialTabSync(initialTab, setActiveTab);

  return (
    <AlgorithmPageShell
      title="Quantum Fourier Transform"
      icon={Waves}
      selectedCaseId={selectedCaseId}
      availableCases={availableCases}
      onCaseChange={setSelectedCaseId}
      onRun={handleRun}
      onDownload={handleDownload}
      isLoading={isLoading}
      hasResult={!!benchmarkResult}
      error={error}
      loadingMessage="Menjalankan QFT..."
      datasetLink="/qft/dataset"
      tabs={[
        { id: 'problem', label: 'Problem', icon: HelpCircle },
        { id: 'classic', label: 'Klasik', icon: BookOpen },
        { id: 'quantum', label: 'Kuantum', icon: Cpu },
        { id: 'animation', label: 'Animasi 3D', icon: PlayCircle },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      captureId={CAPTURE_IDS.qft}
      emptyMessage={'Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QFT.'}
      problemTab={<QFTProblemStatement caseData={selectedCaseData} result={benchmarkResult} />}
      classicTab={benchmarkResult ? <QFTClassicTab result={benchmarkResult} /> : null}
      quantumTab={benchmarkResult ? (
        <QFTQuantumTab result={benchmarkResult} circuitImage={circuitImage} trace={trace} />
      ) : null}
      animationTab={
        isLoadingAnimation ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle className="w-8 h-8 animate-spin text-slate-400" />
            <span className="ml-3 text-slate-500">Memuat animasi QFT...</span>
          </div>
        ) : animationData ? (
          <QFTQuantumAnimation data={animationData} />
        ) : null
      }
    />
  );
}
