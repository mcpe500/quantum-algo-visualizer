import { useRef } from 'react';
import type { ClassicalResult } from '../../types/classical';
import { InputsPanel } from './InputsPanel';
import { OraclePanel } from './OraclePanel';
import { ResultPanel } from './ResultPanel';
import { PseudocodeBlock } from './PseudocodeBlock';
import { CAPTURE_IDS } from '../../constants/app';

interface ClassicalVisualizationProps {
  result: ClassicalResult | null;
  onDownload: () => void;
  captureId?: string;
}

export function ClassicalVisualization({
  result,
  onDownload,
  captureId = CAPTURE_IDS.djClassic,
}: ClassicalVisualizationProps) {
  const captureRef = useRef<HTMLDivElement>(null);

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 pb-12 w-full pt-8">
        <div className="flex flex-col items-center justify-center h-[300px]">
          <div className="text-gray-400 text-sm">Pilih kasus dan klik "Jalankan" untuk memulai.</div>
        </div>
      </div>
    );
  }

  const { case_id, n_qubits, classification, steps, pseudocode } = result;
  const maxQueries = Math.pow(2, n_qubits - 1) + 1;
  const isConstant = classification === 'CONSTANT';

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12 w-full pt-4">
      <div id={captureId} ref={captureRef} className="bg-[#FAFAFA]">
        {/* HEADER */}
        <header className="text-center pt-4 pb-2">
          <p className="text-[10px] tracking-[0.2em] text-gray-600 font-bold uppercase">Solusi Klasik - Brute Force</p>
          <h1 className="text-[22px] font-semibold tracking-tight text-gray-900 mt-1">
            {case_id}: {classification}
          </h1>
          <p className="text-gray-500 mt-1 max-w-lg mx-auto text-[13px] leading-snug">
            Untuk n={n_qubits}, komputer klasik butuh maksimal {maxQueries} query untuk memastikan jenis fungsi.
          </p>
        </header>

        {/* PSEUDOCODE BLOCK */}
        <div className="mt-4 px-8">
          {pseudocode && <PseudocodeBlock pseudocode={pseudocode} case_id={case_id} />}
        </div>

        {/* MAIN FLOW */}
        <main className="flex flex-col lg:flex-row items-start justify-center mt-6 lg:mt-8 gap-6">
          <InputsPanel n_qubits={n_qubits} steps={steps} />

          {/* ARROW */}
          <div className="hidden lg:flex items-center shrink-0 self-center mt-6">
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
              <path d="M0 8 H38" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M34 4 L40 8 L34 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="lg:hidden w-px h-6 bg-gradient-to-b from-gray-400 to-gray-300" />

          <OraclePanel steps={steps} />

          {/* ARROW */}
          <div className="hidden lg:flex items-center shrink-0 self-center mt-6">
            <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
              <path d="M0 8 H38" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M34 4 L40 8 L34 12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="lg:hidden w-px h-6 bg-gradient-to-b from-gray-400 to-gray-300" />

          <ResultPanel result={result} />
        </main>

        {/* FOOTER */}
        <footer className="mt-8 text-center pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConstant ? 'bg-blue-500' : 'bg-orange-500'}`}
            />
            <p className="text-[11px] font-medium text-gray-600">
              {isConstant
                ? `Klasik: ${steps.length} query, semua output sama → CONSTANT`
                : `Klasik: Perbedaan ditemukan di query ke-${steps.findIndex(s => s.status === 'differs') + 1} → BALANCED`}
            </p>
          </div>
        </footer>
      </div>

      {/* DOWNLOAD BUTTON */}
      <button
        onClick={onDownload}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[12px] font-medium rounded-full shadow-lg hover:bg-gray-800 transition-all active:scale-95 z-50"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download PNG
      </button>
    </div>
  );
}
