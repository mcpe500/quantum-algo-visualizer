import { Line } from '@react-three/drei';

export interface TargetMarkerProps {
  x: number;
  y: number;
  isActive: boolean;
  color?: string;
  radius?: number;
  zIndex?: number;
}

export function TargetMarker({
  x,
  y,
  isActive,
  color = '#D97706',
  radius = 0.22,
  zIndex = 0.1,
}: TargetMarkerProps) {
  return (
    <group position={[x, y, zIndex]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.02, 12, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.32 : 0.08}
        />
      </mesh>
      <Line
        points={[[0, -radius + 0.04, 0.04], [0, radius - 0.04, 0.04]]}
        color={color}
        lineWidth={1.2}
      />
      <Line
        points={[[-radius + 0.04, 0, 0.04], [radius - 0.04, 0, 0.04]]}
        color={color}
        lineWidth={1.2}
      />
    </group>
  );
}
