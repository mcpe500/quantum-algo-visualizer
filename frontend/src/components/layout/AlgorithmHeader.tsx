import type { LucideIcon } from 'lucide-react';
import { Play, Download } from 'lucide-react';

interface AlgorithmHeaderProps {
  title: string;
  icon: LucideIcon;
  selectedCaseId: string;
  availableCases: string[];
  onCaseChange: (id: string) => void;
  onRun: () => void;
  onDownload: () => void;
  isLoading: boolean;
  hasResult: boolean;
}

export function AlgorithmHeader({
  title,
  icon: Icon,
  selectedCaseId,
  availableCases,
  onCaseChange,
  onRun,
  onDownload,
  isLoading,
  hasResult,
}: AlgorithmHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-gray-700" />
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      </div>

      <select
        value={selectedCaseId}
        onChange={(e) => onCaseChange(e.target.value)}
        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:border-gray-400 transition-all cursor-pointer font-mono"
      >
        {availableCases.map((id) => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>

      <button
        onClick={onRun}
        disabled={isLoading}
        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Play className="w-4 h-4" />
        {isLoading ? 'Memproses...' : 'Jalankan'}
      </button>

      {hasResult && (
        <button
          onClick={onDownload}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>
      )}
    </div>
  );
}
