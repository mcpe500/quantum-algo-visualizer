import { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RotateCcw, Undo2 } from 'lucide-react';
import { BlochSphere } from '../components/qubit-playground/BlochSphere';
import { StatePresets } from '../components/qubit-playground/StatePresets';
import { GateButtons } from '../components/qubit-playground/GateButtons';
import { StateInfoPanel } from '../components/qubit-playground/StateInfoPanel';
import { useQubitState } from '../components/qubit-playground/useQubitState';
import { GATES } from '../components/qubit-playground/constants';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PAGE_BACKGROUND_CLASS } from '../constants/ui';

export default function QubitPlaygroundPage() {
  const { state, history, pZero, pOne, setPreset, applyGate, reset, undo } = useQubitState();

  const handleGate = useCallback(
    (gateIndex: number) => {
      applyGate(GATES[gateIndex]);
    },
    [applyGate]
  );

  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-4 md:p-8`}>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Algorithms
      </Link>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Qubit Playground</h1>
          <p className="text-sm text-gray-500">
            Main-main dengan qubit. Pilih preset atau apply gate untuk transformasi state.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="h-[380px] md:h-[420px]">
            <Canvas camera={{ position: [0, 0.5, 3.2], fov: 45 }}>
              <OrbitControls enablePan={false} enableZoom minDistance={2} maxDistance={6} />
              <BlochSphere state={state} />
            </Canvas>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Preset States
            </p>
            <StatePresets onSelect={setPreset} />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Gate Operations
            </p>
            <GateButtons onApply={handleGate} />
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={undo}
              disabled={history.length <= 1}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Undo2 className="w-3 h-3" />
              Undo
            </button>
            <button
              onClick={reset}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>

        <div className="max-w-sm mx-auto">
          <StateInfoPanel
            state={state}
            pZero={pZero}
            pOne={pOne}
            historyLength={history.length}
          />
        </div>
      </div>
    </div>
  );
}
