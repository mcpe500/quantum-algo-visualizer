import { Line, OrbitControls, Text } from '@react-three/drei';
import { useMemo } from 'react';
import type { DJAnimationPartition, DJAnimationPayload } from '../../../types/dj';
import { PHASE_COLOR, PHASE_LABEL, SCENE_PHASE_LABEL } from './constants';
import { getColumnLayout, getLaneYs, getQubitP1 } from './helpers';
import { getOracleFunctionLabel } from './narration';
import { StageColumn } from './scene-column';
import { BlochSphereNode, ResultBoard } from './scene-bloch';
import { CameraRig, PhaseBand } from '../../../shared/components';

function FunctionBoard({
  x,
  y,
  label,
  profile,
  active,
}: {
  x: number;
  y: number;
  label: string;
  profile: DJAnimationPayload['oracle_summary']['profile'];
  active: boolean;
}) {
  const isConstant = profile !== 'balanced';
  const color = isConstant ? '#2563EB' : '#F59E0B';
  const width = Math.max(3.9, Math.min(7.4, label.length * 0.17 + 1.5));

  return (
    <group position={[x, y, 0.2]} scale={active ? [1.08, 1.08, 1.08] : [1, 1, 1]}>
      <mesh>
        <planeGeometry args={[width, 1.12]} />
        <meshStandardMaterial color={isConstant ? '#DBEAFE' : '#FEF3C7'} transparent opacity={0.94} />
      </mesh>
      <Text position={[0, 0.24, 0.04]} fontSize={0.18} color={color} anchorX="center" anchorY="middle">
        FUNCTION
      </Text>
      <Text position={[0, -0.08, 0.04]} fontSize={0.24} color="#0F172A" anchorX="center" anchorY="middle" maxWidth={width - 0.42} textAlign="center">
        {label}
      </Text>
      <Text position={[0, -0.39, 0.04]} fontSize={0.14} color={color} anchorX="center" anchorY="middle">
        {isConstant ? 'constant output' : 'balanced truth table'}
      </Text>
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
  const functionLabel = useMemo(() => getOracleFunctionLabel(data), [data]);

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

      <FunctionBoard
        x={Math.min(startX + 3.1, -2.4)}
        y={topY + 1.02}
        label={functionLabel}
        profile={data.oracle_summary.profile}
        active={activeStep.phase === 'pre-init'}
      />

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
