import type { VQEIterationSnapshot } from '../../types/vqe';

interface VQEHybridSplitViewProps {
  snapshot: VQEIterationSnapshot;
  fciEnergy: number;
  ansatzType: string;
  nLayers: number;
  hamiltonianTerms: Record<string, number>;
  nQubits: number;
  totalIterations: number;
  optimizerName: string;
  measurementMethod: string;
}

export function VQEHybridSplitView({
  snapshot,
  fciEnergy,
  ansatzType,
  nLayers,
  hamiltonianTerms,
  nQubits,
  totalIterations,
  optimizerName,
  measurementMethod,
}: VQEHybridSplitViewProps) {
  const energyError = Math.abs(snapshot.energy - fciEnergy);
  const accuracy = Math.max(0, Math.min(100, (1 - energyError / Math.max(Math.abs(fciEnergy), 1e-10)) * 100));

  const paramLabels = snapshot.parameters.map((p, i) => `θ${i}=${p.toFixed(3)}`).join(', ');

  const sortedTerms = Object.entries(hamiltonianTerms)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 relative">
        {/* Classical Column */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Classical (CPU)</h3>
            <span className="ml-auto text-xs font-mono text-slate-400">
              iter {snapshot.iteration} / {totalIterations}
            </span>
          </div>

          {/* Optimizer */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <div className="text-[11px] font-semibold text-blue-700 mb-1">Optimizer</div>
            <div className="text-sm font-mono text-blue-900">{optimizerName}</div>
            <div className="text-[11px] text-blue-600 mt-1">
              Gradient-free simplex method. Updates parameter vector θ based on energy evaluations.
            </div>
          </div>

          {/* Parameter Update */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-700 mb-1">Parameter Vector θ</div>
            <div className="text-xs font-mono text-slate-800 break-all">{paramLabels}</div>
            <div className="text-[11px] text-slate-500 mt-1">
              θ<sup>(t+1)</sup> = Optimize( E(θ<sup>(t)</sup>), θ<sup>(t)</sup> )
            </div>
          </div>

          {/* Energy Input from Quantum */}
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
            <div className="text-[11px] font-semibold text-purple-700 mb-1">Energy (from Quantum)</div>
            <div className="text-lg font-mono font-semibold text-purple-900">
              {snapshot.energy.toFixed(6)} Ha
            </div>
          </div>

          {/* Error */}
          <div className="rounded-lg border border-red-100 bg-red-50 p-3">
            <div className="text-[11px] font-semibold text-red-700 mb-1">Error vs FCI</div>
            <div className="text-sm font-mono text-red-800">|E − E<sub>FCI</sub>| = {energyError.toFixed(6)} Ha</div>
            <div className="text-sm font-mono text-red-800">Accuracy = {accuracy.toFixed(2)}%</div>
          </div>
        </div>

        {/* Boundary Arrows — Desktop */}
        <div className="hidden lg:flex flex-col justify-center items-center w-14 relative shrink-0">
          <svg width="56" height="180" viewBox="0 0 56 180" className="absolute">
            <defs>
              <marker id="arr-down" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker id="arr-up" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#9333ea" />
              </marker>
            </defs>
            {/* θ → Quantum */}
            <line x1="28" y1="30" x2="28" y2="75" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arr-down)" />
            <text x="32" y="55" fontSize="10" fill="#3b82f6" fontFamily="monospace">θ</text>
            {/* E ← Quantum */}
            <line x1="28" y1="150" x2="28" y2="105" stroke="#9333ea" strokeWidth="2" markerEnd="url(#arr-up)" />
            <text x="32" y="130" fontSize="10" fill="#9333ea" fontFamily="monospace">E</text>
          </svg>
        </div>

        {/* Boundary Arrows — Mobile */}
        <div className="flex lg:hidden justify-center items-center py-1">
          <svg width="200" height="32" viewBox="0 0 200 32">
            <defs>
              <marker id="arr-right" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker id="arr-left" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#9333ea" />
              </marker>
            </defs>
            <line x1="20" y1="16" x2="90" y2="16" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arr-right)" />
            <text x="52" y="12" fontSize="10" fill="#3b82f6" textAnchor="middle" fontFamily="monospace">θ</text>
            <line x1="180" y1="16" x2="110" y2="16" stroke="#9333ea" strokeWidth="2" markerEnd="url(#arr-left)" />
            <text x="148" y="12" fontSize="10" fill="#9333ea" textAnchor="middle" fontFamily="monospace">E</text>
          </svg>
        </div>

        {/* Quantum Column */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Quantum (QPU/Sim)</h3>
            <span className="ml-auto text-xs font-mono text-slate-400">{measurementMethod}</span>
          </div>

          {/* Circuit Image */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wide">
              Ansatz: {ansatzType} · {nQubits} qubit · {nLayers} layer{nLayers > 1 ? 's' : ''}
            </div>
            <img
              src={`data:image/png;base64,${snapshot.circuit_image}`}
              alt={`VQE circuit at iteration ${snapshot.iteration}`}
              className="w-full h-auto rounded border border-slate-300"
            />
          </div>

          {/* State Preparation */}
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
            <div className="text-[11px] font-semibold text-purple-700 mb-1">State Preparation</div>
            <div className="text-xs font-mono text-purple-900">
              |ψ(θ)⟩ = U(θ) |0⟩<sup>⊗{nQubits}</sup>
            </div>
            <div className="text-[11px] text-purple-600 mt-1">
              Ansatz builds parameterized trial state via rotation and entanglement gates.
            </div>
          </div>

          {/* Hamiltonian */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-700 mb-1">Molecular Hamiltonian</div>
            <div className="text-xs font-mono text-slate-800 mb-2">
              H = Σ<sub>i</sub> c<sub>i</sub> P<sub>i</sub>
            </div>
            <div className="space-y-1">
              {sortedTerms.map(([pauli, coeff]) => (
                <div key={pauli} className="flex justify-between text-xs font-mono">
                  <span className="text-slate-600">{pauli}</span>
                  <span className="text-slate-800">{coeff.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Energy Measurement */}
          <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
            <div className="text-[11px] font-semibold text-teal-700 mb-1">Energy Measurement</div>
            <div className="text-xs font-mono text-teal-900">
              E(θ) = ⟨ψ(θ)| H |ψ(θ)⟩
            </div>
            <div className="text-[11px] text-teal-600 mt-1">
              Expectation value of Hamiltonian over the parameterized state.
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Loop Label */}
      <div className="text-center text-xs text-slate-400 font-mono py-1">
        Feedback Loop: Repeat until |E<sup>(t)</sup> − E<sup>(t−1)</sup>| &lt; ε
      </div>
    </div>
  );
}
