import type { ClassicalStep } from '../../types/classical';

interface OraclePanelProps {
  steps: ClassicalStep[];
}

export function OraclePanel({ steps }: OraclePanelProps) {
  return (
    <div className="w-[200px] p-3 rounded-xl bg-white border border-gray-300 shadow-sm shrink-0 z-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold tracking-widest text-gray-800">ORACLE</span>
        <span className="text-[9px] font-bold text-gray-500">{steps.length}x QUERY</span>
      </div>
      <div className="space-y-1">
        {steps.map((step) => {
          const isDiff = step.status === 'differs';
          return (
            <div
              key={step.index}
              className={`flex items-center gap-2 px-2 py-1.5 rounded border ${
                isDiff ? 'border-orange-400 bg-orange-50' : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center text-white text-[9px] font-bold ${
                  isDiff ? 'bg-orange-500' : 'bg-blue-500'
                }`}
              >
                {step.index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-gray-800">{step.input}</span>
                  <span className={`text-[10px] font-bold ${isDiff ? 'text-orange-600' : 'text-blue-600'}`}>
                    {step.output}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
