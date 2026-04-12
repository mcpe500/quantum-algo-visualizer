import { useRef } from 'react';
import type { ClassicalResult } from '../../types/classical';
import { InputsPanel } from './InputsPanel';
import { OraclePanel } from './OraclePanel';
import { ResultPanel } from './ResultPanel';

interface ClassicalVisualizationProps {
  result: ClassicalResult | null;
  onDownload: () => void;
}

export function ClassicalVisualization({ result, onDownload }: ClassicalVisualizationProps) {
  const captureRef = useRef<HTMLDivElement>(null);

  if (!result) {
    return (
      <div className="max-w-6xl mx-auto px-4 pb-12 w-full pt-16">
        <div className="flex flex-col items-center justify-center h-[400px]">
          <div className="text-gray-400 text-sm">Pilih kasus dan klik "Jalankan" untuk memulai.</div>
        </div>
      </div>
    );
  }

  const { case_id, n_qubits, classification, steps } = result;
  const maxQueries = Math.pow(2, n_qubits - 1) + 1;
  const isConstant = classification === 'CONSTANT';

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12 w-full pt-16">
      <div id="capture-area" ref={captureRef} className="bg-[#FAFAFA]">
        {/* HEADER */}
        <header className="text-center pt-8 lg:pt-10">
          <p className="text-[10px] tracking-[0.2em] text-gray-600 font-bold uppercase">Solusi Klasik - Brute Force</p>
          <h1 className="text-[28px] lg:text-[34px] font-semibold tracking-tight text-gray-900 mt-2">
            {case_id}: {classification}
          </h1>
          <p className="text-gray-700 mt-2 max-w-lg mx-auto text-[14px] leading-snug">
            Untuk n={n_qubits}, komputer klasik butuh maksimal {maxQueries} query untuk memastikan jenis fungsi.
          </p>
        </header>

        {/* MAIN FLOW */}
        <main className="flex flex-col lg:flex-row items-center justify-center mt-12 lg:mt-16 gap-4">
          <InputsPanel n_qubits={n_qubits} totalSteps={steps.length} />

          {/* ARROW */}
          <div className="hidden lg:block shrink-0 relative z-0">
            <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
              <path d="M0 10 H46" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M42 6 L48 10 L42 14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="lg:hidden w-px h-8 bg-gradient-to-b from-gray-400 to-gray-300" />

          <OraclePanel steps={steps} />

          {/* ARROW */}
          <div className="hidden lg:block shrink-0 relative z-0">
            <svg width="48" height="20" viewBox="0 0 48 20" fill="none">
              <path d="M0 10 H46" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M42 6 L48 10 L42 14" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="lg:hidden w-px h-8 bg-gradient-to-b from-gray-400 to-gray-300" />

          <ResultPanel result={result} />
        </main>

        {/* FOOTER */}
        <footer className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
            <span
              className={`w-1.5 h-1.5 rounded-full ${isConstant ? 'bg-blue-500' : 'bg-orange-500'}`}
            />
            <p className="text-[11px] font-medium text-gray-600">
              {isConstant
                ? 'Klasik: Semua output sama, perlu cek setengah + 1.'
                : 'Klasik: Ditemukan perbedaan di tengah jalan.'}
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
