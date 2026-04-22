import { Link } from 'react-router-dom';
import { Cpu, Waves, Zap, GitBranch, Globe, Layers, BookOpen } from 'lucide-react';
import { PAGE_BACKGROUND_CLASS } from '../constants/ui';

const algorithms = [
  {
    id: 'dj',
    name: 'Deutsch-Jozsa',
    description: 'Quantum oracle classification problem',
    icon: Cpu,
  },
  {
    id: 'qft',
    name: 'Quantum Fourier Transform',
    description: 'Quantum version of discrete Fourier transform',
    icon: Waves,
  },
  {
    id: 'vqe',
    name: 'Variational Quantum Eigensolver',
    description: 'Hybrid quantum-classical optimization for ground state',
    icon: Zap,
  },
  {
    id: 'qaoa',
    name: 'Quantum Approximate Optimization',
    description: 'Quantum annealing approach for combinatorial optimization',
    icon: GitBranch,
  },
];

function AlgorithmSelector() {
  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-8`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Quantum Algorithm Visualizer
        </h1>
        <p className="text-gray-600 mb-8">
          Select an algorithm to visualize
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {algorithms.map((algo) => {
            const Icon = algo.icon;
            return (
              <Link
                key={algo.id}
                to={`/${algo.id}`}
                className="block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                    <Icon className="w-8 h-8 text-gray-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {algo.name}
                    </h2>
                    <p className="text-sm text-gray-500">{algo.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/hardware"
            className="block p-6 bg-amber-50 border-2 border-amber-200 rounded-xl hover:border-amber-400 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                <Layers className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quantum Hardware</h2>
                <p className="text-sm text-gray-500">Eksplorasi 7 modalitas hardware quantum computing dengan visualisasi 3D</p>
              </div>
            </div>
          </Link>

          <Link
            to="/playground"
            className="block p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <Globe className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Qubit Playground</h2>
                <p className="text-sm text-gray-500">Main-main dengan qubit dan gerbang kuantum secara interaktif</p>
              </div>
            </div>
          </Link>

          <Link
            to="/formulas"
            className="block p-6 bg-teal-50 border-2 border-teal-200 rounded-xl hover:border-teal-400 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                <BookOpen className="w-8 h-8 text-teal-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Formula Studio</h2>
                <p className="text-sm text-gray-500">Eksplorasi rumus dan persamaan quantum computing</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AlgorithmSelector;
