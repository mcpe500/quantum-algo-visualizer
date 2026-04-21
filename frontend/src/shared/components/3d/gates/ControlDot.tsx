export interface ControlDotProps {
  x: number;
  y: number;
  isActive: boolean;
  color?: string;
  radius?: number;
  segments?: number;
  zIndex?: number;
}

export function ControlDot({
  x,
  y,
  isActive,
  color = '#7C3AED',
  radius = 0.16,
  segments = 18,
  zIndex = 0.1,
}: ControlDotProps) {
  return (
    <mesh position={[x, y, zIndex]}>
      <sphereGeometry args={[isActive ? radius * 1.125 : radius * 0.875, segments, segments]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isActive ? 0.35 : 0.1}
      />
    </mesh>
  );
}
