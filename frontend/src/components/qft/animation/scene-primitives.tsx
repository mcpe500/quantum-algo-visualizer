import { Line, OrbitControls, Text } from '@react-three/drei';
import { useMemo } from 'react';
import type { QFTAnimationPartition, QFTAnimationPayload, QFTQubitAnimationSummary } from '../../../types/qft';
import { PHASE_COLOR, SCENE_PHASE_LABEL, PHASE_LABEL } from './constants';
import { getColumnLayout, getLaneYs } from '../../../shared/utils/animation-helpers';
import { HadamardGate, CameraRig, PhaseBand, LabeledBoxGate, BlochQubitNode } from '../../../shared/components';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getSummaryP0(summary: QFTQubitAnimationSummary) {
  if (isFiniteNumber(summary.p_zero)) return clamp(summary.p_zero, 0, 1);
  if (isFiniteNumber(summary.p_one)) return clamp(1 - summary.p_one, 0, 1);
  if (isFiniteNumber(summary.bz)) return clamp((summary.bz + 1) / 2, 0, 1);
  return null;
}

function buildBlochStateFromSummary(summary: QFTQubitAnimationSummary) {
  let bx: number | null = null;
  let by: number | null = null;
  let bz: number | null = null;

  if (isFiniteNumber(summary.bx) && isFiniteNumber(summary.by) && isFiniteNumber(summary.bz)) {
    bx = summary.bx;
    by = summary.by;
    bz = summary.bz;
  } else if (isFiniteNumber(summary.theta) && isFiniteNumber(summary.phi)) {
    bx = Math.sin(summary.theta) * Math.cos(summary.phi);
    by = Math.sin(summary.theta) * Math.sin(summary.phi);
    const bzTheta = Math.cos(summary.theta);
    const p0 = getSummaryP0(summary);
    const bzProb = p0 === null ? bzTheta : clamp(2 * p0 - 1, -1, 1);
    bz = Math.abs(bzTheta - bzProb) > 0.2 ? bzProb : bzTheta;
  }

  if (bx === null || by === null || bz === null) return null;

  const magnitude = Math.hypot(bx, by, bz);
  if (magnitude > 1.000001) {
    bx /= magnitude;
    by /= magnitude;
    bz /= magnitude;
  }

  return {
    bx: clamp(bx, -1, 1),
    by: clamp(by, -1, 1),
    bz: clamp(bz, -1, 1),
  };
}

function phaseToBodyColor(phase: number) {
  const hue = (((phase + Math.PI) / (2 * Math.PI)) * 360) % 360;
  return `hsl(${Math.round(hue)}, 70%, 55%)`;
}

interface SignalBarProps {
  x: number;
  y: number;
  height: number;
  isPositive: boolean;
  isActive: boolean;
}

function SignalBar({ x, y, height, isPositive, isActive }: SignalBarProps) {
  const barHeight = Math.abs(height);
  const yOffset = isPositive ? barHeight / 2 : -barHeight / 2;
  const color = isPositive ? '#7c3aed' : '#f59e0b';

  return (
    <group position={[x, y + yOffset, 0]}>
      <mesh>
        <boxGeometry args={[0.15, barHeight, 0.15]} />
        <meshStandardMaterial
          color={color}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>
    </group>
  );
}

