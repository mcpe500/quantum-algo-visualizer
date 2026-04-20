import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BlochSphere3D, StatevectorBars } from './BlochSphere';
import type { BlochData } from './useQubitState';

export type NamedBlochData = BlochData & { label: string };

export interface QubitStatePreviewProps {
  blochCards: NamedBlochData[];
  statevector: { re: number; im: number }[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function QubitStatePreview({
  blochCards,
  statevector,
  title,
  subtitle,
  compact = false,
}: QubitStatePreviewProps) {
  const gridClasses = compact
    ? 'grid grid-cols-1 gap-3'
    : 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3';
  const canvasHeightClass = compact ? 'h-[220px] sm:h-[240px]' : 'h-[240px] sm:h-[260px]';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4">
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className={gridClasses}>
        {blochCards.map((bloch, i) => (
          <div
            key={bloch.label}
            className={`rounded-lg border border-slate-200 bg-slate-50 overflow-hidden ${
              !compact && blochCards.length === 3 && i === 2 ? 'md:col-span-2 xl:col-span-1' : ''
            }`}
          >
            <div className={canvasHeightClass}>
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
  );
}
