import { useState, useCallback } from 'react';
import { useClassicalDJ } from './hooks/useClassicalDJ';
import { ClassicalVisualization } from './components/dj/ClassicalVisualization';

function App() {
  const { dataset, result, isLoading, error, loadDataset, runClassical } = useClassicalDJ();
  const [selectedCaseId, setSelectedCaseId] = useState<string>('DJ-01');
  const handleCaseChange = useCallback(
    async (caseId: string) => {
      setSelectedCaseId(caseId);
      await loadDataset(caseId);
    },
    [loadDataset]
  );

  const handleRun = useCallback(async () => {
    await runClassical(selectedCaseId);
  }, [runClassical, selectedCaseId]);

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
    link.download = `dj_classical_${selectedCaseId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [selectedCaseId]);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* TOP BAR */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
        <select
          value={selectedCaseId}
          onChange={(e) => handleCaseChange(e.target.value)}
          className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 transition-all cursor-pointer font-mono"
        >
          <option value="DJ-01">DJ-01</option>
          <option value="DJ-02">DJ-02</option>
          <option value="DJ-03">DJ-03</option>
          <option value="DJ-04">DJ-04</option>
        </select>

        <button
          onClick={handleRun}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Memproses...' : 'Jalankan'}
        </button>

        {result && (
          <button
            onClick={handleDownload}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all"
          >
            Download PNG
          </button>
        )}
      </div>

      {/* DATASET INFO */}
      {dataset && (
        <div className="fixed top-4 right-4 z-50 max-w-xs p-3 bg-white border border-gray-300 rounded-lg shadow-lg">
          <p className="text-[10px] font-bold tracking-widest text-gray-800 mb-2">DATASET</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              <span className="font-mono">{dataset.case_id}</span> · n={dataset.n_qubits} · {dataset.expected_classification}
            </p>
            <details className="mt-2">
              <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-700">
                Lihat Truth Table
              </summary>
              <div className="mt-1 p-2 bg-gray-50 rounded text-[9px] font-mono max-h-32 overflow-y-auto">
                {Object.entries(dataset.oracle_definition.truth_table).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span className={v === 0 ? 'text-blue-600' : 'text-orange-600'}>{v}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="fixed bottom-20 left-4 z-50 px-4 py-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* VISUALIZATION */}
      <ClassicalVisualization result={result} onDownload={handleDownload} />
    </div>
  );
}

export default App;
