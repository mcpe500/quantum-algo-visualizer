import type { ClassicalResult } from '../../types/classical';

interface ResultPanelProps {
  result: ClassicalResult;
}

export function ResultPanel({ result }: ResultPanelProps) {
  const { n_qubits, classification, steps } = result;
  const totalInputs = Math.pow(2, n_qubits);
  const maxQueries = Math.pow(2, n_qubits - 1) + 1;
  const isConstant = classification === 'CONSTANT';

  const checkedSteps = steps.filter((s) => s.status === 'checked');
  const diffStep = steps.find((s) => s.status === 'differs');

  return (
    <div className="w-[180px] p-4 rounded-xl bg-white border border-gray-300 shadow-sm shrink-0 z-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-widest text-gray-800 uppercase">Hasil</span>
      </div>

      <div className="space-y-2">
        {isConstant ? (
          <>
            {steps.map((step) => (
              <div
                key={step.index}
                className="w-full h-8 rounded bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold"
              >
                {step.output}
              </div>
            ))}
            {Array.from({ length: totalInputs - maxQueries }, (_, i) => (
              <div
                key={`unknown-${i}`}
                className="w-full h-8 rounded bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[11px]"
              >
                ?
              </div>
            ))}
          </>
        ) : (
          <>
            {diffStep && (
              <div className="w-full h-8 rounded bg-orange-500 flex items-center justify-center text-white text-[11px] font-bold animate-pulse">
                {diffStep.output}
              </div>
            )}
            {checkedSteps.slice(0, 3).map((step) => (
              <div
                key={step.index}
                className="w-full h-8 rounded bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold"
              >
                {step.output}
              </div>
            ))}
            {Array.from({ length: totalInputs - checkedSteps.length - 1 }, (_, i) => (
              <div
                key={`unknown-${i}`}
                className="w-full h-8 rounded bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[11px]"
              >
                ?
              </div>
            ))}
          </>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-700 leading-snug">
          {isConstant ? (
            <>
              Semua sama → <span className="font-bold text-gray-900">CONSTANT</span>
            </>
          ) : (
            <>
              Beda ditemukan → <span className="font-bold text-gray-900">BALANCED</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
