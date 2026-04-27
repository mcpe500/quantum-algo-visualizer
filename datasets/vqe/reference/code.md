import React from 'react';
import { Camera } from 'lucide-react';

const datasets = [
  {
    case_id: "VQE-01",
    problem_type: "molecule_ground_state",
    molecule_spec: {
      formula: "H2",
      interatomic_distance_angstrom: 0.735,
      basis: "sto-3g"
    },
    preprocessing: {
      mapping: "jordan_wigner",
      target_qubits: 2
    },
    experiment: {
      ansatz_type: "ry_linear",
      n_layers: 1
    },
    hamiltonian: [
      { pauli: ['I', 'I'], coef: -1.052 },
      { pauli: ['I', 'Z'], coef: -0.398 },
      { pauli: ['Z', 'I'], coef: 0.398 },
      { pauli: ['X', 'X'], coef: 0.181 },
      { pauli: ['Y', 'Y'], coef: 0.181 },
      { pauli: ['Z', 'Z'], coef: -0.011 },
    ],
    summary: { z: 4, xy: 2 }
  },
  {
    case_id: "VQE-02",
    problem_type: "molecule_ground_state",
    molecule_spec: {
      formula: "H2",
      interatomic_distance_angstrom: 0.735,
      basis: "sto-3g"
    },
    preprocessing: {
      mapping: "jordan_wigner",
      target_qubits: 4
    },
    experiment: {
      ansatz_type: "ry_linear",
      n_layers: 2
    },
    hamiltonian: [
      { pauli: ['I', 'I', 'I', 'I'], coef: 1.320 },
      { pauli: ['I', 'Z', 'I', 'I'], coef: -0.940 },
      { pauli: ['Z', 'I', 'I', 'I'], coef: -0.940 },
      { pauli: ['I', 'I', 'Z', 'I'], coef: -0.440 },
      { pauli: ['I', 'I', 'I', 'Z'], coef: -0.440 },
      { pauli: ['Z', 'Z', 'I', 'I'], coef: 0.410 },
      { pauli: ['I', 'I', 'Z', 'Z'], coef: 0.400 },
      { pauli: ['I', 'Z', 'Z', 'I'], coef: 0.390 },
      { pauli: ['Z', 'I', 'I', 'Z'], coef: 0.390 },
      { pauli: ['I', 'Z', 'I', 'Z'], coef: 0.280 },
      { pauli: ['Z', 'I', 'Z', 'I'], coef: 0.280 },
      { pauli: ['X', 'X', 'Y', 'Y'], coef: -0.120 },
      { pauli: ['X', 'Y', 'Y', 'X'], coef: 0.120 },
      { pauli: ['Y', 'X', 'X', 'Y'], coef: 0.120 },
      { pauli: ['Y', 'Y', 'X', 'X'], coef: -0.120 },
    ],
    summary: { z: 11, xy: 4 }
  }
];

// Komponen Panah Simple (Seperti di gambar)
const Arrow = () => (
  <div className="flex justify-center items-center px-2 lg:px-4 shrink-0 py-4 lg:py-0">
    <span className="text-slate-800 text-3xl font-light leading-none rotate-90 lg:rotate-0">→</span>
  </div>
);

// 1. Fase RAW
const RawVisual = ({ formula, distance, basis }) => (
  <div className="bg-white border border-slate-100 rounded-[20px] p-5 flex flex-col items-center w-full lg:w-[260px] shadow-sm relative shrink-0">
    <div className="absolute top-4 left-4 bg-slate-100 text-slate-500 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
      RAW
    </div>
    
    <div className="mt-12 flex items-center justify-center relative w-full mb-8">
      {/* Atom H (Kiri) */}
      <div className="w-14 h-14 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center z-10">
        <span className="text-red-500 font-bold text-xl">H</span>
      </div>
      
      {/* Garis & Teks Jarak */}
      <div className="h-[2px] bg-slate-200 w-16 relative flex items-center justify-center -mx-1">
        <div className="absolute top-3 bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-500 whitespace-nowrap shadow-sm">
          {distance} A
        </div>
      </div>
      
      {/* Atom H (Kanan) */}
      <div className="w-14 h-14 rounded-full bg-sky-50 border-2 border-sky-100 flex items-center justify-center z-10">
        <span className="text-sky-500 font-bold text-xl">H</span>
      </div>
    </div>
    
    <div className="flex gap-2 mt-auto">
      <span className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full">{formula}</span>
      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase">{basis}</span>
    </div>
  </div>
);

