import { Line, Text } from '@react-three/drei';

export interface PhaseBandProps {
  startX: number;
  endX: number;
  color: string;
  label: string;
  topY: number;
  height: number;
}

export function PhaseBand({ startX, endX, color, label, topY, height }: PhaseBandProps) {
  const width = Math.max(endX - startX, 0.6);
  const centerX = (startX + endX) / 2;

  return (
    <group position={[centerX, 0, -0.16]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={color} transparent opacity={0.07} />
      </mesh>
      <Line points={[[(-width / 2), topY, 0], [width / 2, topY, 0]]} color={color} lineWidth={1} />
      {width >= 1.55 && (
        <Text
          position={[0, topY + 0.34, 0.02]}
          fontSize={width < 2.2 ? 0.14 : 0.18}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}