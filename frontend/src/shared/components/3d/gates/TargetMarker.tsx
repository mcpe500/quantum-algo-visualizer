import { Text } from '@react-three/drei';

export interface TargetMarkerProps {
  x: number;
  y: number;
  isActive: boolean;
  color?: string;
  label?: string;
  radius?: number;
  size?: number;
  depth?: number;
  zIndex?: number;
}

export function TargetMarker({
  x,
  y,
  isActive,
  color = '#D97706',
  label = 'X',
  radius = 0.22,
  size,
  depth = 0.24,
  zIndex = 0.1,
}: TargetMarkerProps) {
  const resolvedSize = size ?? radius * 2;

  return (
    <group position={[x, y, zIndex]}>
      <mesh>
        <boxGeometry args={[resolvedSize, resolvedSize, depth]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          roughness={0.18}
          metalness={0.18}
        />
      </mesh>
      <Text
        position={[0, 0, depth / 2 + 0.01]}
        fontSize={resolvedSize * 0.32}
        color={isActive ? '#0F172A' : '#475569'}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}
