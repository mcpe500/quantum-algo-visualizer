import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { HARDWARE_SPECS } from '../data/hardware';
import HardwareScene from '../components/hardware/HardwareScene';
import { PAGE_BACKGROUND_CLASS } from '../constants/ui';

function HardwareDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const hw = HARDWARE_SPECS.find((h) => h.id === id);
  const currentIndex = HARDWARE_SPECS.findIndex((h) => h.id === id);
  const prevHw = currentIndex > 0 ? HARDWARE_SPECS[currentIndex - 1] : null;
  const nextHw = currentIndex < HARDWARE_SPECS.length - 1 ? HARDWARE_SPECS[currentIndex + 1] : null;

  if (!hw) {
    return (
      <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-8`}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/hardware')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>
          <p>Hardware tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/hardware')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Semua Hardware</span>
          </button>
          <div className="flex gap-2">
            {prevHw && (
              <button
                onClick={() => navigate(`/hardware/${prevHw.id}`)}
                className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
              >
                {prevHw.name}
              </button>
            )}
            {nextHw && (
              <button
                onClick={() => navigate(`/hardware/${nextHw.id}`)}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
              >
                {nextHw.name}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: hw.color }}
            />
            <h1 className="text-3xl font-bold text-gray-900">{hw.name}</h1>
          </div>
          <p className="text-gray-500">{hw.company}</p>
        </div>

        {/* 3D Scene */}
        <div className="mb-8">
          <HardwareScene hardwareId={hw.id} />
          <p className="text-xs text-gray-400 mt-2 text-center">
            Drag untuk memutar, scroll untuk zoom
          </p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <p className="text-gray-700 leading-relaxed">{hw.description}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <MetricCard label="Medium Fisik" value={hw.medium} />
          <MetricCard label="Suhu Operasi" value={hw.operatingTemp} />
          <MetricCard label="Max Qubits" value={hw.maxQubits.toString()} />
          <MetricCard label="Single-Qubit Gate" value={hw.singleQubitGateTime} />
          <MetricCard label="Two-Qubit Gate" value={hw.twoQubitGateTime} />
          <MetricCard label="Connectivity" value={hw.connectivity} />
          <MetricCard
            label="Single-Qubit Fidelity"
            value={`${(hw.singleQubitFidelity * 100).toFixed(3)}%`}
          />
          <MetricCard
            label="Two-Qubit Fidelity"
            value={`${(hw.twoQubitFidelity * 100).toFixed(1)}%`}
          />
          <MetricCard label="Coherence T1" value={hw.coherenceTimeT1} />
        </div>

        {/* Gate Implementation */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Implementasi Gerbang
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Single-Qubit Gate</span>
              <span className="font-medium text-gray-900">{hw.gateImplementation.singleQubit}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-500">Two-Qubit Gate</span>
              <span className="font-medium text-gray-900">{hw.gateImplementation.twoQubit}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-500">Stimulus / Alat Utama</span>
              <span className="font-medium text-gray-900">{hw.gateImplementation.stimulus}</span>
            </div>
          </div>
        </div>

        {/* Features & Limitations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-green-50 rounded-xl border border-green-200 p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-4">Kelebihan</h2>
            <ul className="space-y-2">
              {hw.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-green-800 text-sm">
                  <span className="text-green-500 mt-0.5">+</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-red-50 rounded-xl border border-red-200 p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Keterbatasan</h2>
            <ul className="space-y-2">
              {hw.limitations.map((limitation: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-red-800 text-sm">
                  <span className="text-red-500 mt-0.5">-</span>
                  {limitation}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Metrics Radar Mini */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Metrik Kinerja (1-10)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(hw.metrics).map(([key, value]: [string, unknown]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-medium">{value as number}/10</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${(value as number) * 10}%`,
                      backgroundColor: hw.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-semibold text-gray-900 text-sm">{value}</p>
    </div>
  );
}

export default HardwareDetailPage;
