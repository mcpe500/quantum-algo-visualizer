import { Text } from '@react-three/drei';

export interface LabeledSphereGateProps {
  x: number;
  y: number;
  label: string;
  color: string;
  isActive: boolean;
  radius?: number;
  segments?: number;
  zIndex?: number;
}

export function LabeledSphereGate({
  x,
  y,
  label,
  color,
  isActive,
  radius = 0.2,
  segments = 16,
  zIndex = 0,
}: LabeledSphereGateProps) {
  return (
    <group position={[x, y, zIndex]}>
      <mesh>
        <sphereGeometry
          args={[isActive ? radius * 1.1 : radius * 0.9, segments, segments]}
        />
        <meshStandardMaterial
          color={color}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.4 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, 0.26]}
        fontSize={0.12}
        color={isActive ? '#ffffff' : '#64748b'}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}
