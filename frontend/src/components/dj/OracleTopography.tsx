import { useState, useEffect } from 'react';
import { Compass, Scale, Binary, Camera } from 'lucide-react';
import { djApi } from '../../services/api';
import type { DJCase } from '../../types/dj';
import { sortCaseIds } from '../../utils/sorting';
import { downloadElementAsPNG } from '../../utils/download';

interface TruthTableCellProps {
  input: string;
  output: number;
}

function TruthTableCell({ input, output }: TruthTableCellProps) {
  const isOne = output === 1;

  return (
    <div
      className={`flex flex-col items-center justify-center py-4 sm:py-6 rounded-xl border-2 transition-all duration-300 hover:-translate-y-1 ${
        isOne
          ? 'bg-blue-500 border-blue-500 text-white shadow-[0_8px_20px_0_rgba(59,130,246,0.4)]'
          : 'bg-white border-slate-200 text-blue-500 hover:border-blue-300 shadow-sm'
      }`}
    >
      <span
        className={`inline-flex w-full items-center justify-center text-center text-lg sm:text-xl lg:text-2xl font-mono font-bold leading-none mb-1 sm:mb-2 tracking-widest tabular-nums ${
          isOne ? 'text-blue-100' : 'text-slate-400'
        }`}
      >
        <span className="block translate-y-[-0.02em]">{input}</span>
      </span>
      <span className="inline-flex w-full items-center justify-center text-center text-3xl sm:text-4xl font-black leading-none tabular-nums">
        <span className="block translate-y-[-0.02em]">{output}</span>
      </span>
    </div>
  );
}

interface DatasetCardProps {
  data: DJCase;
  index: number;
  mounted: boolean;
}

function DatasetCard({ data, index, mounted }: DatasetCardProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const isBalanced = data.expected_classification === 'BALANCED';
  const Icon = isBalanced ? Scale : Compass;
  const entries = Object.entries(data.oracle_definition.truth_table)
    .sort(([a], [b]) => parseInt(a, 2) - parseInt(b, 2));

  const handleTakePicture = async () => {
    if (isCapturing) return;

    setIsCapturing(true);

    try {
      await downloadElementAsPNG(`dj-oracle-${data.case_id}`, `dj-oracle-${data.case_id}.png`);
    } finally {
      window.setTimeout(() => setIsCapturing(false), 10_000);
    }
  };

  return (
    <div
      id={`dj-oracle-${data.case_id}`}
      data-capture-root
      className={`bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col h-full transform transition-all duration-700 ease-out hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="p-6 sm:p-8 pb-6 flex justify-between items-start border-b border-slate-200 bg-white">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-blue-500 grid h-10 place-items-center text-xs font-black font-mono leading-none tabular-nums">
              <div className="translate-y-[-0.02em] text-center">
                <span className="block">01</span>
                <span className="block">10</span>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
              {data.case_id}
            </h2>
          </div>
          <span className="inline-flex min-h-5 items-center text-sm font-bold text-slate-400 tracking-widest uppercase leading-none ml-7">
            {data.n_qubits} Qubits
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500 shadow-inner">
            <Icon strokeWidth={2.5} size={26} />
          </div>
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
            <Camera size={18} />
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 flex-grow flex items-start justify-center bg-white">
        <div className="grid grid-cols-4 content-start gap-3 sm:gap-4 w-full">
          {entries.map(([inp, out]) => (
            <TruthTableCell key={inp} input={inp} output={out} />
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-between">
        <span className="inline-flex min-h-5 items-center text-sm font-black text-slate-800 tracking-widest uppercase leading-none">
          Classification
        </span>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          <span className="inline-flex min-h-6 items-center text-base sm:text-lg font-black text-blue-600 uppercase tracking-widest leading-none">
            {data.expected_classification}
          </span>
        </div>
      </div>
    </div>
  );
}

interface OracleTopographyProps {
  cases?: DJCase[];
}

export function OracleTopography({ cases: initialCases }: OracleTopographyProps) {
  const [mounted, setMounted] = useState(false);
  const [cases, setCases] = useState<DJCase[]>(initialCases ?? []);
  const [loading, setLoading] = useState(!initialCases);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initialCases) {
      setCases(initialCases);
      return;
    }

    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await djApi.getCases();
        setCases(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cases');
      } finally {
        setLoading(false);
      }
    };

    void loadCases();
  }, [initialCases]);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50/50 p-4 sm:p-8 md:p-12 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat data oracle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50/50 p-4 sm:p-8 md:p-12 font-sans flex items-center justify-center">
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

  if (cases.length === 0) {
    return (
      <div className="min-h-screen bg-blue-50/50 p-4 sm:p-8 md:p-12 font-sans flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500">Tidak ada data oracle tersedia.</p>
        </div>
      </div>
    );
  }

  const groupedCases = cases.reduce<Record<number, DJCase[]>>((acc, caseItem) => {
    const key = caseItem.n_qubits;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(caseItem);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groupedCases)
    .map(([nQubits, groupCases]) => ({
      nQubits: Number(nQubits),
      groupCases: sortCaseIds(groupCases.map((item) => item.case_id))
        .map((caseId) => groupCases.find((item) => item.case_id === caseId))
        .filter((item): item is DJCase => Boolean(item)),
    }))
    .sort((a, b) => a.nQubits - b.nQubits);

  return (
    <div className="min-h-screen bg-blue-50/50 p-4 sm:p-8 md:p-12 font-sans selection:bg-blue-200">
      <div className="max-w-[1800px] mx-auto mb-12 text-center flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-800 mb-4 tracking-tight inline-flex items-center gap-4">
          <Binary className="text-blue-500" size={44} />
          Quantum Oracle Topography
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
          Pola matriks <strong>Deutsch-Jozsa</strong>. Sekilas lihat pola birunya: Blok putih berbingkai biru
          berarti <strong className="text-slate-800">CONSTANT</strong>, blok biru penuh campuran berarti{' '}
          <strong className="text-blue-500">BALANCED</strong>.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-10 sm:space-y-12">
        {sortedGroups.map(({ nQubits, groupCases }) => (
          <section key={nQubits} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-700 tracking-tight">
                {nQubits} Qubit Oracle Cases
              </h2>
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-400">
                {groupCases.length} Cases
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10">
              {groupCases.map((data, index) => (
                <DatasetCard key={data.case_id} data={data} index={index} mounted={mounted} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default OracleTopography;
