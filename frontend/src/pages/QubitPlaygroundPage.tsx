import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ScenarioPresets } from '../components/qubit-playground/ScenarioPresets';
import { GateButtons } from '../components/qubit-playground/GateButtons';
import { StateInfoPanel } from '../components/qubit-playground/StateInfoPanel';
import CircuitLabTab from '../components/qubit-playground/CircuitLabTab';
import { QubitStatePreview } from '../components/qubit-playground/QubitStatePreview';
import { useQubitState } from '../components/qubit-playground/useQubitState';
import { useCircuitBuilder } from '../components/qubit-playground/useCircuitBuilder';
import { PAGE_BACKGROUND_CLASS } from '../constants/ui';

const SINGLE_GATE_NAMES = ['H', 'X', 'Y', 'Z', 'S', 'T', 'Rx', 'Ry', 'Rz'];
const TWO_QUBIT_GATE_NAMES = ['CNOT', 'SWAP', 'CPhase'];

interface QubitPlaygroundPageProps {
  initialTab?: 'state' | 'circuit';
}

export default function QubitPlaygroundPage({ initialTab = 'state' }: QubitPlaygroundPageProps) {
  const [activeTab, setActiveTab] = useState<'state' | 'circuit'>(initialTab);

  useEffect(() => {
    queueMicrotask(() => setActiveTab(initialTab));
  }, [initialTab]);

  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('THREE.Clock')) return;
      originalWarn.apply(console, args);
    };
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  const {
    numQubits,
    statevector,
    history,
    blochData,
    setNumQubits,
    applySingleGate,
    applyTwoQubitGate,
    loadScenario,
    reset,
    undo,
  } = useQubitState();
  const circuitBuilder = useCircuitBuilder();

  const blochCards = blochData.map((b, i) => ({ ...b, label: `q${i}` }));
  const pageWidthClass = activeTab === 'circuit' ? 'max-w-none' : 'max-w-[1280px]';
  const pageSubtitle = useMemo(
    () => activeTab === 'state'
      ? 'Main-main dengan qubit dan gerbang quantum secara interaktif.'
      : 'Susun circuit dengan drag-and-drop, lalu amati state dan insight otomatis seperti phase kickback.',
    [activeTab]
  );

  const handleApplySingleGate = useCallback(
    (gateIndex: number, target: number, angle?: number) => {
      if (gateIndex >= 0 && gateIndex < SINGLE_GATE_NAMES.length) {
        applySingleGate(SINGLE_GATE_NAMES[gateIndex], target, angle);
      }
    },
    [applySingleGate]
  );

  const handleApplyTwoQubitGate = useCallback(
    (gateIndex: number, control: number, target: number, angle?: number) => {
      if (gateIndex >= 0 && gateIndex < TWO_QUBIT_GATE_NAMES.length) {
        applyTwoQubitGate(TWO_QUBIT_GATE_NAMES[gateIndex], control, target, angle);
      }
    },
    [applyTwoQubitGate]
  );

  const handleNumQubitsChange = useCallback(
    (n: number) => {
      setNumQubits(n);
    },
    [setNumQubits]
  );

  const tabSwitch = (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setActiveTab('state')}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === 'state'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        State Lab
      </button>
      <button
        type="button"
        onClick={() => setActiveTab('circuit')}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          activeTab === 'circuit'
            ? 'bg-slate-900 text-white'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        Circuit Lab
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} ${activeTab === 'circuit' ? 'p-4 lg:p-6' : 'p-6'}`}>
      <div className={`${pageWidthClass} mx-auto`}>
        <Link
          to="/"
          className={`inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors ${
            activeTab === 'circuit' ? 'mb-4' : 'mb-6'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Algorithms
        </Link>

        {activeTab === 'state' ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quantum Playground</h1>
                <p className="text-sm text-gray-500 mt-0.5">{pageSubtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">Qubits:</span>
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleNumQubitsChange(n)}
                      className={`w-9 h-9 text-sm font-bold rounded-lg border-2 transition-all ${
                        numQubits === n
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {tabSwitch}
              </div>
            </div>

            <div className="mb-5">
              <ScenarioPresets onLoadScenario={loadScenario} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
              <div className="lg:col-span-7">
                <QubitStatePreview blochCards={blochCards} statevector={statevector} />
              </div>

              <div className="lg:col-span-5">
                <GateButtons
                  numQubits={numQubits}
                  onApplySingleGate={handleApplySingleGate}
                  onApplyTwoQubitGate={handleApplyTwoQubitGate}
                  onUndo={undo}
                  onReset={reset}
                  canUndo={history.length > 1}
                />
              </div>
            </div>

            <StateInfoPanel
              statevector={statevector}
              blochData={blochCards}
              numQubits={numQubits}
              historyLength={history.length}
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quantum Playground</h1>
                <p className="text-sm text-gray-500 mt-0.5">{pageSubtitle}</p>
              </div>
              {tabSwitch}
            </div>

            <CircuitLabTab builder={circuitBuilder} />
          </div>
        )}
      </div>
    </div>
  );
}
