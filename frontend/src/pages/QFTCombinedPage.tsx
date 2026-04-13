import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { qftApi } from '../services/api';
import type { QFTCircuitImage } from '../services/api';
import type { QFTBenchmarkParams, QFTBenchmarkResult, QFTQuantumTrace } from '../types/qft';
import { ArrowLeft, Download, Play, Cpu, BookOpen, Waves } from 'lucide-react';

const sortCaseIds = (caseIds: string[]) =>
  [...caseIds].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

// Simple SVG line chart component
function SignalChart({ data, color = '#2563EB', title = 'Signal' }: { data: number[]; color?: string; title?: string }) {
  if (!data || data.length === 0) return null;
  
  const width = 400;
  const height = 150;
  const padding = 30;
  
  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((val - minVal) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  const yMid = height / 2;
  const zeroLine = maxVal > 0 && minVal < 0 
    ? height - padding - ((0 - minVal) / range) * (height - 2 * padding)
    : null;
  
  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="border border-gray-200 rounded bg-white">
        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
        
        {/* Zero line if applicable */}
        {zeroLine !== null && (
          <line x1={padding} y1={zeroLine} x2={width - padding} y2={zeroLine} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4" />
        )}
        
        {/* Signal line */}
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        
        {/* Labels */}
        <text x={padding - 5} y={padding} fontSize="10" fill="#6b7280" textAnchor="end">{maxVal.toFixed(1)}</text>
        <text x={padding - 5} y={height - padding} fontSize="10" fill="#6b7280" textAnchor="end">{minVal.toFixed(1)}</text>
        <text x={padding} y={height - 10} fontSize="10" fill="#6b7280">0</text>
        <text x={width - padding} y={height - 10} fontSize="10" fill="#6b7280" textAnchor="end">{data.length}</text>
      </svg>
    </div>
  );
}

// Bar chart for FFT spectrum
function SpectrumChart({ data, title = 'FFT Spectrum' }: { data: { bin: number; magnitude: number }[]; title?: string }) {
  if (!data || data.length === 0) return null;
  
  const width = 400;
  const height = 150;
  const padding = 30;
  
  const maxMag = Math.max(...data.map(d => d.magnitude)) || 1;
  
  const barWidth = (width - 2 * padding) / data.length;
  
  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="border border-gray-200 rounded bg-white">
        {/* Grid */}
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e7eb" strokeWidth="1" />
        
        {/* Bars */}
        {data.slice(0, 16).map((d, i) => {
          const barHeight = (d.magnitude / maxMag) * (height - 2 * padding);
          return (
            <g key={d.bin}>
              <rect
                x={padding + i * barWidth}
                y={height - padding - barHeight}
                width={barWidth - 2}
                height={barHeight}
                fill="#2563EB"
                opacity={0.8}
              />
              <text
                x={padding + i * barWidth + barWidth / 2}
                y={height - padding + 12}
                fontSize="8"
                fill="#6b7280"
                textAnchor="middle"
              >
                {d.bin}
              </text>
            </g>
          );
        })}
        
        {/* Y axis label */}
        <text x={padding - 5} y={padding} fontSize="10" fill="#6b7280" textAnchor="end">{maxMag.toFixed(1)}</text>
        <text x={padding - 5} y={height - padding} fontSize="10" fill="#6b7280" textAnchor="end">0</text>
      </svg>
    </div>
  );
}

