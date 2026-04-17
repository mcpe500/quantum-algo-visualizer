import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { djApi } from '../services/api';
import type { DJCircuitImage } from '../services/api';
import { ClassicalVisualization } from '../components/dj/ClassicalVisualization';
import { QuantumVisualization } from '../components/dj/QuantumVisualization';
import { ComparisonSection } from '../components/dj/ComparisonSection';
import { QuantumTraceTable } from '../components/dj/QuantumTraceTable';
import { DJQuantumAnimation } from '../components/dj/DJQuantumAnimation';
import type { DJBenchmarkParams, DJBenchmarkResult, DJQuantumTrace, DJAnimationPayload } from '../types/dj';
import type { ClassicalResult } from '../types/classical';
import { ArrowLeft, Download, Play, Cpu, BookOpen, Grid } from 'lucide-react';
import { CAPTURE_IDS, DEFAULT_SHOTS } from '../constants/app';
import { PAGE_BACKGROUND_CLASS, STATE_CLASSES, UI_MESSAGES } from '../constants/ui';
import { InlineEmptyState, PageEmptyState } from '../components/layout';
import { sortCaseIds } from '../utils/sorting';
import { downloadElementAsPNG } from '../utils/download';

export default function DJCombinedPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('DJ-01');
  const [availableCases, setAvailableCases] = useState<string[]>(['DJ-01']);
  const [classicalResult, setClassicalResult] = useState<ClassicalResult | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<DJBenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<DJCircuitImage | null>(null);
  const [boxedCircuitImage, setBoxedCircuitImage] = useState<DJCircuitImage | null>(null);
  const [quantumTrace, setQuantumTrace] = useState<DJQuantumTrace | null>(null);
  const [animationData, setAnimationData] = useState<DJAnimationPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoExporting, setIsVideoExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum'>('classic');

  const loadClassicalResult = useCallback(async (caseId: string) => {
    try {
      const data = await djApi.runClassicalDJ(caseId);
      setClassicalResult(data);
    } catch (err) {
      console.error('Failed to load classical result:', err);
    }
  }, []);

  const loadCircuitImage = useCallback(async (caseId: string) => {
    try {
      const data = await djApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch (err) {
      console.error('Failed to load circuit image:', err);
      setCircuitImage(null);
    }
  }, []);

  const loadBoxedCircuitImage = useCallback(async (caseId: string) => {
    try {
      const data = await djApi.getCircuitImageBoxed(caseId);
      setBoxedCircuitImage(data);
    } catch (err) {
      console.error('Failed to load boxed circuit image:', err);
      setBoxedCircuitImage(null);
    }
  }, []);

  const loadQuantumTrace = useCallback(async (caseId: string) => {
    try {
      const data = await djApi.getQuantumTrace(caseId);
      setQuantumTrace(data);
    } catch (err) {
      console.error('Failed to load quantum trace:', err);
      setQuantumTrace(null);
    }
  }, []);

  const loadAnimation = useCallback(async (caseId: string) => {
    try {
      const data = await djApi.getAnimation(caseId);
      setAnimationData(data);
    } catch (err) {
      console.error('Failed to load animation:', err);
      setAnimationData(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCases = async () => {
      try {
        const cases = await djApi.getCases();
        if (cancelled) return;

        const caseIds = sortCaseIds(
          cases
            .map((item) => item.case_id)
            .filter((caseId): caseId is string => Boolean(caseId))
        );

        if (caseIds.length > 0) {
          setAvailableCases(caseIds);
          setSelectedCaseId((current) => (caseIds.includes(current) ? current : caseIds[0]));
          return;
        }

        setAvailableCases(['DJ-01']);
      } catch (err) {
        console.error('Failed to load DJ cases:', err);
        if (!cancelled) {
          setAvailableCases(['DJ-01']);
        }
      }
    };

    void loadCases();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRun = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: DJBenchmarkParams = { case_id: selectedCaseId, shots: DEFAULT_SHOTS };
      const data = await djApi.runBenchmark(params);
      setBenchmarkResult(data);
      
      await loadClassicalResult(selectedCaseId);
      await loadCircuitImage(selectedCaseId);
      await loadBoxedCircuitImage(selectedCaseId);
      void loadAnimation(selectedCaseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, loadClassicalResult, loadCircuitImage, loadBoxedCircuitImage, loadAnimation]);

  const handleDownload = useCallback(async () => {
    await downloadElementAsPNG(CAPTURE_IDS.djQuantum, `dj_combined_${selectedCaseId}.png`);
  }, [selectedCaseId]);

  useEffect(() => {
    loadClassicalResult(selectedCaseId);
    loadCircuitImage(selectedCaseId);
    loadBoxedCircuitImage(selectedCaseId);
    loadQuantumTrace(selectedCaseId);
    loadAnimation(selectedCaseId);
  }, [selectedCaseId, loadClassicalResult, loadCircuitImage, loadBoxedCircuitImage, loadQuantumTrace, loadAnimation]);

  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-4 md:p-8`}>
      <Link
        to="/"
        className={`inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors ${isVideoExporting ? 'pointer-events-none opacity-45' : ''}`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Algorithms
      </Link>

      <Link
        to="/dj/dataset"
        className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 ml-6 transition-colors ${isVideoExporting ? 'pointer-events-none opacity-45' : ''}`}
      >
        <Grid className="w-4 h-4" />
        Dataset
      </Link>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            disabled={isVideoExporting}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 transition-all cursor-pointer font-mono"
          >
            {availableCases.map((caseId) => (
              <option key={caseId} value={caseId}>{caseId}</option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={isLoading || isVideoExporting}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Memproses...' : 'Jalankan'}
          </button>

          {(classicalResult || benchmarkResult) && (
            <button
              onClick={handleDownload}
              disabled={isVideoExporting}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          )}
        </div>

        {error && (
          <div className={STATE_CLASSES.errorBanner}>
            {error}
          </div>
        )}

        {(classicalResult || benchmarkResult) && (
          <div id={CAPTURE_IDS.djQuantum} className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('classic')}
                  disabled={isVideoExporting}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                    activeTab === 'classic'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Klasik
                </button>
                <button
                  onClick={() => setActiveTab('quantum')}
                  disabled={isVideoExporting}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                    activeTab === 'quantum'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  Kuantum
                </button>
              </div>
            </div>

            {/* Classic Tab Content */}
            {activeTab === 'classic' && classicalResult && (
              <ClassicalVisualization 
                result={classicalResult} 
                onDownload={handleDownload}
                captureId={CAPTURE_IDS.djClassic}
              />
            )}

            {activeTab === 'classic' && !classicalResult && (
              <InlineEmptyState message={UI_MESSAGES.emptyClassic} />
            )}

            <div className="flex justify-center py-2">
              <svg width="24" height="48" viewBox="0 0 24 48" fill="none">
                <path d="M12 5 L12 43" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 38 L12 43 L17 38" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 10 L12 5 L17 10" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Quantum Tab Content */}
            {activeTab === 'quantum' && benchmarkResult && (
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
                {quantumTrace && (
                  <details className="group">
                    <summary className="cursor-pointer select-none rounded-xl border border-purple-200 bg-white px-4 py-3 text-[12px] font-semibold text-purple-700 hover:bg-purple-50 transition-colors">
                      Detail Trace Table ({quantumTrace.stages.length} gate steps)
                    </summary>
                    <div className="mt-2">
                      <QuantumTraceTable trace={quantumTrace} />
                    </div>
                  </details>
                )}
                <ComparisonSection result={benchmarkResult} />
              </>
            )}

            {activeTab === 'quantum' && !benchmarkResult && (
              <InlineEmptyState message={UI_MESSAGES.emptyQuantum} />
            )}
          </div>
        )}

        {!classicalResult && !benchmarkResult && !isLoading && (
          <PageEmptyState message={'Pilih kasus dan klik "Jalankan" untuk memulai.'} />
        )}
      </div>
    </div>
  );
}
