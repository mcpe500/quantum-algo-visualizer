import { useEffect, useState, type ReactNode } from 'react';
import { Camera } from 'lucide-react';
import { qaoaApi } from '../../services/api';
import type { QAOACase } from '../../types/qaoa';
import { AdjacencyMatrixGrid } from './AdjacencyMatrixGrid';
import { MiniGraph } from './MiniGraph';
import { sortCaseIds } from '../../utils/sorting';
import { downloadElementAsPNG } from '../../utils/download';

function inferGraphType(nodes: number[], edges: [number, number][]): string {
  const n = nodes.length;
  const maxEdges = (n * (n - 1)) / 2;
  if (edges.length === maxEdges) {
    return `K${n}`;
  }
  if (edges.length === n - 1) {
    return `P${n}`;
  }
  return `custom`;
}

interface DatasetCardProps {
  data: QAOACase;
  index: number;
  mounted: boolean;
}

interface HeaderBadgeProps {
  children: ReactNode;
  tone?: 'primary' | 'muted';
  widthClass?: string;
}

function HeaderBadge({ children, tone = 'muted', widthClass }: HeaderBadgeProps) {
  const toneClass =
    tone === 'primary'
      ? 'bg-blue-500 text-white border-blue-500'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div
      className={`inline-grid h-9 place-items-center rounded-xl border px-4 text-center font-bold leading-none tabular-nums ${toneClass} ${widthClass ?? ''}`}
    >
      <span className="block translate-y-[-0.02em] whitespace-nowrap">{children}</span>
    </div>
  );
}

function DatasetCard({ data, index, mounted }: DatasetCardProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const graphType = inferGraphType(data.graph.nodes, data.graph.edges);
  const n = data.graph.nodes.length;
  const cellSize = n <= 3 ? 72 : 64;

  const handleTakePicture = async () => {
    if (isCapturing) return;

    setIsCapturing(true);

    try {
      await downloadElementAsPNG(`qaoa-dataset-${data.case_id}`, `qaoa-dataset-${data.case_id}.png`);
    } finally {
      window.setTimeout(() => setIsCapturing(false), 10_000);
    }
  };

  return (
    <div
      id={`qaoa-dataset-${data.case_id}`}
      data-capture-root
      className={`bg-white rounded-3xl border border-slate-200 overflow-hidden transform transition-all duration-700 ease-out hover:shadow-[0_16px_50px_rgb(0,0,0,0.08)] ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HeaderBadge tone="primary" widthClass="min-w-[12rem] text-lg font-black">
            {data.case_id}
          </HeaderBadge>
          <HeaderBadge widthClass="min-w-[4.5rem] text-sm uppercase tracking-widest">
            {graphType}
          </HeaderBadge>
          <HeaderBadge widthClass="min-w-[6rem] text-sm">
            p = {data.p_layers}
          </HeaderBadge>
          <button
            type="button"
            onClick={() => void handleTakePicture()}
            disabled={isCapturing}
            data-html2canvas-ignore
            className={`p-2 rounded-lg border border-gray-200 text-gray-500 transition-all ${
              isCapturing ? 'cursor-wait opacity-40' : 'hover:bg-gray-50'
            }`}
            title="Take Picture"
            aria-label={`Take picture ${data.case_id}`}
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <div className="flex h-9 items-center gap-4 text-sm font-bold text-slate-400 leading-none tabular-nums">
          <span className="inline-flex h-full items-center">edges: {data.graph.edges.length}</span>
          <span className="inline-flex h-full items-center text-slate-300">|</span>
          <span className="inline-flex h-full items-center">nodes: {data.graph.nodes.length}</span>
        </div>
      </div>

      <div className="p-8 sm:p-10 flex items-center justify-center gap-10">
        <AdjacencyMatrixGrid
          nodes={data.graph.nodes}
          edges={data.graph.edges}
          cellSize={cellSize}
        />
        <div className="flex flex-col items-center gap-4">
          <MiniGraph
            nodes={data.graph.nodes}
            edges={data.graph.edges}
          />
          <span className="inline-flex h-5 items-center text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
            graph
          </span>
        </div>
      </div>

      <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
        <span className="inline-flex min-h-6 items-center text-sm font-medium text-slate-500 leading-none text-center">
          {data.description}
        </span>
      </div>
    </div>
  );
}

export function QAOADatasetVisualizer() {
  const [mounted, setMounted] = useState(false);
  const [cases, setCases] = useState<QAOACase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await qaoaApi.getCases();
        const sortedIds = sortCaseIds(data.map((item) => item.case_id));
        const sorted = sortedIds
          .map((caseId) => data.find((item) => item.case_id === caseId))
          .filter((item): item is QAOACase => Boolean(item));
        setCases(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat dataset QAOA');
      } finally {
        setLoading(false);
      }
    };

    void loadCases();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat dataset QAOA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl border border-red-200 p-8 max-w-md">
          <p className="text-red-500 font-bold mb-2">Error</p>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <p className="text-slate-500">Tidak ada dataset QAOA ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {cases.map((data, index) => (
          <DatasetCard key={data.case_id} data={data} index={index} mounted={mounted} />
        ))}
      </div>
    </div>
  );
}

export default QAOADatasetVisualizer;