// Probability chart for QFT results
function ProbabilityChart({ data, title = 'QFT Measurement Probabilities' }: { data: { state: string; probability: number }[]; title?: string }) {
  if (!data || data.length === 0) return null;
  
  const width = 300;
  const height = 120;
  const padding = 30;
  
  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="border border-gray-200 rounded bg-white">
        {data.map((d, i) => {
          const barWidth = 30;
          const barHeight = d.probability * (height - 2 * padding);
          const x = padding + i * (barWidth + 10);
          const y = height - padding - barHeight;
          
          return (
            <g key={d.state}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="#7c3aed" opacity={0.8} />
              <text x={x + barWidth / 2} y={height - padding + 12} fontSize="10" fill="#6b7280" textAnchor="middle">
                |{d.state}⟩
              </text>
              <text x={x + barWidth / 2} y={y - 5} fontSize="9" fill="#7c3aed" textAnchor="middle">
                {(d.probability * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function QFTCombinedPage() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('QFT-01');
  const [availableCases, setAvailableCases] = useState<string[]>(['QFT-01']);
  const [benchmarkResult, setBenchmarkResult] = useState<QFTBenchmarkResult | null>(null);
  const [circuitImage, setCircuitImage] = useState<QFTCircuitImage | null>(null);
  const [quantumTrace, setQuantumTrace] = useState<QFTQuantumTrace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'classic' | 'quantum'>('classic');

  const loadCircuitImage = useCallback(async (caseId: string) => {
    try {
      const data = await qftApi.getCircuitImage(caseId);
      setCircuitImage(data);
    } catch (err) {
      console.error('Failed to load circuit image:', err);
      setCircuitImage(null);
    }
  }, []);

  const loadQuantumTrace = useCallback(async (caseId: string) => {
    try {
      const data = await qftApi.getQuantumTrace(caseId);
      setQuantumTrace(data);
    } catch (err) {
      console.error('Failed to load quantum trace:', err);
      setQuantumTrace(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCases = async () => {
      try {
        const cases = await qftApi.getCases();
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

        setAvailableCases(['QFT-01']);
      } catch (err) {
        console.error('Failed to load QFT cases:', err);
        if (!cancelled) {
          setAvailableCases(['QFT-01']);
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
      const params: QFTBenchmarkParams = { case_id: selectedCaseId, shots: 1024 };
      const data = await qftApi.runBenchmark(params);
      setBenchmarkResult(data);
      
      await loadCircuitImage(selectedCaseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Benchmark failed');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, loadCircuitImage]);

  const handleDownload = useCallback(async () => {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById('capture-area');
    if (!element) return;

    const canvas = await html2canvas(element, {
      backgroundColor: '#FAFAFA',
      scale: 2,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.download = `qft_combined_${selectedCaseId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [selectedCaseId]);

  useEffect(() => {
    loadCircuitImage(selectedCaseId);
    loadQuantumTrace(selectedCaseId);
  }, [selectedCaseId, loadCircuitImage, loadQuantumTrace]);

  const classicTabClass = activeTab === 'classic' 
    ? 'bg-white text-gray-900 shadow-sm' 
    : 'text-gray-600 hover:text-gray-900';
  
  const quantumTabClass = activeTab === 'quantum' 
    ? 'bg-white text-gray-900 shadow-sm' 
    : 'text-gray-600 hover:text-gray-900';

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Algorithms
      </Link>

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-gray-700" />
            <h1 className="text-xl font-semibold text-gray-900">Quantum Fourier Transform</h1>
          </div>
          
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 transition-all cursor-pointer font-mono"
          >
            {availableCases.map((caseId) => (
              <option key={caseId} value={caseId}>{caseId}</option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Memproses...' : 'Jalankan'}
          </button>

          {benchmarkResult && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 px-4 py-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {benchmarkResult && (
          <div id="capture-area" className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('classic')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${classicTabClass}`}
                >
                  <BookOpen className="w-4 h-4" />
                  Klasik (FFT)
                </button>
                <button
                  onClick={() => setActiveTab('quantum')}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${quantumTabClass}`}
                >
                  <Cpu className="w-4 h-4" />
                  Kuantum (QFT)
                </button>
              </div>
            </div>

            {activeTab === 'classic' && benchmarkResult && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Fast Fourier Transform (FFT)
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Data Points</div>
                    <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.n_points_original}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Time Complexity</div>
                    <div className="text-lg font-mono text-gray-900">{benchmarkResult.fft.time_complexity}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Execution Time</div>
                    <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.fft.execution_time_ms.toFixed(2)} ms</div>
                  </div>
                </div>

                {benchmarkResult.n_points_padded && benchmarkResult.n_points_padded !== benchmarkResult.n_points_original && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                    <p className="text-xs text-blue-700">
                      <strong>Preprocessing:</strong> Sinyal {benchmarkResult.n_points_original} titik di-zero-pad menjadi {benchmarkResult.n_points_padded} titik (2<sup>{Math.log2(benchmarkResult.n_points_padded)}</sup>) agar kompatibel dengan register kuantum {Math.log2(benchmarkResult.n_points_padded)}-qubit. FFT juga dijalankan pada data yang dipad untuk perbandingan yang adil.
                    </p>
                  </div>
                )}

                {/* Charts for Classic FFT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <SignalChart 
                      data={benchmarkResult.input_signal} 
                      color="#2563EB" 
                      title="Input Signal (Original)" 
                    />
                  </div>
                  <div>
                    <SpectrumChart 
                      data={benchmarkResult.fft.spectrum.map(s => ({ bin: s.bin, magnitude: s.magnitude }))} 
                      title="FFT Spectrum (Magnitude)" 
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Dominant Frequency Bins</h3>
                  <div className="flex flex-wrap gap-2">
                    {benchmarkResult.fft.dominant_bins.map((bin, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                        <span className="font-mono text-blue-900">Bin {bin}: {benchmarkResult.fft.dominant_magnitudes[idx].toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Signal Type:</strong> {benchmarkResult.signal_type}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'quantum' && benchmarkResult && (
              <>
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Quantum Fourier Transform (QFT)
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Qubits</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.qft.num_qubits}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Circuit Depth</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.qft.circuit_depth}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Gate Count</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.qft.gate_count}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Shots</div>
                      <div className="text-2xl font-mono font-semibold text-gray-900">{benchmarkResult.shots}</div>
                    </div>
                  </div>

                  {/* Charts for Quantum QFT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <SignalChart 
                        data={benchmarkResult.qft.input_amplitudes || []} 
                        color="#7c3aed" 
                        title="Input Amplitudes (from same signal data)" 
                      />
                    </div>
                    <div>
                      <ProbabilityChart 
                        data={benchmarkResult.qft.probabilities || []} 
                        title="QFT Measurement Probabilities" 
                      />
                    </div>
                  </div>

                  {circuitImage && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">QFT Circuit</h3>
                      <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                        <img 
                          src={`data:image/png;base64,${circuitImage.image}`}
                          alt="QFT Circuit"
                          className="max-w-full h-auto"
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>QFT Complexity:</strong> {benchmarkResult.qft.time_complexity}
                    </p>
                  </div>
                  
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> {benchmarkResult.comparison.note}
                    </p>
                  </div>
                </div>

                {quantumTrace && (
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Circuit Trace</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Step</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Operation</th>
                            {Array.from({ length: quantumTrace.n_qubits }, (_, i) => (
                              <th key={i} className="text-center py-2 px-2 font-medium text-gray-700">q{i}</th>
                            ))}
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Phase</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quantumTrace.stages.map((stage) => (
                            <tr key={stage.step} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-2 px-3 font-mono text-gray-900">{stage.step}</td>
                              <td className="py-2 px-3">{stage.operation}</td>
                              {Array.from({ length: quantumTrace.n_qubits }, (_, i) => (
                                <td key={i} className="text-center py-2 px-2 font-mono">
                                  {stage.wire_markers[i] || '-'}
                                </td>
                              ))}
                              <td className="py-2 px-3">
                                <span className={`inline-flex px-2 py-0.5 text-xs rounded ${
                                  stage.phase === 'init' ? 'bg-blue-100 text-blue-800' :
                                  stage.phase === 'transform' ? 'bg-green-100 text-green-800' :
                                  stage.phase === 'swap' ? 'bg-purple-100 text-purple-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {stage.phase}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparison: FFT vs QFT</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">FFT (Classical)</div>
                      <div className="text-lg font-mono text-gray-900">{benchmarkResult.comparison.fft_complexity}</div>
                      <div className="text-sm text-gray-600 mt-1">Time: {benchmarkResult.fft.execution_time_ms.toFixed(2)} ms</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">QFT (Quantum)</div>
                      <div className="text-lg font-mono text-gray-900">{benchmarkResult.comparison.qft_complexity}</div>
                      <div className="text-sm text-gray-600 mt-1">Depth: {benchmarkResult.qft.circuit_depth}</div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> {benchmarkResult.comparison.speedup_factor}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!benchmarkResult && !isLoading && (
          <div className="text-center py-20">
            <p className="text-gray-500">Pilih kasus dan klik "Jalankan" untuk memulai benchmarking QFT.</p>
          </div>
        )}
      </div>
    </div>
  );
}
