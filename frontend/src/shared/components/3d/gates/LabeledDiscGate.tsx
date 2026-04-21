import { Text } from '@react-three/drei';

export interface LabeledDiscGateProps {
  x: number;
  y: number;
  label: string;
  color: string;
  isActive: boolean;
  radius?: number;
  height?: number;
  segments?: number;
  size?: number;
  depth?: number;
  zIndex?: number;
}

export function LabeledDiscGate({
  x,
  y,
  label,
  color,
  isActive,
  radius = 0.2,
  size,
  depth = 0.24,
  zIndex = 0.08,
}: LabeledDiscGateProps) {
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
