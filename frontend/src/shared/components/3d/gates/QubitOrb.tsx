export interface QubitOrbPhaseProps {
  variant: 'phase';
  phase: number;
}

export interface QubitOrbProbabilityProps {
  variant: 'probability';
  pOne: number;
}

export type QubitOrbProps = {
  x: number;
  y: number;
  isActive: boolean;
  radius?: number;
  segments?: number;
  zIndex?: number;
  opacity?: number;
} & (QubitOrbPhaseProps | QubitOrbProbabilityProps);

export function QubitOrb(props: QubitOrbProps) {
  const { x, y, isActive, radius, segments, zIndex, opacity, variant } = props;

  let color: string;
  let resolvedRadius: number;
  let resolvedSegments: number;
  let resolvedZIndex: number;
  let resolvedOpacity: number;

  if (variant === 'phase') {
    const hue = ((props.phase * 180) / Math.PI) % 360;
    color = `hsl(${hue}, 70%, 55%)`;
    resolvedRadius = radius ?? 0.25;
    resolvedSegments = segments ?? 24;
    resolvedZIndex = zIndex ?? 0.1;
    resolvedOpacity = opacity ?? 0.9;
  } else {
    color = props.pOne > 0.5 ? '#0ea5e9' : '#8b5cf6';
    resolvedRadius = radius ?? 0.2;
    resolvedSegments = segments ?? 20;
    resolvedZIndex = zIndex ?? 0.18;
    resolvedOpacity = opacity ?? 1.0;
  }

  const r = isActive
    ? (variant === 'phase' ? resolvedRadius * 1.12 : resolvedRadius * 1.1)
    : (variant === 'phase' ? resolvedRadius * 0.88 : resolvedRadius * 0.9);

  const emissiveIntensity = isActive
    ? (variant === 'phase' ? 0.5 : 0.4)
    : (variant === 'phase' ? 0.25 : 0.2);

  return (
    <group position={[x, y, resolvedZIndex]}>
      <mesh>
        <sphereGeometry args={[r, resolvedSegments, resolvedSegments]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          transparent={resolvedOpacity < 1}
          opacity={resolvedOpacity}
        />
      </mesh>
    </group>
  );
}