export function QFTStoryScene({
  data,
  currentStep,
  cameraMode,
}: {
  data: QFTAnimationPayload;
  currentStep: number;
  cameraMode: 'fixed' | 'orbit';
}) {
  const activeStep = data.timeline[currentStep];
  const laneYs = useMemo(() => getLaneYs(data.n_qubits), [data.n_qubits]);
  const laneLabels = useMemo(() => Array.from({ length: data.n_qubits }, (_, index) => `q${index}`), [data.n_qubits]);
  const { startX, endX, gap, columnXs } = useMemo(() => getColumnLayout(data.timeline.length), [data.timeline.length]);
  const cameraDistance = data.timeline.length > 24 ? 25 : 22;
  const usesZeroBasedPartitions = useMemo(
    () => data.partitions.some((partition) => partition.start === 0 || partition.end === data.timeline.length),
    [data.partitions, data.timeline.length],
  );

  const signalBars = useMemo(() => {
    const maxAmp = Math.max(...data.input_signal.map(Math.abs)) || 1;
    return data.input_signal.slice(0, 8).map((amp) => ({
      amp,
      normalizedHeight: (amp / maxAmp) * 2,
      isPositive: amp >= 0,
    }));
  }, [data.input_signal]);

  const qubitVisualState = useMemo(() => {
    const summaries = activeStep.qubit_summaries ?? [];

    return summaries.flatMap((summary) => {
      if (summary.qubit < 0 || summary.qubit >= data.n_qubits) return [];

      const p0 = getSummaryP0(summary);
      const blochVector = buildBlochStateFromSummary(summary);
      if (p0 === null || blochVector === null) return [];

      return [{
        qubit: summary.qubit,
        p0,
        bodyColor: summary.bodyColor
          ?? summary.body_color
          ?? (isFiniteNumber(summary.phase) ? phaseToBodyColor(summary.phase) : undefined),
        coherence: isFiniteNumber(summary.coherence)
          ? clamp(summary.coherence, 0, 1)
          : (isFiniteNumber(summary.radius) ? clamp(summary.radius, 0, 1) : undefined),
        blochState: {
          ...blochVector,
          label: summary.label ?? (p0 >= 0.85 ? '|0>' : p0 <= 0.15 ? '|1>' : '|psi>'),
        },
      }];
    });
  }, [activeStep.qubit_summaries, data.n_qubits]);

  const topY = laneYs[0] + 0.52;
  const bottomY = laneYs[laneYs.length - 1] - 0.52;

  const signalAreaX = startX - 5;
  const signalBarSpacing = 0.4;
  const gateSize = clamp(gap * 0.56, 0.28, 0.56);

  return (
    <>
      <CameraRig mode={cameraMode} distance={cameraDistance} fixedOffset={{ x: 0, y: -0.5 }} orbitOffset={{ x: 2, y: 1.5, z: 2 }} lookAtY={-0.5} />
      <ambientLight intensity={0.82} />
      <directionalLight position={[6, 8, 8]} intensity={0.88} />
      <directionalLight position={[-6, 4, 5]} intensity={0.28} color="#C4B5FD" />

      <OrbitControls
        enabled={cameraMode === 'orbit'}
        enablePan={false}
        enableZoom
        minDistance={15}
        maxDistance={30}
        minPolarAngle={Math.PI * 0.34}
        maxPolarAngle={Math.PI * 0.68}
      />

      {data.partitions.map((partition: QFTAnimationPartition) => {
        const startIndex = Math.max(usesZeroBasedPartitions ? partition.start : partition.start - 1, 0);
        const endIndex = Math.min(partition.end - 1, columnXs.length - 1);
        if (startIndex < 0 || endIndex < startIndex) return null;
        const bandStart = columnXs[startIndex] - Math.max(gap * 0.5, 0.35);
        const bandEnd = columnXs[endIndex] + Math.max(gap * 0.5, 0.35);
        return (
          <PhaseBand
            key={`${partition.phase}-${partition.start}`}
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

      <group position={[signalAreaX, 0, 0]}>
        <Text position={[0, topY + 0.5, 0]} fontSize={0.18} color="#7c3aed" anchorX="center" anchorY="middle">
          Signal Input
        </Text>
        {signalBars.map((bar, i) => {
          const barY = (laneYs[0] + laneYs[laneYs.length - 1]) / 2;
          return (
            <SignalBar
              key={`signal-${i}`}
              x={i * signalBarSpacing - (signalBars.length * signalBarSpacing) / 2}
              y={barY}
              height={bar.normalizedHeight}
              isPositive={bar.isPositive}
              isActive={activeStep.phase === 'init'}
            />
          );
        })}
      </group>

      {data.timeline.map((step, index) => {
        const x = columnXs[index];
        const isActive = index === currentStep;

        if (step.phase === 'init') {
          return (
            <group key={`gate-${step.step}`}>
              {laneYs.map((y, qubitIndex) => (
                <LabeledBoxGate
                  key={`gate-${step.step}-enc-${qubitIndex}`}
                  x={x}
                  y={y}
                  label="ENC"
                  color={PHASE_COLOR.init}
                  size={gateSize}
                  isActive={isActive}
                />
              ))}
            </group>
          );
        }

        if (step.phase === 'hadamard' && step.target_qubit !== undefined && laneYs[step.target_qubit] !== undefined) {
          return (
            <HadamardGate
              key={`gate-${step.step}`}
              x={x}
              y={laneYs[step.target_qubit]}
              isActive={isActive}
              size={gateSize}
            />
          );
        }

        if (step.phase === 'phase_cascade' && step.target_qubit !== undefined && step.control_qubit !== undefined) {
          const controlY = laneYs[step.control_qubit];
          const targetY = laneYs[step.target_qubit];
          if (controlY === undefined || targetY === undefined) return null;

          return (
            <group key={`gate-${step.step}`}>
              <LabeledBoxGate x={x} y={controlY} label="C" color={PHASE_COLOR.phase_cascade} size={gateSize} isActive={isActive} />
              <LabeledBoxGate x={x} y={targetY} label="CP" color={PHASE_COLOR.phase_cascade} size={gateSize} isActive={isActive} />
              <Line points={[[x, controlY, 0.1], [x, targetY, 0.1]]} color={PHASE_COLOR.phase_cascade} lineWidth={1.5} />
            </group>
          );
        }

        if (step.phase === 'swap' && step.swap_pair) {
          const [a, b] = step.swap_pair;
          const aY = laneYs[a];
          const bY = laneYs[b];
          if (aY === undefined || bY === undefined) return null;

          return (
            <group key={`gate-${step.step}`}>
              <LabeledBoxGate x={x} y={aY} label="SWAP" color={PHASE_COLOR.swap} size={gateSize} isActive={isActive} />
              <LabeledBoxGate x={x} y={bY} label="SWAP" color={PHASE_COLOR.swap} size={gateSize} isActive={isActive} />
              <Line points={[[x, aY, 0.1], [x, bY, 0.1]]} color={PHASE_COLOR.swap} lineWidth={2} />
            </group>
          );
        }

        if (step.phase === 'measurement') {
          return (
            <group key={`gate-${step.step}`}>
              {laneYs.map((y, qubitIndex) => (
                <LabeledBoxGate
                  key={`gate-${step.step}-m-${qubitIndex}`}
                  x={x}
                  y={y}
                  label="M"
                  color={PHASE_COLOR.measurement}
                  size={gateSize}
                  isActive={isActive}
                />
              ))}
            </group>
          );
        }

        return null;
      })}

      {qubitVisualState.map((qubit) => {
        return (
          <BlochQubitNode
            key={`orb-${qubit.qubit}`}
            targetX={columnXs[currentStep]}
            y={laneYs[qubit.qubit]}
            phaseColor={PHASE_COLOR[activeStep.phase] || '#2563eb'}
            blochState={qubit.blochState}
            p0={qubit.p0}
            bodyColor={qubit.bodyColor}
            coherence={qubit.coherence}
          />
        );
      })}

      {activeStep.phase === 'measurement' && currentStep === data.timeline.length - 1 && (
        <group position={[endX + 2, 0, 0]}>
          <Text position={[0, topY + 0.5, 0]} fontSize={0.18} color="#ef4444" anchorX="center" anchorY="middle">
            Spectrum
          </Text>
          {Object.entries(data.measurement.counts)
            .slice(0, 8)
            .map(([state, count], i) => {
              const prob = count / data.measurement.shots;
              const barHeight = prob * 4;
              const barY = (laneYs[0] + laneYs[laneYs.length - 1]) / 2 + barHeight / 2 - 1;
              const barX = i * 0.4 - 1.4;
              return (
                <group key={`spec-${state}`} position={[barX, barY, 0]}>
                  <mesh>
                    <boxGeometry args={[0.15, barHeight, 0.15]} />
                    <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.2} />
                  </mesh>
                </group>
              );
            })}
        </group>
      )}
    </>
  );
}
