import type { ClassicalResult } from '../../types/classical';

interface ResultPanelProps {
  result: ClassicalResult;
}

export function ResultPanel({ result }: ResultPanelProps) {
  const { n_qubits, classification, steps } = result;
  const totalInputs = Math.pow(2, n_qubits);
  const isConstant = classification === 'CONSTANT';

  const diffStep = steps.find((s) => s.status === 'differs');

  return (
    <div className="w-[180px] p-4 rounded-xl bg-white border border-gray-300 shadow-sm shrink-0 z-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-widest text-gray-800 uppercase">Hasil</span>
        <span className="text-[9px] font-bold text-gray-500">{steps.length}/{totalInputs}</span>
      </div>

      <div className="space-y-1.5">
        {isConstant ? (
          <>
            {steps.map((step) => (
              <div
                key={step.index}
                className="w-full h-7 rounded bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold"
              >
                {step.output}
              </div>
            ))}
          </>
        ) : (
          <>
            {diffStep && (
              <div className="w-full h-7 rounded bg-orange-500 flex items-center justify-center text-white text-[11px] font-bold">
                {diffStep.output}
              </div>
            )}
            {steps
              .filter((s) => s.status === 'checked')
              .slice(0, 4)
              .map((step) => (
                <div
                  key={step.index}
                  className="w-full h-7 rounded bg-blue-500 flex items-center justify-center text-white text-[11px] font-bold"
                >
                  {step.output}
                </div>
              ))}
          </>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-100">
        {isConstant ? (
          <p className="text-[10px] text-gray-700 leading-snug">
            {steps.length} query → semua sama →{' '}
            <span className="font-bold text-gray-900">CONSTANT</span>
          </p>
        ) : (
          <p className="text-[10px] text-gray-700 leading-snug">
            Beda di query ke-{diffStep ? diffStep.index + 1 : '?'} →{' '}
            <span className="font-bold text-gray-900">BALANCED</span>
          </p>
        )}
      </div>
    </div>
  );
}
