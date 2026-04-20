import { useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BlochSphere3D } from '../components/qubit-playground/BlochSphere';
import { StatevectorBars } from '../components/qubit-playground/BlochSphere';
import { ScenarioPresets } from '../components/qubit-playground/ScenarioPresets';
import { GateButtons } from '../components/qubit-playground/GateButtons';
import { StateInfoPanel } from '../components/qubit-playground/StateInfoPanel';
import { useQubitState } from '../components/qubit-playground/useQubitState';
import { PAGE_BACKGROUND_CLASS } from '../constants/ui';

const SINGLE_GATE_NAMES = ['H', 'X', 'Y', 'Z', 'S', 'T', 'Rx', 'Ry', 'Rz'];
const TWO_QUBIT_GATE_NAMES = ['CNOT', 'SWAP', 'CPhase'];

export default function QubitPlaygroundPage() {
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

  const blochCards = blochData.map((b, i) => ({ ...b, label: `q${i}` }));

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

  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-6`}>
      <div className="max-w-[1280px] mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Algorithms
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Qubit Playground</h1>
            <p className="text-sm text-gray-500 mt-0.5">Main-main dengan qubit dan gerbang quantum secara interaktif</p>
          </div>
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
        </div>

        <div className="mb-5">
          <ScenarioPresets onLoadScenario={loadScenario} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {blochCards.map((bloch, i) => (
                  <div
                    key={bloch.label}
                    className={`rounded-lg border border-slate-200 bg-slate-50 overflow-hidden ${
                      numQubits === 3 && i === 2 ? 'md:col-span-2 xl:col-span-1' : ''
                    }`}
                  >
                    <div className="h-[240px] sm:h-[260px]">
                      <Canvas camera={{ position: [0, 0.3, 5.2], fov: 44 }}>
                        <OrbitControls
                          enablePan={false}
                          enableZoom={false}
                          enableDamping
                          dampingFactor={0.08}
                        />
                        <ambientLight intensity={0.4} />
                        <directionalLight position={[5, 5, 5]} intensity={0.8} />
                        <directionalLight position={[-5, -5, -5]} intensity={0.3} />
                        <BlochSphere3D blochData={[bloch]} numQubits={1} />
                      </Canvas>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <StatevectorBars statevector={statevector} />
              </div>
            </div>
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
      </div>
    </div>
  );
}
