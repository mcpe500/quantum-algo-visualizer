import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HARDWARE_SPECS, METRIC_LABELS } from '../data/hardware';
import { PAGE_BACKGROUND_CLASS } from '../constants/ui';

const METRIC_KEYS = ['gateSpeed', 'gateFidelity', 'coherence', 'scalability', 'connectivity', 'roomTempOperation'] as const;

function HardwareComparisonPage() {
  const navigate = useNavigate();
  const [selectedHardware, setSelectedHardware] = useState<string[]>(
    HARDWARE_SPECS.map((h) => h.id)
  );

  const toggleHardware = (id: string) => {
    setSelectedHardware((prev) =>
      prev.includes(id)
        ? prev.filter((h) => h !== id)
        : [...prev, id]
    );
  };

  const visibleHardware = HARDWARE_SPECS.filter((h) =>
    selectedHardware.includes(h.id)
  );

  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-8`}>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate('/hardware')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Perbandingan Hardware Kuantum
        </h1>
        <p className="text-gray-600 mb-8">
          Radar chart membandingkan enam dimensi kinerja lintas platform
        </p>

        {/* Hardware Toggles */}
        <div className="flex flex-wrap gap-2 mb-8">
          {HARDWARE_SPECS.map((hw) => (
            <button
              key={hw.id}
              onClick={() => toggleHardware(hw.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                selectedHardware.includes(hw.id)
                  ? 'border-gray-400 bg-white shadow-sm'
                  : 'border-gray-200 bg-gray-50 opacity-50'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: hw.color }}
              />
              <span className="font-medium">{hw.name}</span>
            </button>
          ))}
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <RadarChart hardware={visibleHardware} />
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Tabel Komparatif Lengkap
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-500">Metrik</th>
                  {visibleHardware.map((hw) => (
                    <th key={hw.id} className="text-left p-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: hw.color }}
                        />
                        {hw.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableRow label="Medium Fisik" data={visibleHardware.map((h) => h.medium)} />
                <TableRow label="Suhu Operasi" data={visibleHardware.map((h) => h.operatingTemp)} />
                <TableRow label="Single-Qubit Gate" data={visibleHardware.map((h) => h.singleQubitGateTime)} />
                <TableRow label="Two-Qubit Gate" data={visibleHardware.map((h) => h.twoQubitGateTime)} />
                <TableRow
                  label="Single-Qubit Fidelity"
                  data={visibleHardware.map((h) => `${(h.singleQubitFidelity * 100).toFixed(2)}%`)}
                />
                <TableRow
                  label="Two-Qubit Fidelity"
                  data={visibleHardware.map((h) => `${(h.twoQubitFidelity * 100).toFixed(1)}%`)}
                />
                <TableRow label="Coherence T1" data={visibleHardware.map((h) => h.coherenceTimeT1)} />
                <TableRow label="Coherence T2" data={visibleHardware.map((h) => h.coherenceTimeT2)} />
                <TableRow label="Max Qubits" data={visibleHardware.map((h) => h.maxQubits.toString())} />
                <TableRow label="Connectivity" data={visibleHardware.map((h) => h.connectivity)} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableRow({ label, data }: { label: string; data: string[] }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="p-4 font-medium text-gray-500">{label}</td>
      {data.map((value, i) => (
        <td key={i} className="p-4 text-gray-900">{value}</td>
      ))}
    </tr>
  );
}

function RadarChart({ hardware }: { hardware: typeof HARDWARE_SPECS }) {
  const size = 500;
  const center = size / 2;
  const radius = 180;
  const levels = 5;

  const angleForIndex = (i: number) => (Math.PI * 2 * i) / METRIC_KEYS.length - Math.PI / 2;

  const pointForMetric = (value: number, index: number) => {
    const angle = angleForIndex(index);
    const r = (value / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-xl">
        {/* Grid circles */}
        {Array.from({ length: levels }, (_, i) => {
          const r = ((i + 1) / levels) * radius;
          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Grid lines */}
        {METRIC_KEYS.map((_, i) => {
          const angle = angleForIndex(i);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="#e5e7eb"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Hardware polygons */}
        {hardware.map((hw) => {
          const points = METRIC_KEYS.map((key, i) => {
            const p = pointForMetric(hw.metrics[key as keyof typeof hw.metrics], i);
            return `${p.x},${p.y}`;
          }).join(' ');

          return (
            <g key={hw.id}>
              <polygon
                points={points}
                fill={hw.color}
                fillOpacity={0.1}
                stroke={hw.color}
                strokeWidth={2}
              />
              {METRIC_KEYS.map((key, i) => {
                const p = pointForMetric(hw.metrics[key as keyof typeof hw.metrics], i);
                return (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={4}
                    fill={hw.color}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Labels */}
        {METRIC_KEYS.map((key, i) => {
          const angle = angleForIndex(i);
          const labelRadius = radius + 25;
          const x = center + labelRadius * Math.cos(angle);
          const y = center + labelRadius * Math.sin(angle);

          return (
            <text
              key={key}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fill="#6b7280"
              fontWeight={500}
            >
              {METRIC_LABELS[key]}
            </text>
          );
        })}

        {/* Legend */}
        <g transform={`translate(20, 20)`}>
          {hardware.map((hw, i) => (
            <g key={hw.id} transform={`translate(0, ${i * 20})`}>
              <rect width={12} height={12} fill={hw.color} rx={2} />
              <text x={18} y={10} fontSize={11} fill="#374151">
                {hw.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default HardwareComparisonPage;
