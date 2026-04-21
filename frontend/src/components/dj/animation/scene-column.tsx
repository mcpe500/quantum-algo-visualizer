import { Line } from '@react-three/drei';
import type { DJAnimationStep } from '../../../types/dj';
import { clamp } from './helpers';
import { HadamardGate, LabeledBoxGate, ControlDot, TargetMarker } from '../../../shared/components';

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
        if (marker === 'H') return <HadamardGate key={`${step.step}-${index}-H`} x={x} y={y} isActive={active} size={plateSize} />;
        if (marker === 'X') return <LabeledBoxGate key={`${step.step}-${index}-X`} x={x} y={y} label="X" color="#E11D48" size={plateSize} isActive={active} />;
        if (marker === 'M') return <LabeledBoxGate key={`${step.step}-${index}-M`} x={x} y={y} label="M" color="#475569" size={plateSize} isActive={active || isFinalMeasure} />;
        if (marker === '●') return <ControlDot key={`${step.step}-${index}-dot`} x={x} y={y} isActive={active} />;
        if (marker === '⊕') return <TargetMarker key={`${step.step}-${index}-target`} x={x} y={y} isActive={active} />;
        return null;
      })}
    </group>
  );
}
