import { Settings2, Database } from 'lucide-react';
import { Card } from '../ui/Card';
import type { DJCase } from '../../types/dj';

interface CaseSelectorProps {
  cases: DJCase[];
  selectedCaseId: string;
  shots: number;
  onCaseSelect: (id: string) => void;
  onShotsChange: (shots: number) => void;
}

export function CaseSelector({
  cases,
  selectedCaseId,
  shots,
  onCaseSelect,
  onShotsChange,
}: CaseSelectorProps) {
  const selectedCase = cases.find((c) => c.case_id === selectedCaseId);

  return (
    <Card title="Konfigurasi" icon={Settings2}>
      <div className="space-y-6">
        <div>
          <label className="text-xs text-slate-500 uppercase font-bold block mb-3">
            Pilih Kes Ujian
          </label>
          <div className="grid grid-cols-2 gap-2">
            {cases.map((c) => (
              <button
                key={c.case_id}
                onClick={() => onCaseSelect(c.case_id)}
                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  selectedCaseId === c.case_id
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 border shadow-inner'
                    : 'bg-slate-800/50 border-transparent text-slate-500 border hover:bg-slate-800'
                }`}
              >
                {c.case_id}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500 uppercase font-bold block mb-3">
            Tembakan (Shots): {shots}
          </label>
          <input
            type="range"
            min="1"
            max="8192"
            step="1"
            value={shots}
            onChange={(e) => onShotsChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between mt-2 font-mono text-[10px] text-slate-600">
            <span>1</span>
            <span>1024</span>
            <span>8192</span>
          </div>
        </div>

        {selectedCase && (
          <div className="pt-6 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-300 uppercase">
                Perincian Orakel
              </span>
            </div>
            <div className="bg-black/30 p-4 rounded-xl space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Bil. Qubit</span>
                <span className="text-xs font-mono text-cyan-400">
                  {selectedCase.n_qubits} Qubits
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Jenis Jangkaan</span>
                <span
                  className={`text-xs font-bold ${
                    selectedCase.expected_classification === 'CONSTANT'
                      ? 'text-blue-400'
                      : 'text-purple-400'
                  }`}
                >
                  {selectedCase.expected_classification}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
