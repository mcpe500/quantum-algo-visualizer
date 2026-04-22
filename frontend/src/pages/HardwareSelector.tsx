import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Zap, Atom, CircleDot, Cpu, Shield, Gem } from 'lucide-react';
import { HARDWARE_SPECS } from '../data/hardware';
import { PAGE_BACKGROUND_CLASS } from '../constants/ui';

const iconMap: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  sun: Sun,
  zap: Zap,
  atom: Atom,
  'circle-dot': CircleDot,
  cpu: Cpu,
  shield: Shield,
  gem: Gem,
};

function HardwareSelector() {
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-8`}>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Quantum Hardware Landscape
          </h1>
          <p className="text-gray-600 max-w-2xl">
            Eksplorasi tujuh modalitas hardware quantum computing. Setiap platform memiliki karakteristik fisik,
            mekanisme gate, dan metrik kinerja yang unik.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {HARDWARE_SPECS.map((hw) => {
            const Icon = iconMap[hw.icon] || Zap;
            return (
              <button
                key={hw.id}
                onClick={() => navigate(`/hardware/${hw.id}`)}
                className="block text-left p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all group w-full"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="p-3 rounded-lg transition-colors"
                    style={{ backgroundColor: hw.color + '20' }}
                  >
                    <Icon className="w-8 h-8" style={{ color: hw.color }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {hw.name}
                    </h2>
                    <p className="text-sm text-gray-500">{hw.company}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {hw.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Medium</span>
                    <span className="font-medium text-gray-900">{hw.medium}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Suhu Operasi</span>
                    <span className="font-medium text-gray-900">{hw.operatingTemp}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Max Qubits</span>
                    <span className="font-medium text-gray-900">{hw.maxQubits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Connectivity</span>
                    <span className="font-medium text-gray-900">{hw.connectivity}</span>
                  </div>
                </div>

                <div
                  className="mt-4 h-1 rounded-full"
                  style={{ backgroundColor: hw.color + '30' }}
                >
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: `${(hw.metrics.gateFidelity + hw.metrics.coherence + hw.metrics.scalability) / 3 * 10}%`,
                      backgroundColor: hw.color,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Perbandingan Semua Hardware
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Lihat radar chart perbandingan metrik lintas platform
          </p>
          <button
            onClick={() => navigate('/hardware/compare')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Buka Perbandingan
          </button>
        </div>
      </div>
    </div>
  );
}

export default HardwareSelector;
