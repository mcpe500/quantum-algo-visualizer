import { ArrowRight, Signal, FunctionSquare, BarChart3, Sparkles } from 'lucide-react';

interface QFTFlowDiagramProps {
  nPointsOriginal: number;
  nPointsPadded: number;
  dominantBins: number[];
}

export function QFTFlowDiagram({ nPointsOriginal, nPointsPadded, dominantBins }: QFTFlowDiagramProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-white to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-4 text-center">
        Alur Transformasi FFT (Fast Fourier Transform)
      </h3>
      
      <div className="flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-4">
        {/* Step 1: Input Signal */}
        <div className="flex flex-col items-center">
          <div className="bg-white border-2 border-blue-300 rounded-lg p-3 w-32 text-center shadow-sm">
            <Signal className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-xs font-semibold text-gray-800">Sinyal Input</p>
            <p className="text-[10px] text-gray-500">{nPointsOriginal} titik data</p>
            <p className="text-[9px] text-gray-400 mt-1">Domain: Waktu</p>
          </div>
        </div>

        {nPointsOriginal !== nPointsPadded && (
          <>
            {/* Arrow 1 */}
            <div className="flex flex-col items-center">
              <ArrowRight className="w-5 h-5 text-blue-400 hidden lg:block" />
              <div className="w-px h-4 bg-blue-300 lg:hidden" />
              <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded mt-1">
                Zero-Padding
              </span>
            </div>

            {/* Step 2: Padded Signal */}
            <div className="flex flex-col items-center">
              <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-3 w-32 text-center shadow-sm">
                <FunctionSquare className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-gray-800">Sinyal Pad</p>
                <p className="text-[10px] text-gray-600">{nPointsPadded} titik (2ⁿ)</p>
                <p className="text-[9px] text-blue-600 mt-1">Persiapan FFT</p>
              </div>
            </div>
          </>
        )}

        {nPointsOriginal === nPointsPadded && (
          <div className="flex flex-col items-center">
            <ArrowRight className="w-5 h-5 text-blue-400 hidden lg:block" />
            <div className="w-px h-4 bg-blue-300 lg:hidden" />
            <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded mt-1">
              Valid 2ⁿ
            </span>
          </div>
        )}

        {/* Arrow 2 */}
        <div className="flex flex-col items-center">
          <ArrowRight className="w-5 h-5 text-indigo-400 hidden lg:block" />
          <div className="w-px h-4 bg-indigo-300 lg:hidden" />
          <span className="text-[10px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded mt-1">
            FFT Algorithm
          </span>
        </div>

        {/* Step 3: FFT Output */}
        <div className="flex flex-col items-center">
          <div className="bg-indigo-50 border-2 border-indigo-400 rounded-lg p-3 w-32 text-center shadow-sm">
            <BarChart3 className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-gray-800">Spektrum FFT</p>
            <p className="text-[10px] text-gray-600">{nPointsPadded} bins</p>
            <p className="text-[9px] text-indigo-600 mt-1">Domain: Frekuensi</p>
          </div>
        </div>

        {/* Arrow 3 */}
        <div className="flex flex-col items-center">
          <ArrowRight className="w-5 h-5 text-amber-400 hidden lg:block" />
          <div className="w-px h-4 bg-amber-300 lg:hidden" />
          <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded mt-1">
            Analisis
          </span>
        </div>

        {/* Step 4: Dominant Bins */}
        <div className="flex flex-col items-center">
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-3 w-32 text-center shadow-sm">
            <Sparkles className="w-6 h-6 text-amber-600 mx-auto mb-1" />
            <p className="text-xs font-semibold text-gray-800">Frekuensi Dominan</p>
            <p className="text-[10px] text-gray-600">
              {dominantBins.slice(0, 2).join(', ')}{dominantBins.length > 2 ? '...' : ''}
            </p>
            <p className="text-[9px] text-amber-600 mt-1">Hasil Analisis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
