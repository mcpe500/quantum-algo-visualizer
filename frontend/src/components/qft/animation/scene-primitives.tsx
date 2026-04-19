import { Line, OrbitControls, Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { QFTAnimationPartition, QFTAnimationPayload } from '../../../types/qft';
import { PHASE_COLOR, SCENE_PHASE_LABEL, PHASE_LABEL } from './constants';
import { getColumnLayout, getLaneYs } from './helpers';

function CameraRig({ mode, distance }: { mode: 'fixed' | 'orbit'; distance: number }) {
  const { camera } = useThree();

  useEffect(() => {
    if (mode === 'fixed') {
      camera.position.set(0, -0.5, distance);
      camera.lookAt(0, -0.5, 0);
    } else {
      camera.position.set(2, 1.5, distance - 2);
      camera.lookAt(0, -0.5, 0);
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

interface GateNodeProps {
  x: number;
  y: number;
  label: string;
  color: string;
  isActive: boolean;
}

function GateNode({ x, y, label, color, isActive }: GateNodeProps) {
  return (
    <group position={[x, y, 0]}>
      <mesh>
        <sphereGeometry args={[isActive ? 0.22 : 0.18, 16, 16]} />
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

interface QubitOrbProps {
  x: number;
  y: number;
  phase: number;
  isActive: boolean;
}

function QubitOrb({ x, y, phase, isActive }: QubitOrbProps) {
  const hue = ((phase * 180) / Math.PI) % 360;
  const color = `hsl(${hue}, 70%, 55%)`;

  return (
    <group position={[x, y, 0.1]}>
      <mesh>
        <sphereGeometry args={[isActive ? 0.28 : 0.22, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.5 : 0.25}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
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

  const signalBars = useMemo(() => {
    const maxAmp = Math.max(...data.input_signal.map(Math.abs)) || 1;
    return data.input_signal.slice(0, 8).map((amp) => ({
      amp,
      normalizedHeight: (amp / maxAmp) * 2,
      isPositive: amp >= 0,
    }));
  }, [data.input_signal]);

  const topY = laneYs[0] + 0.52;
  const bottomY = laneYs[laneYs.length - 1] - 0.52;

  const signalAreaX = startX - 5;
  const signalBarSpacing = 0.4;

  return (
    <>
      <CameraRig mode={cameraMode} distance={cameraDistance} />
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
        const startIndex = Math.max(partition.start - 1, 0);
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
        if (step.phase === 'init') return null;
        const x = columnXs[index];
        const isActive = index === currentStep;

        if (step.phase === 'hadamard' && step.target_qubit !== undefined) {
          return (
            <GateNode
              key={`gate-${step.step}`}
              x={x}
              y={laneYs[step.target_qubit]}
              label="H"
              color={PHASE_COLOR.hadamard}
              isActive={isActive}
            />
          );
        }

        if (step.phase === 'phase_cascade' && step.target_qubit !== undefined && step.control_qubit !== undefined) {
          return (
            <group key={`gate-${step.step}`}>
              <GateNode x={x} y={laneYs[step.target_qubit]} label={`C${step.control_qubit}`} color={PHASE_COLOR.phase_cascade} isActive={isActive} />
              <Line points={[[x, laneYs[step.control_qubit], 0.1], [x, laneYs[step.target_qubit], 0.1]]} color={PHASE_COLOR.phase_cascade} lineWidth={1.5} />
            </group>
          );
        }

        if (step.phase === 'swap' && step.swap_pair) {
          const [a, b] = step.swap_pair;
          return (
            <group key={`gate-${step.step}`}>
              <GateNode x={x} y={laneYs[a]} label="S" color={PHASE_COLOR.swap} isActive={isActive} />
              <GateNode x={x} y={laneYs[b]} label="S" color={PHASE_COLOR.swap} isActive={isActive} />
              <Line points={[[x, laneYs[a], 0.1], [x, laneYs[b], 0.1]]} color={PHASE_COLOR.swap} lineWidth={2} />
            </group>
          );
        }

        return null;
      })}

      {laneYs.map((y, index) => {
        const phase = activeStep.qubit_phases?.[index] || 0;
        return (
          <QubitOrb
            key={`orb-${index}`}
            x={columnXs[currentStep]}
            y={y}
            phase={phase}
            isActive={activeStep.target_qubit === index || activeStep.phase === 'measurement'}
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