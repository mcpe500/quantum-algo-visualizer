import { Cpu, BookOpen } from 'lucide-react';
import { useDJBenchmark } from '../hooks/useDJBenchmark';
import { AlgorithmPageShell } from '../shared/components/AlgorithmPageShell';
import { ClassicalVisualization } from '../components/dj/ClassicalVisualization';
import { QuantumVisualization } from '../components/dj/QuantumVisualization';
import { ComparisonSection } from '../components/dj/ComparisonSection';
import { QuantumTraceTable } from '../components/dj/QuantumTraceTable';
import { DJQuantumAnimation } from '../components/dj/DJQuantumAnimation';
import { InlineEmptyState } from '../components/layout';
import { UI_MESSAGES } from '../constants/ui';
import { CAPTURE_IDS } from '../constants/app';

export default function DJCombinedPage() {
  const {
    selectedCaseId,
    availableCases,
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
          { id: 'classic', label: 'Klasik', icon: BookOpen },
          { id: 'quantum', label: 'Kuantum', icon: Cpu },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'classic' | 'quantum')}
        captureId={CAPTURE_IDS.djQuantum}
        classicTab={
          classicalResult ? (
            <ClassicalVisualization result={classicalResult} onDownload={handleDownload} />
          ) : (
            <InlineEmptyState message={UI_MESSAGES.emptyClassic} />
          )
        }
        quantumTab={
          benchmarkResult ? (
            <>
              {animationData && (
                <DJQuantumAnimation data={animationData} onExportingChange={setIsVideoExporting} />
              )}
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
          ) : (
            <InlineEmptyState message={UI_MESSAGES.emptyQuantum} />
          )
        }
      />
    </div>
  );
}