// 2. Fase TRANSFORM
const TransformVisual = ({ mapping, target_qubits }) => {
  const isJW = mapping === 'jordan_wigner';
  const label1 = isJW ? (target_qubits === 2 ? 'verified 2q' : 'Jordan-Wigner') : mapping;
  
  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-5 flex flex-col items-center w-full lg:w-[260px] shadow-sm relative shrink-0">
      <div className="absolute top-4 left-4 bg-slate-100 text-slate-500 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
        TRANSFORM
      </div>
      
      <div className="mt-12 w-[88px] h-[88px] bg-[#f8f5ff] rounded-2xl border border-[#f3eefe] relative flex items-center justify-center mb-6">
        <div className="absolute w-[44px] h-[3px] bg-[#e9d5ff] rounded-full"></div>
        <div className="absolute h-[44px] w-[3px] bg-[#e9d5ff] rounded-full"></div>
        <div className="grid grid-cols-2 gap-[14px] z-10 relative">
          <div className="w-[14px] h-[14px] rounded-full bg-[#38bdf8]"></div>
          <div className="w-[14px] h-[14px] rounded-full bg-[#fb7185]"></div>
          <div className="w-[14px] h-[14px] rounded-full bg-[#34d399]"></div>
          <div className="w-[14px] h-[14px] rounded-full bg-[#fbbf24]"></div>
        </div>
      </div>
      
      <div className="flex gap-2 mb-5">
        <span className="bg-[#f3e8ff] text-[#9333ea] text-[10px] font-bold px-3 py-1 rounded-full">{label1}</span>
        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full">{target_qubits}q</span>
      </div>

      <div className="w-full flex flex-col gap-2.5 mt-auto">
        {Array.from({ length: target_qubits }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 w-[14px]">q{i}</span>
            <div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-sky-300 via-indigo-300 to-emerald-300"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Fase HAMILTONIAN
const HamiltonianVisual = ({ terms, summary }) => {
  const getPauliStyle = (p) => {
    switch(p) {
      case 'I': return 'bg-slate-100 text-slate-500';
      case 'Z': return 'bg-sky-100 text-sky-500';
      case 'X': return 'bg-rose-100 text-rose-500';
      case 'Y': return 'bg-emerald-100 text-emerald-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const maxAbsCoef = Math.max(...terms.map(t => Math.abs(t.coef)));

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-5 flex flex-col w-full lg:w-[320px] shadow-sm relative shrink-0">
      <div className="absolute top-4 left-4 bg-slate-100 text-slate-500 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
        HAMILTONIAN
      </div>
      
      <div className="mt-10 flex justify-between items-center mb-4">
        <div className="text-[11px] font-bold text-slate-800 font-mono">H = Σ cP</div>
        <div className="flex gap-1.5">
          {summary.z > 0 && <span className="bg-sky-50 text-sky-500 text-[9px] font-bold px-2 py-0.5 rounded-full">{summary.z} Z</span>}
          {summary.xy > 0 && <span className="bg-emerald-50 text-emerald-500 text-[9px] font-bold px-2 py-0.5 rounded-full">{summary.xy} X/Y</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 overflow-y-auto custom-scrollbar max-h-[160px] pr-2">
        {terms.map((term, idx) => {
          const isNegative = term.coef < 0;
          const barWidthPercent = (Math.abs(term.coef) / maxAbsCoef) * 100;
          
          return (
            <div key={idx} className="flex items-center justify-between group">
              {/* String Pauli */}
              <div className="flex gap-1">
                {term.pauli.map((p, i) => (
                  <div key={i} className={`w-[20px] h-[20px] rounded flex items-center justify-center text-[10px] font-bold ${getPauliStyle(p)}`}>
                    {p}
                  </div>
                ))}
              </div>
              
              {/* Nilai dan Bar */}
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold font-mono w-10 text-right ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {term.coef > 0 ? '+' : ''}{term.coef.toFixed(3)}
                </span>
                <div className="w-14 h-1.5 bg-slate-100 rounded-full flex justify-start overflow-hidden">
                  <div 
                    className="bg-slate-800 h-full rounded-full" 
                    style={{ width: `${Math.max(5, barWidthPercent)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-sans">
      <div className="max-w-[1000px] mx-auto space-y-8">
        
        {datasets.map((data) => (
          <div key={data.case_id} className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
            
            {/* Header / Judul seperti di gambar ke-4 */}
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 text-white text-[13px] font-bold px-4 py-1.5 rounded-full">
                  {data.case_id}
                </div>
                <div className="text-slate-500 text-[13px] font-medium hidden sm:block">
                  {data.preprocessing.target_qubits}q / {data.experiment.ansatz_type} / {data.hamiltonian.length} terms
                </div>
              </div>
              <button className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors">
                <Camera size={16} strokeWidth={2} />
              </button>
            </div>

            {/* FLOW PIPELINE */}
            <div className="flex flex-col lg:flex-row items-center justify-center bg-transparent">
              
              <RawVisual 
                formula={data.molecule_spec.formula} 
                distance={data.molecule_spec.interatomic_distance_angstrom} 
                basis={data.molecule_spec.basis}
              />

              <Arrow />

              <TransformVisual 
                mapping={data.preprocessing.mapping} 
                target_qubits={data.preprocessing.target_qubits} 
              />

              <Arrow />

              <HamiltonianVisual 
                terms={data.hamiltonian} 
                summary={data.summary}
              />

            </div>
          </div>
        ))}
        
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
}


this is the example images:
- ![alt text](image-1.png)
- ![alt text](image-2.png)
