import { Text } from '@react-three/drei';

export const HADAMARD_COLOR = '#2563EB';

export interface HadamardGateProps {
  x: number;
  y: number;
  isActive: boolean;
  size?: number;
  zIndex?: number;
}

export function HadamardGate({ x, y, isActive, size = 0.4, zIndex = 0.08 }: HadamardGateProps) {
  return (
    <group position={[x, y, zIndex]}>
      <mesh>
        <boxGeometry args={[size, size, 0.24]} />
        <meshStandardMaterial
          color={HADAMARD_COLOR}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          roughness={0.18}
          metalness={0.18}
        />
      </mesh>
      <Text
        position={[0, 0, 0.13]}
        fontSize={size * 0.35}
        color={isActive ? '#0F172A' : '#475569'}
        anchorX="center"
        anchorY="middle"
      >
        H
      </Text>
    </group>
  );
}