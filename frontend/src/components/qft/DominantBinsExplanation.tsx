import { Info, HelpCircle, ArrowRightLeft, Calculator } from 'lucide-react';
import { useState } from 'react';

interface DominantBinsExplanationProps {
  dominantBins: number[];
  dominantMagnitudes: number[];
  nPoints: number;
}

export function DominantBinsExplanation({ 
  dominantBins, 
  dominantMagnitudes,
  nPoints 
}: DominantBinsExplanationProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate frequency for each bin
  const getFrequency = (bin: number) => {
    // For real FFT, frequency = bin * sampling_rate / N
    // Assuming sampling rate = 1 (normalized), frequency = bin / N
    return (bin / nPoints).toFixed(4);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-amber-600" />
        <h3 className="text-sm font-bold text-gray-800">
          Penjelasan: Dominant Frequency Bins
        </h3>
      </div>

      {/* What is DFB */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('what')}
          className="w-full flex items-center justify-between bg-white border border-amber-200 rounded-lg p-3 hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Apa itu Frequency Bin?</span>
          </div>
          <span className="text-amber-500 text-lg">
            {expandedSection === 'what' ? '−' : '+'}
          </span>
        </button>
        
        {expandedSection === 'what' && (
          <div className="mt-2 p-3 bg-white border border-amber-100 rounded-lg text-xs text-gray-600 leading-relaxed">
            <p className="mb-2">
              <strong>Frequency Bin</strong> adalah slot/sel frekuensi dalam hasil FFT. 
              Bayangkan seperti kotak-kotak yang masing-masing menyimpan informasi 
              <strong> "seberapa kuat" </strong> sinyal pada frekuensi tertentu.
            </p>
            <p>
              Kalau sinyal asli berisi {nPoints} titik data, maka hasil FFT menghasilkan {nPoints} bin 
              (dari bin 0 sampai bin {nPoints - 1}), masing-masing merepresentasikan komponen frekuensi berbeda.
            </p>
          </div>
        )}
      </div>

      {/* Why Dominant */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('why')}
          className="w-full flex items-center justify-between bg-white border border-amber-200 rounded-lg p-3 hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Kenapa "Dominant"?</span>
          </div>
          <span className="text-amber-500 text-lg">
            {expandedSection === 'why' ? '−' : '+'}
          </span>
        </button>
        
        {expandedSection === 'why' && (
          <div className="mt-2 p-3 bg-white border border-amber-100 rounded-lg text-xs text-gray-600 leading-relaxed">
            <p className="mb-2">
              <strong>Dominant</strong> artinya <strong>paling dominan/kuat</strong>. 
              Dalam FFT, setiap bin memiliki nilai <strong>magnitude</strong> (besar amplitudo).
            </p>
            <p className="mb-2">
              Bin dengan <strong>magnitude tertinggi</strong> menunjukkan frekuensi yang paling 
              kuat hadir dalam sinyal asli. Ini seperti menemukan nada paling keras dalam sebuah lagu.
            </p>
            <div className="bg-gray-50 p-2 rounded border border-gray-200 mt-2">
              <p className="text-[10px] text-gray-500">
                <strong>Contoh:</strong> Jika suatu bin memiliki magnitude jauh lebih besar dari bin lainnya, 
                artinya frekuensi tersebut sangat kuat hadir dalam sinyal. Magnitude yang tinggi ini 
                menjadi dasar penentuan bin dominan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Why Bin 4 and 28 */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('symmetry')}
          className="w-full flex items-center justify-between bg-white border border-amber-200 rounded-lg p-3 hover:bg-amber-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Kenapa Ada 2 Bin Sama?</span>
          </div>
          <span className="text-amber-500 text-lg">
            {expandedSection === 'symmetry' ? '−' : '+'}
          </span>
        </button>
        
        {expandedSection === 'symmetry' && (
          <div className="mt-2 p-3 bg-white border border-amber-100 rounded-lg text-xs text-gray-600 leading-relaxed">
            <p className="mb-2">
              Ini adalah <strong>"Conjugate Symmetry"</strong> (Simetri Konjugat) dari FFT sinyal real.
            </p>
            <p className="mb-2">
              Karena sinyal input kita <strong>real</strong> (tidak kompleks), hasil FFT akan simetris:
            </p>
            <ul className="list-disc list-inside mb-2 space-y-1">
              <li>Bin <strong>k</strong> dan Bin <strong>(N-k)</strong> memiliki magnitude sama</li>
              <li>Untuk N={nPoints}: Bin k ↔ Bin {nPoints} - k</li>
            </ul>
            <div className="bg-amber-100 p-2 rounded border border-amber-200">
              <p className="text-[10px] text-amber-800">
                <strong>Intinya:</strong> Setiap pasangan bin simetris merepresentasikan <strong>satu frekuensi yang sama</strong>, 
                cuma ditampilkan dua kali karena sifat matematis FFT. Dalam analisis, kita cukup melihat setengah pertama 
                (bin 0 sampai {Math.floor(nPoints/2)}).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current Analysis */}
      <div className="bg-white border border-amber-300 rounded-lg p-4 mt-4">
        <h4 className="text-xs font-bold text-gray-800 mb-3">Analisis Hasil FFT Saat Ini:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {dominantBins.map((bin, idx) => {
            const magnitude = dominantMagnitudes[idx];
            const isMirror = dominantBins.some((_b, i) => 
              i !== idx && Math.abs(magnitude - dominantMagnitudes[i]) < 0.01
            );
            
            return (
              <div 
                key={bin} 
                className={`p-2 rounded border text-center ${
                  isMirror 
                    ? 'bg-amber-100 border-amber-300' 
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <p className="text-xs font-mono font-bold text-gray-800">
                  Bin {bin}
                </p>
                <p className="text-[10px] text-gray-600">
                  {magnitude.toFixed(2)}
                </p>
                <p className="text-[9px] text-gray-400">
                  f ≈ {getFrequency(bin)} Hz
                </p>
                {isMirror && (
                  <span className="text-[8px] text-amber-600 font-medium">
                    (mirror)
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-500 mt-3 italic">
          * f = frekuensi = bin / {nPoints} (asumsikan sampling rate = 1)
        </p>
      </div>
    </div>
  );
}
