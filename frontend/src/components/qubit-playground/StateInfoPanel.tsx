import { useMemo } from 'react';

interface SingleBlochData {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
  pZero: number;
  pOne: number;
  label: string;
}

interface StateInfoPanelProps {
  statevector: { re: number; im: number }[];
  blochData: SingleBlochData[];
  numQubits: number;
  historyLength: number;
  currentStepDescription?: string;
}

function formatProbability(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatAngle(radians: number): string {
  return `${(radians * 180 / Math.PI).toFixed(2)}°`;
}

function formatAmplitude(re: number, im: number): string {
  const absVal = Math.sqrt(re ** 2 + im ** 2);
  const threshold = 0.001;

  if (absVal < threshold) return '0';

  if (Math.abs(re - 1 / Math.sqrt(2)) < 0.01 && Math.abs(im) < threshold) {
    return '1/√2';
  }
  if (Math.abs(re + 1 / Math.sqrt(2)) < 0.01 && Math.abs(im) < threshold) {
    return '-1/√2';
  }
  if (Math.abs(im - 1 / Math.sqrt(2)) < 0.01 && Math.abs(re) < threshold) {
    return 'i/√2';
  }
  if (Math.abs(im + 1 / Math.sqrt(2)) < 0.01 && Math.abs(re) < threshold) {
    return '-i/√2';
  }
  if (Math.abs(re - 1) < threshold && Math.abs(im) < threshold) return '1';
  if (Math.abs(re + 1) < threshold && Math.abs(im) < threshold) return '-1';
  if (Math.abs(im - 1) < threshold && Math.abs(re) < threshold) return 'i';
  if (Math.abs(im + 1) < threshold && Math.abs(re) < threshold) return '-i';

  const reStr = re.toFixed(3).replace(/\.?0+$/, '');
  const imAbs = Math.abs(im).toFixed(3).replace(/\.?0+$/, '');
  const sign = im >= 0 ? '+' : '-';

  if (Math.abs(re) < threshold) return `${sign}${imAbs}i`;
  if (Math.abs(im) < threshold) return reStr;

  return `${reStr}${sign}${imAbs}i`;
}

function generateBasisLabel(index: number, numQubits: number): string {
  const binaryStr = index.toString(2).padStart(numQubits, '0');
  return `|${binaryStr}⟩`;
}

function isEntangled(statevector: { re: number; im: number }[], numQubits: number): boolean {
  if (numQubits < 2) return false;
  if (statevector.length !== Math.pow(2, numQubits)) return false;

  if (numQubits !== 2) return false;

  const c00 = statevector[0] || { re: 0, im: 0 };
  const c01 = statevector[1] || { re: 0, im: 0 };
  const c10 = statevector[2] || { re: 0, im: 0 };
  const c11 = statevector[3] || { re: 0, im: 0 };

  const p00 = c00.re * c00.re + c00.im * c00.im + c01.re * c01.re + c01.im * c01.im;
  const p11 = c10.re * c10.re + c10.im * c10.im + c11.re * c11.re + c11.im * c11.im;
  const offDiagRe = c00.re * c10.re + c00.im * c10.im + c01.re * c11.re + c01.im * c11.im;
  const offDiagIm = c00.re * c10.im - c00.im * c10.re + c01.re * c11.im - c01.im * c11.re;

  const purity = p00 * p00 + p11 * p11 + 2 * (offDiagRe * offDiagRe + offDiagIm * offDiagIm);

  return purity < 0.95;
}

function KetNotation({
  statevector,
  numQubits,
}: {
  statevector: { re: number; im: number }[];
  numQubits: number;
}) {
  const nonZeroStates = useMemo(() => {
    return statevector
      .map((sv, i) => ({ sv, i }))
      .filter(({ sv }) => Math.sqrt(sv.re ** 2 + sv.im ** 2) > 0.01)
      .sort((a, b) => {
        const probA = a.sv.re ** 2 + a.sv.im ** 2;
        const probB = b.sv.re ** 2 + b.sv.im ** 2;
        return probB - probA;
      });
  }, [statevector]);

  return (
    <div className="mb-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1.5">
        State Vector (Ket Notation)
      </h3>
      <div className="font-mono text-xs bg-gray-900 rounded p-2 overflow-x-auto">
        <div className="flex flex-wrap gap-2">
          {nonZeroStates.map(({ sv, i }) => {
            const amplitude = formatAmplitude(sv.re, sv.im);
            const basis = generateBasisLabel(i, numQubits);
            return (
              <span key={i} className="text-cyan-400 whitespace-nowrap">
                {amplitude}{basis}
              </span>
            );
          })}
          {nonZeroStates.length === 0 && (
            <span className="text-gray-500">No active states</span>
          )}
        </div>
      </div>
    </div>
  );
}

function QubitDataTable({
  blochData,
}: {
  blochData: SingleBlochData[];
}) {
  return (
    <div className="mb-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1.5">
        Per-Qubit Bloch Coordinates
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-gray-500 border-b border-gray-700">
              <th className="text-left py-1.5 pr-3">Qubit</th>
              <th className="text-right py-1.5 pr-3">θ</th>
              <th className="text-right py-1.5 pr-3">φ</th>
              <th className="text-right py-1.5 pr-3">P(|0⟩)</th>
              <th className="text-right py-1.5">P(|1⟩)</th>
            </tr>
          </thead>
          <tbody>
            {blochData.map((bloch, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-1.5 pr-3 text-cyan-400">{bloch.label}</td>
                <td className="text-right py-1.5 pr-3 text-gray-300">
                  {formatAngle(bloch.theta)}
                </td>
                <td className="text-right py-1.5 pr-3 text-gray-300">
                  {formatAngle(bloch.phi)}
                </td>
                <td className="text-right py-1.5 pr-3 text-green-400">
                  {formatProbability(bloch.pZero)}
                </td>
                <td className="text-right py-1.5 text-red-400">
                  {formatProbability(bloch.pOne)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EntanglementBadge({
  entangled,
}: {
  entangled: boolean;
}) {
  return (
    <div className="mb-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase mb-1.5">
        Quantum State Classification
      </h3>
      <div className="flex items-center gap-2">
        {entangled ? (
          <>
            <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-purple-400 font-mono text-sm">
              Entangled
            </span>
            <span className="text-gray-500 text-xs">
              (multi-qubit correlations detected)
            </span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-green-400 font-mono text-sm">
              Separable / Product State
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function StateInfoPanel({
  statevector,
  blochData,
  numQubits,
  historyLength,
  currentStepDescription,
}: StateInfoPanelProps) {
  const entangled = useMemo(
    () => isEntangled(statevector, numQubits),
    [statevector, numQubits]
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4 text-gray-100 w-full">
      {currentStepDescription && (
        <div className="mb-4 pb-3 border-b border-gray-700">
          <p className="text-sm text-gray-400">{currentStepDescription}</p>
        </div>
      )}

      <KetNotation statevector={statevector} numQubits={numQubits} />

      <QubitDataTable blochData={blochData} />

      <EntanglementBadge entangled={entangled} />

      <div className="flex items-center justify-between text-xs text-gray-500 pt-1.5 border-t border-gray-700">
        <span>Step: {historyLength}</span>
        <span>Qubits: {numQubits}</span>
        <span>Dim: {statevector.length}</span>
      </div>
    </div>
  );
}

export default StateInfoPanel;
