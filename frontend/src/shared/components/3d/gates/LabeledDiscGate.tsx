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
  zIndex?: number;
}

export function LabeledDiscGate({
  x,
  y,
  label,
  color,
  isActive,
  radius = 0.2,
  height = 0.08,
  segments = 24,
  zIndex = 0,
}: LabeledDiscGateProps) {
  return (
    <group position={[x, y, zIndex]}>
      <mesh>
        <cylinderGeometry args={[radius, radius, height, segments]} />
        <meshStandardMaterial
          color={color}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.35 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, height / 2 + 0.08]}
        fontSize={0.11}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}
