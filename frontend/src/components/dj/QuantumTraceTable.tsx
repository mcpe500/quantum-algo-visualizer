import type { DJQuantumTrace } from '../../types/dj';

interface QuantumTraceTableProps {
  trace: DJQuantumTrace;
}

const PHASE_COLORS: Record<string, string> = {
  'init': 'bg-blue-50',
  'prep': 'bg-green-50',
  'oracle': 'bg-amber-50',
  'interference': 'bg-violet-50',
  'measure': 'bg-red-50',
};

export function QuantumTraceTable({ trace }: QuantumTraceTableProps) {
  const { n_qubits, stages } = trace;
  const inputLabels = Array.from({ length: n_qubits }, (_, i) => `q${i}`);

  return (
    <div className="bg-white border border-purple-200 rounded-xl overflow-hidden">
      <header className="text-center pt-4 pb-2 px-4">
        <p className="text-[10px] tracking-[0.2em] text-purple-600 font-bold uppercase">Tracing per Kolom Sirkuit</p>
        <h2 className="text-[16px] font-semibold text-gray-900 mt-1">
          {trace.case_id} - {trace.classification}
        </h2>
        <p className="text-[10px] text-gray-500 mt-1">
          {stages.length} kolom - 1 baris = 1 kolom sirkuit
        </p>
      </header>

      <div className="px-4 pb-4 overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-purple-50">
              <th className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold w-10">#</th>
              <th className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold">Operasi</th>
              {inputLabels.map((label) => (
                <th key={label} className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold">{label}</th>
              ))}
              <th className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold">anc</th>
              <th className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold w-20">Phase</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, idx) => {
              const phaseClass = PHASE_COLORS[stage.phase] || 'bg-white';
              const rowClass = idx % 2 === 0 ? 'bg-purple-25' : 'bg-white';

              return (
                <tr key={stage.step} className={`${rowClass} ${phaseClass}`}>
                  <td className="border border-purple-100 px-2 py-1.5 text-center font-bold text-purple-700">
                    {stage.step}
                  </td>
                  <td className="border border-purple-100 px-2 py-1.5 text-gray-700 font-medium">
                    {stage.operation}
                  </td>
                  {inputLabels.map((_, i) => {
                    const marker = stage.wire_markers[String(i)] || '-';
                    const isControl = marker === '●';
                    return (
                      <td key={i} className="border border-purple-100 px-2 py-1.5 text-center font-mono text-gray-800">
                        {isControl ? (
                          <span className="text-purple-700 font-bold">●</span>
                        ) : (
                          marker
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-purple-100 px-2 py-1.5 text-center font-mono text-gray-800">
                    {stage.ancilla_marker === '⊕' ? (
                      <span className="text-orange-600 font-bold">⊕</span>
                    ) : stage.ancilla_marker === '●' ? (
                      <span className="text-purple-700 font-bold">●</span>
                    ) : (
                      stage.ancilla_marker || '-'
                    )}
                  </td>
                  <td className="border border-purple-100 px-2 py-1.5 text-center text-gray-500 italic text-[9px]">
                    {stage.phase}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}