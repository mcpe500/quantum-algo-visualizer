import type { ReactNode } from 'react';

interface PseudocodeBlockProps {
  pseudocode: string[];
  case_id: string;
}

function highlightKeywords(text: string): ReactNode {
  const keywords = ['BACA', 'OUTPUT_AWAL', 'BATAS_UJI', 'FOR', 'INDEKS', 'UJI', 'END FOR', 'TULIS', 'BERHENTI', 'KARENA', 'LANJUT'];
  const constantMatch = text.match(/"CONSTANT"/);
  const balancedMatch = text.match(/"BALANCED"/);
  
  let result: ReactNode = text;
  
  if (constantMatch) {
    result = <span className="text-blue-600 font-bold">"CONSTANT"</span>;
  } else if (balancedMatch) {
    result = <span className="text-orange-600 font-bold">"BALANCED"</span>;
  } else {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        result = text.split(kw).map((part, i) => (
          <span key={i}>
            {part}
            {i < text.split(kw).length - 1 && <span className="font-bold text-slate-800">{kw}</span>}
          </span>
        ));
        break;
      }
    }
  }
  
  return result;
}

export function PseudocodeBlock({ pseudocode }: PseudocodeBlockProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
          Algoritma 4.1 Solusi Klasik Deutsch-Jozsa
        </p>
      </div>
      
      <div className="px-4 py-3 bg-slate-50 font-mono text-[11px] leading-relaxed">
        {pseudocode.map((line, idx) => {
          const lineNum = String(idx + 1).padStart(2, '0');
          
          return (
            <div key={idx} className="flex">
              <span className="w-7 text-slate-400 select-none shrink-0">
                {lineNum}:
              </span>
              <span className="text-slate-800">
                {highlightKeywords(line)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
