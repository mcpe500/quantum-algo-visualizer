import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Download } from 'lucide-react';
import { PAGE_BACKGROUND_CLASS } from '../../constants/ui';
import { PageErrorBanner, PageLoadingBanner, PageEmptyState } from '../../components/layout/PageState';

export interface AlgorithmPageShellProps {
  title: string;
  icon: LucideIcon;
  selectedCaseId: string;
  availableCases: string[];
  onCaseChange: (id: string) => void;
  onRun: () => Promise<void>;
  onDownload?: () => Promise<void>;
  isLoading: boolean;
  hasResult: boolean;
  error: string | null;
  loadingMessage?: string;
  datasetLink?: string;
  tabs: Array<{
    id: 'classic' | 'quantum' | 'animation';
    label: string;
    icon: LucideIcon;
  }>;
  activeTab: 'classic' | 'quantum' | 'animation';
  onTabChange: (tab: 'classic' | 'quantum' | 'animation') => void;
  classicTab: ReactNode;
  quantumTab: ReactNode;
  animationTab?: ReactNode;
  emptyMessage?: string;
  captureId?: string;
  extraControls?: ReactNode;
}

export function AlgorithmPageShell({
  title,
  icon: Icon,
  selectedCaseId,
  availableCases,
  onCaseChange,
  onRun,
  onDownload,
  isLoading,
  hasResult,
  error,
  loadingMessage,
  datasetLink,
  tabs,
  activeTab,
  onTabChange,
  classicTab,
  quantumTab,
  animationTab,
  emptyMessage = 'Pilih kasus dan klik "Jalankan" untuk memulai.',
  captureId,
  extraControls,
}: AlgorithmPageShellProps) {
  const tabClass = (tabId: string) =>
    activeTab === tabId
      ? 'bg-white text-slate-900 shadow-sm'
      : 'text-slate-600 hover:text-slate-900';

  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-4 md:p-8`}>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Algorithms
            </Link>
            {datasetLink && (
              <Link
                to={datasetLink}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Icon className="w-4 h-4" />
                Dataset
              </Link>
            )}
          </div>
        </div>

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

          {extraControls}

          <button
            onClick={() => void onRun()}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isLoading ? 'Memproses...' : 'Jalankan'}
          </button>

          {hasResult && onDownload && (
            <button
              onClick={() => void onDownload()}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PNG
            </button>
          )}
        </div>

        {error && <PageErrorBanner message={error} />}

        {isLoading && loadingMessage && (
          <PageLoadingBanner message={loadingMessage} />
        )}

        {hasResult && (
          <div id={captureId} className="space-y-6">
            <div className="flex justify-center mb-4">
              <div className="inline-flex bg-slate-100 p-1 rounded-lg">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass(tab.id)}`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'classic' && classicTab}
            {activeTab === 'quantum' && quantumTab}
            {activeTab === 'animation' && animationTab}
          </div>
        )}

        {!hasResult && !isLoading && (
          <PageEmptyState message={emptyMessage} />
        )}
      </div>
    </div>
  );
}