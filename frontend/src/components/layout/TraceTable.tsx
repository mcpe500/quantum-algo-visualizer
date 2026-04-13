import { PHASE_COLORS } from '../../constants/phases';

interface TraceStage {
  step: number;
  operation: string;
  wire_markers: Record<string, string>;
  phase: string;
}

interface TraceTableProps {
  stages: TraceStage[];
  nQubits: number;
  title?: string;
}

export function TraceTable({
  stages,
  nQubits,
  title = 'Circuit Trace',
}: TraceTableProps) {
  const getMarkerClass = (marker: string): string => {
    switch (marker) {
      case '●':
        return 'text-purple-700 font-bold';
      case '⊕':
        return 'text-orange-600 font-bold';
      case 'M':
        return 'text-red-600 font-bold';
      case 'H':
        return 'text-blue-700 font-bold';
      case 'Rz':
        return 'text-orange-700 font-semibold';
      case 'Rx':
        return 'text-green-700 font-semibold';
      case 'Ry':
        return 'text-green-700 font-bold';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-700">Step</th>
              <th className="text-left py-2 px-3 font-medium text-gray-700">Operation</th>
              {Array.from({ length: nQubits }, (_, i) => (
                <th key={i} className="text-center py-2 px-2 font-medium text-gray-700">
                  q{i}
                </th>
              ))}
              <th className="text-left py-2 px-3 font-medium text-gray-700">Phase</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => (
              <tr key={stage.step} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-mono text-gray-900">{stage.step}</td>
                <td className="py-2 px-3 text-gray-700 text-xs">{stage.operation}</td>
                {Array.from({ length: nQubits }, (_, i) => (
                  <td key={i} className="text-center py-2 px-2 font-mono text-sm">
                    <span className={getMarkerClass(stage.wire_markers[i])}>
                      {stage.wire_markers[i] || '-'}
                    </span>
                  </td>
                ))}
                <td className="py-2 px-3">
                  <span
                    className={`inline-flex px-2 py-0.5 text-xs rounded ${PHASE_COLORS[stage.phase] ?? 'bg-gray-100 text-gray-700'}`}
                  >
                    {stage.phase}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
