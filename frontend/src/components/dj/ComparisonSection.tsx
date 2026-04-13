import type { DJBenchmarkResult } from '../../types/dj';

interface ComparisonSectionProps {
  result: DJBenchmarkResult;
}

export function ComparisonSection({ result }: ComparisonSectionProps) {
  const { comparison, accuracy } = result;

  return (
    <div className="bg-gray-50 border border-gray-300 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Perbandingan</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Quantum Calls</p>
          <p className="text-xl font-bold text-purple-600">{comparison.quantum_calls}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Classical Calls</p>
          <p className="text-xl font-bold text-blue-600">{comparison.classic_calls}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Speedup</p>
          <p className="text-xl font-bold text-green-600">{comparison.speedup_factor}x</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Accuracy</p>
          <p className="text-xl font-bold text-gray-900">
            {accuracy.quantum_correct && accuracy.classic_correct ? '✓ Benar' : '✗ Salah'}
          </p>
        </div>
      </div>
    </div>
  );
}