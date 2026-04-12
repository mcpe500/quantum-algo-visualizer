import type { DJQuantumTrace } from '../../types/dj';

interface QuantumTraceTableProps {
  trace: DJQuantumTrace;
}

export function QuantumTraceTable({ trace }: QuantumTraceTableProps) {
  const { n_qubits, stages } = trace;
  const inputLabels = Array.from({ length: n_qubits }, (_, i) => `q${i}`);
  const ancLabel = `q${n_qubits}`;

  const parseStates = (inputStr: string): string[] => {
    const stateChunks: string[] = [];
    let pos = 0;
    while (pos < inputStr.length) {
      if (inputStr.substr(pos, 3) === '|0⟩') {
        stateChunks.push('|0⟩');
        pos += 3;
      } else if (inputStr.substr(pos, 3) === '|1⟩') {
        stateChunks.push('|1⟩');
        pos += 3;
      } else if (inputStr.substr(pos, 3) === '|+⟩') {
        stateChunks.push('|+⟩');
        pos += 3;
      } else if (inputStr.substr(pos, 3) === '|−⟩') {
        stateChunks.push('|−⟩');
        pos += 3;
      } else {
        stateChunks.push(inputStr[pos] || '-');
        pos += 1;
      }
    }
    while (stateChunks.length < n_qubits) {
      stateChunks.push('-');
    }
    return stateChunks;
  };

  return (
    <div className="bg-white border border-purple-200 rounded-xl overflow-hidden">
      <header className="text-center pt-4 pb-2 px-4">
        <p className="text-[10px] tracking-[0.2em] text-purple-600 font-bold uppercase">Tracing Transformasi</p>
        <h2 className="text-[16px] font-semibold text-gray-900 mt-1">
          {trace.case_id} - {trace.classification}
        </h2>
      </header>

      <div className="px-4 pb-4 overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-purple-50">
              <th className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold">Step</th>
              <th className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold">Operasi</th>
              {inputLabels.map((label) => (
                <th key={label} className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold">{label}</th>
              ))}
              <th className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold">{ancLabel}</th>
              <th className="border border-purple-200 px-2 py-1.5 text-purple-800 font-bold">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage, idx) => {
              const stateChunks = parseStates(stage.inputs);
              return (
                <tr key={stage.step} className={idx % 2 === 0 ? 'bg-purple-25' : 'bg-white'}>
                  <td className="border border-purple-100 px-2 py-1.5 text-center font-bold text-purple-700">
                    {stage.step}
                  </td>
                  <td className="border border-purple-100 px-2 py-1.5 text-gray-700 font-medium">
                    {stage.operation}
                  </td>
                  {inputLabels.map((_, i) => (
                    <td key={i} className="border border-purple-100 px-2 py-1.5 text-center font-mono text-gray-800">
                      {stateChunks[i] || '-'}
                    </td>
                  ))}
                  <td className="border border-purple-100 px-2 py-1.5 text-center font-mono text-gray-800">
                    {stage.ancilla}
                  </td>
                  <td className="border border-purple-100 px-2 py-1.5 text-gray-400 italic">-</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}