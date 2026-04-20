import React, { useState } from 'react';
import { Undo2, RotateCcw } from 'lucide-react';

interface GateButtonsProps {
  numQubits: number;
  onApplySingleGate: (gateIndex: number, target: number, angle?: number) => void;
  onApplyTwoQubitGate: (gateIndex: number, control: number, target: number, angle?: number) => void;
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
}

const FIXED_GATES = [
  { symbol: 'H', fullName: 'Hadamard', index: 0 },
  { symbol: 'X', fullName: 'Pauli-X', index: 1 },
  { symbol: 'Y', fullName: 'Pauli-Y', index: 2 },
  { symbol: 'Z', fullName: 'Pauli-Z', index: 3 },
  { symbol: 'S', fullName: 'Phase (S)', index: 4 },
  { symbol: 'T', fullName: 'T Gate', index: 5 },
];

const PARAMETRIC_GATES = [
  { symbol: 'Rx', fullName: 'Rotation-X', name: 'Rx', index: 6 },
  { symbol: 'Ry', fullName: 'Rotation-Y', name: 'Ry', index: 7 },
  { symbol: 'Rz', fullName: 'Rotation-Z', name: 'Rz', index: 8 },
];

const TWO_QUBIT_GATES = [
  { symbol: 'CNOT', fullName: 'Controlled-NOT', name: 'CNOT', index: 0 },
  { symbol: 'SWAP', fullName: 'Swap', name: 'SWAP', index: 1 },
  { symbol: 'CPhase', fullName: 'Controlled-Phase', name: 'CPhase', index: 2 },
];

export const GateButtons: React.FC<GateButtonsProps> = ({
  numQubits,
  onApplySingleGate,
  onApplyTwoQubitGate,
  onUndo,
  onReset,
  canUndo,
}) => {
  const [angles, setAngles] = useState<Record<string, number>>({
    Rx: Math.PI / 4,
    Ry: Math.PI / 4,
    Rz: Math.PI / 4,
    CPhase: Math.PI / 4,
  });

  const [singleTarget, setSingleTarget] = useState<number>(0);
  const [parametricTargets, setParametricTargets] = useState<Record<string, number>>({
    Rx: 0,
    Ry: 0,
    Rz: 0,
  });
  const [twoQubitControl, setTwoQubitControl] = useState<number>(0);
  const [twoQubitTarget, setTwoQubitTarget] = useState<number>(1);

  const qubitOptions = Array.from({ length: numQubits }, (_, i) => i);

  const handleAngleChange = (gateName: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setAngles(prev => ({ ...prev, [gateName]: numValue }));
    }
  };

  const handleParametricApply = (gateName: string, index: number) => {
    const angle = angles[gateName];
    const target = parametricTargets[gateName];
    onApplySingleGate(index, target, angle);
  };

  const handleTwoQubitApply = (gateIndex: number) => {
    const angle = gateIndex === 2 ? angles.CPhase : undefined;
    onApplyTwoQubitGate(gateIndex, twoQubitControl, twoQubitTarget, angle);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <h2 className="text-base font-semibold text-gray-800">Quantum Gates</h2>

      {/* 1. Fixed Gates */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">1-Qubit Fixed</h3>
        <div className="flex flex-wrap items-center gap-2">
          {FIXED_GATES.map(gate => (
            <button
              key={gate.symbol}
              onClick={() => onApplySingleGate(gate.index, singleTarget)}
              title={`${gate.symbol} = ${gate.fullName}`}
              className="w-[4.75rem] h-12 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors flex flex-col items-center justify-center leading-none"
            >
              <span className="font-mono font-semibold text-sm">{gate.symbol}</span>
              <span className="text-[10px] font-medium mt-1">{gate.fullName}</span>
            </button>
          ))}
          <select
            value={singleTarget}
            onChange={e => setSingleTarget(Number(e.target.value))}
            className="h-9 px-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {qubitOptions.map(q => (
              <option key={q} value={q}>q{q}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Parametric Gates */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">1-Qubit Parametric</h3>
        <div className="space-y-2">
          {PARAMETRIC_GATES.map(gate => (
            <div key={gate.name} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="w-28 shrink-0 flex flex-col leading-none">
                <span className="font-mono font-semibold text-gray-700 text-sm">{gate.symbol}</span>
                <span className="text-[10px] text-gray-500 mt-1">{gate.fullName}</span>
              </span>
              <input
                type="number"
                step="0.1"
                value={angles[gate.name]}
                onChange={e => handleAngleChange(gate.name, e.target.value)}
                className="w-20 h-9 px-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <select
                value={parametricTargets[gate.name]}
                onChange={e => setParametricTargets(prev => ({ ...prev, [gate.name]: Number(e.target.value) }))}
                className="w-16 h-9 px-1 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {qubitOptions.map(q => (
                  <option key={q} value={q}>q{q}</option>
                ))}
              </select>
              <button
                onClick={() => handleParametricApply(gate.name, gate.index)}
                className="w-16 h-9 bg-green-50 hover:bg-green-100 text-green-700 font-medium rounded-lg border border-green-200 transition-colors text-sm"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. 2-Qubit Gates */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">2-Qubit</h3>
        <div className="space-y-2">
          {/* CNOT + SWAP row */}
          <div className="flex flex-wrap items-center gap-2">
            {TWO_QUBIT_GATES.slice(0, 2).map(gate => (
              <button
                key={gate.name}
                onClick={() => handleTwoQubitApply(gate.index)}
                disabled={twoQubitControl === twoQubitTarget}
                title={`${gate.symbol} = ${gate.fullName}`}
                className="w-[7.5rem] h-12 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg border border-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center leading-none"
              >
                <span className="font-mono font-semibold text-sm">{gate.symbol}</span>
                <span className="text-[10px] font-medium mt-1">{gate.fullName}</span>
              </button>
            ))}
          </div>
          {/* CPhase row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-28 shrink-0 flex flex-col leading-none">
              <span className="font-mono font-semibold text-gray-700 text-sm">CPhase</span>
              <span className="text-[10px] text-gray-500 mt-1">Controlled-Phase</span>
            </span>
            <input
              type="number"
              step="0.1"
              value={angles.CPhase}
              onChange={e => handleAngleChange('CPhase', e.target.value)}
              className="w-20 h-9 px-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              onClick={() => handleTwoQubitApply(2)}
              disabled={twoQubitControl === twoQubitTarget}
              className="w-16 h-9 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium rounded-lg border border-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Apply
            </button>
          </div>
          {/* Control + Target row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-600">Ctrl:</label>
              <select
                value={twoQubitControl}
                onChange={e => setTwoQubitControl(Number(e.target.value))}
                className="w-14 h-9 px-1 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {qubitOptions.map(q => (
                  <option key={q} value={q}>q{q}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-600">Tgt:</label>
              <select
                value={twoQubitTarget}
                onChange={e => setTwoQubitTarget(Number(e.target.value))}
                className="w-14 h-9 px-1 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {qubitOptions.map(q => (
                  <option key={q} value={q} disabled={q === twoQubitControl}>q{q}</option>
                ))}
              </select>
            </div>
            {twoQubitControl === twoQubitTarget && (
              <span className="text-xs text-red-500">must differ</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer: Undo + Reset */}
      <div className="border-t border-gray-200 pt-3 mt-1 flex justify-end gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </button>
        <button
          onClick={onReset}
          className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
};

export default GateButtons;