interface InputsPanelProps {
  n_qubits: number;
  totalSteps: number;
}

export function InputsPanel({ n_qubits, totalSteps }: InputsPanelProps) {
  const totalInputs = Math.pow(2, n_qubits);
  const showCount = Math.min(3, totalSteps);
  const remaining = totalInputs - showCount;

  return (
    <div className="w-[160px] p-3 rounded-xl bg-white border border-gray-300 shadow-sm shrink-0 z-10">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold tracking-widest text-gray-800">INPUTS</span>
        <span className="text-[9px] font-bold text-gray-500">{totalInputs}x</span>
      </div>
      <div className="space-y-1">
        {Array.from({ length: showCount }, (_, i) => {
          const inputBin = i.toString(2).padStart(n_qubits, '0');
          return (
            <div
              key={i}
              className="flex items-center justify-between px-2 py-1 rounded bg-blue-50 border border-blue-100"
            >
              <span className="text-[10px] font-mono font-bold text-blue-700">{inputBin}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            </div>
          );
        })}

        {remaining > 0 && (
          <>
            <div className="flex items-center justify-center py-0.5">
              <span className="text-[12px] text-gray-400 font-light tracking-wider">⋮</span>
            </div>
            <div className="px-2 py-1.5 rounded bg-gray-50 border border-dashed border-gray-200">
              <span className="text-[9px] text-gray-500">
                +{remaining} input lainnya
              </span>
            </div>
          </>
        )}
      </div>
      <p className="text-[9px] text-gray-600 mt-2.5 text-center leading-tight">Dicek berurutan</p>
    </div>
  );
}
