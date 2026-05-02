import { Cpu, BookOpen, HelpCircle, Video } from 'lucide-react';
import { useDJBenchmark } from '../hooks/useDJBenchmark';
import { AlgorithmPageShell } from '../shared/components/AlgorithmPageShell';
import { DJProblemStatement } from '../components/dj/DJProblemStatement';
import { ClassicalVisualization } from '../components/dj/ClassicalVisualization';
import { QuantumVisualization } from '../components/dj/QuantumVisualization';
import { ComparisonSection } from '../components/dj/ComparisonSection';
import { QuantumTraceTable } from '../components/dj/QuantumTraceTable';
import { DJQuantumAnimation } from '../components/dj/DJQuantumAnimation';
import { CAPTURE_IDS } from '../constants/app';
import { useInitialTabSync } from './hooks/useInitialTabSync';

interface DJCombinedPageProps {
  initialTab?: 'problem' | 'classic' | 'quantum' | 'animation';
}

export default function DJCombinedPage({ initialTab = 'problem' }: DJCombinedPageProps) {
  const {
    selectedCaseId,
    availableCases,
    selectedCaseData,
    benchmarkResult,
    circuitImage,
    boxedCircuitImage,
    trace,
    animationData,
    classicalResult,
    isLoading,
    error,
    activeTab,
    isVideoExporting,
    setIsVideoExporting,
    setSelectedCaseId,
    setActiveTab,
    handleRun,
    handleDownload,
  } = useDJBenchmark();

  useInitialTabSync(initialTab, setActiveTab);

  return (
    <div className={isVideoExporting ? 'pointer-events-none opacity-90' : ''}>
      <AlgorithmPageShell
        title="Deutsch-Jozsa Algorithm"
        icon={Cpu}
        selectedCaseId={selectedCaseId}
        availableCases={availableCases}
        onCaseChange={setSelectedCaseId}
        onRun={handleRun}
        onDownload={handleDownload}
        isLoading={isLoading}
        hasResult={!!classicalResult || !!benchmarkResult}
        error={error}
        datasetLink="/dj/dataset"
        tabs={[
          { id: 'problem', label: 'Problem', icon: HelpCircle },
          { id: 'classic', label: 'Klasik', icon: BookOpen },
          { id: 'quantum', label: 'Kuantum', icon: Cpu },
          { id: 'animation', label: 'Animasi 3D', icon: Video },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        captureId={CAPTURE_IDS.djQuantum}
        emptyMessage="Pilih kasus dan klik 'Jalankan' untuk memulai benchmarking Deutsch-Jozsa."
        problemTab={<DJProblemStatement caseData={selectedCaseData} />}
        classicTab={
          classicalResult ? (
            <ClassicalVisualization result={classicalResult} onDownload={handleDownload} />
          ) : null
        }
        quantumTab={
          benchmarkResult ? (
            <>
              <QuantumVisualization
                quantum={benchmarkResult.quantum}
                circuitImage={circuitImage}
                boxedCircuitImage={boxedCircuitImage}
                shots={benchmarkResult.shots}
                case_id={benchmarkResult.case_id}
                n_qubits={benchmarkResult.n_qubits}
                classification={benchmarkResult.expected_classification}
              />
              {trace && (
                <details className="group">
                  <summary className="cursor-pointer select-none rounded-xl border border-purple-200 bg-white px-4 py-3 text-[12px] font-semibold text-purple-700 hover:bg-purple-50 transition-colors">
                    Detail Trace Table ({trace.stages.length} gate steps)
                  </summary>
                  <div className="mt-2">
                    <QuantumTraceTable trace={trace} />
                  </div>
                </details>
              )}
              <ComparisonSection result={benchmarkResult} />
            </>
          ) : null
        }
        animationTab={
          benchmarkResult && animationData ? (
            <DJQuantumAnimation data={animationData} onExportingChange={setIsVideoExporting} />
          ) : null
        }
      />
    </div>
  );
}
