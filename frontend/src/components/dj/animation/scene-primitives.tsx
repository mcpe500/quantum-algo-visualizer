import { Line, OrbitControls, Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { DJAnimationPartition, DJAnimationPayload } from '../../../types/dj';
import { PHASE_COLOR, PHASE_LABEL, SCENE_PHASE_LABEL } from './constants';
import { getColumnLayout, getLaneYs, getQubitP1 } from './helpers';
import { StageColumn } from './scene-column';
import { BlochSphereNode, ResultBoard } from './scene-bloch';

function CameraRig({ mode, distance }: { mode: 'fixed' | 'orbit'; distance: number }) {
  const { camera } = useThree();

  useEffect(() => {
    if (mode === 'fixed') {
      camera.position.set(0, -0.1, distance);
      camera.lookAt(0, -0.1, 0);
    } else {
      camera.position.set(1.8, 1.2, distance - 1.5);
      camera.lookAt(0, -0.1, 0);
    }
    camera.updateProjectionMatrix();
  }, [camera, distance, mode]);

  return null;
}

function PhaseBand({
  startX,
  endX,
  color,
  label,
  topY,
  height,
}: {
  startX: number;
  endX: number;
  color: string;
  label: string;
  topY: number;
  height: number;
}) {
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

export function StoryScene({
  data,
  currentStep,
  cameraMode,
}: {
  data: DJAnimationPayload;
  currentStep: number;
  cameraMode: 'fixed' | 'orbit';
}) {
  const activeStep = data.timeline[currentStep];
  const laneYs = useMemo(() => getLaneYs(data.n_qubits), [data.n_qubits]);
  const laneLabels = useMemo(() => [...Array.from({ length: data.n_qubits }, (_, index) => `q${index}`), 'ancilla'], [data.n_qubits]);
  const { startX, endX, gap, columnXs } = useMemo(() => getColumnLayout(data.timeline.length), [data.timeline.length]);
  const cameraDistance = data.timeline.length > 24 ? 23 : 21.5;
  const phaseColor = PHASE_COLOR[activeStep.phase] || '#2563EB';
  const showResult = activeStep.phase === 'measure' && currentStep === data.timeline.length - 1;
  const resultX = endX + 2.1;

  const qubitStates = useMemo(() => {
    const totalQubits = data.total_qubits;
    return Array.from({ length: totalQubits }, (_, index) => getQubitP1(activeStep.probabilities, activeStep.labels, index, totalQubits));
  }, [activeStep.labels, activeStep.probabilities, data.total_qubits]);

  const blochStates = useMemo(() => {
    if (activeStep.bloch_states && activeStep.bloch_states.length > 0) {
      return activeStep.bloch_states;
    }
    return null;
  }, [activeStep.bloch_states]);

  const topY = laneYs[0] + 0.52;
  const bottomY = laneYs[laneYs.length - 1] - 0.52;

  return (
    <>
      <CameraRig mode={cameraMode} distance={cameraDistance} />
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 8]} intensity={0.88} />
      <directionalLight position={[-6, 4, 5]} intensity={0.28} color="#BFDBFE" />

      <OrbitControls enabled={cameraMode === 'orbit'} enablePan={false} enableZoom minDistance={15} maxDistance={28} minPolarAngle={Math.PI * 0.34} maxPolarAngle={Math.PI * 0.68} />

      {data.partitions.map((partition: DJAnimationPartition) => {
        const startIndex = Math.max(partition.start_col - 1, 0);
        const endIndex = Math.min(partition.end_col - 1, columnXs.length - 1);
        const bandStart = columnXs[startIndex] - Math.max(gap * 0.5, 0.35);
        const bandEnd = columnXs[endIndex] + Math.max(gap * 0.5, 0.35);
        return (
          <PhaseBand
            key={`${partition.phase}-${partition.start_col}`}
            startX={bandStart}
            endX={bandEnd}
            color={PHASE_COLOR[partition.phase] || '#94A3B8'}
            label={SCENE_PHASE_LABEL[partition.phase] || PHASE_LABEL[partition.phase] || partition.label}
            topY={topY}
            height={topY - bottomY + 0.58}
          />
        );
      })}

      {laneYs.map((y, index) => (
        <Line key={`wire-${laneLabels[index]}`} points={[[startX - 0.8, y, -0.04], [endX + 0.8, y, -0.04]]} color="#CBD5E1" lineWidth={1} />
      ))}

      {laneYs.map((y, index) => (
        <Text key={`lane-${laneLabels[index]}`} position={[startX - 1.35, y, 0.06]} fontSize={0.24} color="#334155" anchorX="right" anchorY="middle">
          {laneLabels[index]}
        </Text>
      ))}

      {data.timeline.map((step, index) => (
        <StageColumn
          key={`column-${step.step}`}
          step={step}
          x={columnXs[index]}
          laneYs={laneYs}
          nQubits={data.n_qubits}
          gap={gap}
          active={index === currentStep}
          isFinalMeasure={showResult}
        />
      ))}

      {qubitStates.map((pOne, index) => {
        const sphereOffset = 0;
        const blochForQubit = blochStates && blochStates[index]
          ? blochStates[index]
          : { bx: 0, by: 0, bz: pOne < 0.15 ? 1 : pOne > 0.85 ? -1 : 0, label: pOne < 0.15 ? '|0⟩' : pOne > 0.85 ? '|1⟩' : '0|1' };
        const computedP0 = blochStates && blochStates[index]
          ? (1 + blochStates[index].bz) / 2
          : (1 - pOne);
        return (
          <BlochSphereNode
            key={`orb-${index}`}
            y={laneYs[index]}
            targetX={columnXs[currentStep] + sphereOffset}
            phaseColor={phaseColor}
            blochState={blochForQubit}
            p0={computedP0}
          />
        );
      })}

      <ResultBoard x={resultX} classification={data.measurement.classification} visible={showResult} />
    </>
  );
}
