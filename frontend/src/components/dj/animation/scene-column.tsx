import { Line, Text } from '@react-three/drei';
import type { DJAnimationStep } from '../../../types/dj';
import { clamp } from './helpers';

function GateTile({
  x,
  y,
  label,
  color,
  size,
  active,
}: {
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
  active: boolean;
}) {
  return (
    <group position={[x, y, 0.08]}>
      <mesh>
        <boxGeometry args={[size, size, 0.24]} />
        <meshStandardMaterial color={color} transparent opacity={active ? 0.9 : 0.5} roughness={0.18} metalness={0.18} />
      </mesh>
      <Text position={[0, 0, 0.13]} fontSize={size * 0.35} color={active ? '#0F172A' : '#475569'} anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

function ControlDot({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <mesh position={[x, y, 0.1]}>
      <sphereGeometry args={[active ? 0.18 : 0.14, 18, 18]} />
      <meshStandardMaterial color="#7C3AED" emissive="#7C3AED" emissiveIntensity={active ? 0.35 : 0.1} />
    </mesh>
  );
}

function TargetMarker({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <group position={[x, y, 0.1]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.02, 12, 48]} />
        <meshStandardMaterial color="#D97706" emissive="#D97706" emissiveIntensity={active ? 0.32 : 0.08} />
      </mesh>
      <Line points={[[0, -0.18, 0.04], [0, 0.18, 0.04]]} color="#D97706" lineWidth={1.2} />
      <Line points={[[(-0.18), 0, 0.04], [0.18, 0, 0.04]]} color="#D97706" lineWidth={1.2} />
    </group>
  );
}

export function StageColumn({
  step,
  x,
  laneYs,
  nQubits,
  gap,
  active,
  isFinalMeasure,
}: {
  step: DJAnimationStep;
  x: number;
  laneYs: number[];
  nQubits: number;
  gap: number;
  active: boolean;
  isFinalMeasure: boolean;
}) {
  const columnWidth = clamp(gap * 0.72, 0.38, 0.78);
  const plateSize = clamp(gap * 0.56, 0.26, 0.56);
  const markers = [...Array.from({ length: nQubits }, (_, index) => step.wire_markers[String(index)] || '-'), step.ancilla_marker || '-'];
  const controls = markers
    .map((marker, index) => ({ marker, index }))
    .filter((item) => item.marker === '●')
    .map((item) => laneYs[item.index]);
  const targetIndex = markers.findIndex((marker) => marker === '⊕');
  const hasLink = controls.length > 0 && targetIndex >= 0;
  const targetY = targetIndex >= 0 ? laneYs[targetIndex] : null;

  return (
    <group>
      {active && (
        <mesh position={[x, 0, -0.08]}>
          <planeGeometry args={[Math.max(columnWidth, 0.52), Math.abs(laneYs[0] - laneYs[laneYs.length - 1]) + 1.7]} />
          <meshBasicMaterial color="#C4B5FD" transparent opacity={0.12} />
        </mesh>
      )}

      {hasLink && targetY !== null && (
        <Line
          points={[[x, Math.min(...controls, targetY), 0.08], [x, Math.max(...controls, targetY), 0.08]]}
          color={active ? '#8B5CF6' : '#B69CFF'}
          lineWidth={1.3}
        />
      )}

      {markers.map((marker, index) => {
        const y = laneYs[index];
        if (marker === 'H') return <GateTile key={`${step.step}-${index}-H`} x={x} y={y} label="H" color="#2563EB" size={plateSize} active={active} />;
        if (marker === 'X') return <GateTile key={`${step.step}-${index}-X`} x={x} y={y} label="X" color="#E11D48" size={plateSize} active={active} />;
        if (marker === 'M') return <GateTile key={`${step.step}-${index}-M`} x={x} y={y} label="M" color="#475569" size={plateSize} active={active || isFinalMeasure} />;
        if (marker === '●') return <ControlDot key={`${step.step}-${index}-dot`} x={x} y={y} active={active} />;
        if (marker === '⊕') return <TargetMarker key={`${step.step}-${index}-target`} x={x} y={y} active={active} />;
        return null;
      })}
    </group>
  );
}
