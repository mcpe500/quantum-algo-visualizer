import type { ClassicalStep } from '../../types/classical';

interface InputsPanelProps {
  n_qubits: number;
  steps: ClassicalStep[];
}

export function InputsPanel({ n_qubits, steps }: InputsPanelProps) {
  const totalInputs = Math.pow(2, n_qubits);
  const checkedInputs = steps.map(s => s.input);

  // Generate all possible inputs
  const allInputs = Array.from({ length: totalInputs }, (_, i) =>
    i.toString(2).padStart(n_qubits, '0')
  );

  // Determine which inputs to show
  let displayItems: { type: 'input' | 'ellipsis' | 'remaining'; input?: string; isChecked?: boolean; count?: number }[] = [];

  if (n_qubits <= 3) {
    // For 3 qubits (8 inputs): show all
    displayItems = allInputs.map(input => ({
      type: 'input' as const,
      input,
      isChecked: checkedInputs.includes(input)
    }));
  } else {
    // For 4+ qubits: show first N, ellipsis, +N remaining, and last 2 possible inputs
    const firstCount = 3;
    const lastCount = 2;
    
    // Calculate remaining count: total - first - last
    const remainingCount = totalInputs - firstCount - lastCount;

    // Add first inputs
    allInputs.slice(0, firstCount).forEach(input => {
      displayItems.push({
        type: 'input',
        input,
        isChecked: checkedInputs.includes(input)
      });
    });

    // Add first ellipsis
    displayItems.push({ type: 'ellipsis' });

    // Add "+N input lainnya" in the middle
    if (remainingCount > 0) {
      displayItems.push({
        type: 'remaining',
        count: remainingCount
      });
    }

    // Add second ellipsis
    displayItems.push({ type: 'ellipsis' });

    // Add last 2 possible inputs (1110, 1111 for 4 qubits)
    allInputs.slice(-lastCount).forEach(input => {
      displayItems.push({
        type: 'input',
        input,
        isChecked: checkedInputs.includes(input)
      });
    });
  }

  return (
    <div className={`${n_qubits <= 3 ? 'w-[160px]' : 'w-[180px]'} p-3 rounded-xl bg-white border border-gray-300 shadow-sm shrink-0 z-10 max-h-[400px] overflow-y-auto`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold tracking-widest text-gray-800">POSSIBLE INPUTS</span>
        <span className="text-[9px] font-bold text-gray-500">{totalInputs}x</span>
      </div>
      <div className="space-y-1">
        {displayItems.map((item, idx) => {
          if (item.type === 'ellipsis') {
            return (
              <div key={`ellipsis-${idx}`} className="flex items-center justify-center py-0.5">
                <span className="text-[12px] text-gray-400 font-light tracking-wider">⋮</span>
              </div>
            );
          }

          if (item.type === 'remaining') {
            return (
              <div key={`remaining-${idx}`} className="px-2 py-1.5 rounded bg-gray-50 border border-dashed border-gray-200">
                <span className="text-[9px] text-gray-500">
                  +{item.count} input lainnya
                </span>
              </div>
            );
          }

          // type === 'input'
          return (
            <div
              key={item.input}
              className={`flex items-center justify-between px-2 py-1 rounded border ${
                item.isChecked
                  ? 'bg-blue-50 border-blue-100'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <span className={`text-[10px] font-mono font-bold ${
                item.isChecked ? 'text-blue-700' : 'text-gray-400'
              }`}>
                {item.input}
              </span>
              {item.isChecked && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-gray-600 mt-2.5 text-center leading-tight">Dicek berurutan</p>
    </div>
  );
}
