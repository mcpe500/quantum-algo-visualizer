import { Text } from '@react-three/drei';

export interface LabeledBoxGateProps {
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
  isActive: boolean;
  zIndex?: number;
  depth?: number;
}

export function LabeledBoxGate({
  x,
  y,
  label,
  color,
  size,
  isActive,
  zIndex = 0.08,
  depth = 0.24,
}: LabeledBoxGateProps) {
  return (
    <group position={[x, y, zIndex]}>
      <mesh>
        <boxGeometry args={[size, size, depth]} />
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
        fontSize={size * 0.35}
        color={isActive ? '#0F172A' : '#475569'}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}
