import { Line, OrbitControls, Text } from '@react-three/drei';
import { useMemo } from 'react';
import type { QAOAAnimationPayload, QAOAAnimationStep } from '../../../types/qaoa';
import { PHASE_COLOR } from './constants';
import { getPartitionFromBitstring } from './helpers';
import { HadamardGate, CameraRig, LabeledDiscGate, QubitOrb } from '../../../shared/components';

function getGraphPositions(count: number, centerX: number, centerY: number, radius: number) {
  return Array.from({ length: count }, (_, index) => ({
    x: centerX + radius * Math.cos((2 * Math.PI * index) / count - Math.PI / 2),
    y: centerY + radius * Math.sin((2 * Math.PI * index) / count - Math.PI / 2),
  }));
}

function NodeSphere({
  x,
  y,
  color,
  label,
  active,
}: {
  x: number;
  y: number;
  color: string;
  label: string;
  active: boolean;
}) {
  return (
    <group position={[x, y, 0]}>
      <mesh>
        <sphereGeometry args={[active ? 0.32 : 0.28, 24, 24]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000000'} emissiveIntensity={active ? 0.3 : 0} />
      </mesh>
      <Text position={[0, 0, 0.33]} fontSize={0.16} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

export function QAOAStoryScene({
  data,
  activeStep,
  cameraMode,
}: {
  data: QAOAAnimationPayload;
  activeStep: QAOAAnimationStep;
  cameraMode: 'fixed' | 'orbit';
}) {
  const laneYs = useMemo(
    () => Array.from({ length: data.n_nodes }, (_, index) => ((data.n_nodes - 1) / 2 - index) * 1.35),
    [data.n_nodes],
  );
  const inputPositions = useMemo(() => getGraphPositions(data.n_nodes, -8, 0, data.n_nodes <= 3 ? 1.9 : 2.2), [data.n_nodes]);
  const resultPositions = useMemo(() => getGraphPositions(data.n_nodes, 8, 0, data.n_nodes <= 3 ? 1.9 : 2.2), [data.n_nodes]);
  const activePartition = getPartitionFromBitstring(activeStep.candidate_bitstring, data.n_nodes);
  const orbX = activeStep.phase === 'optimizer'
    ? -2.7
    : activeStep.phase === 'superposition'
      ? -1.2
      : activeStep.phase === 'cost'
        ? 0.4
        : activeStep.phase === 'mixer'
          ? 2.1
          : activeStep.phase === 'measurement'
            ? 3.9
            : 5;

  return (
    <>
      <CameraRig mode={cameraMode} distance={22} fixedOffset={{ x: 0, y: 0.4 }} orbitOffset={{ x: 1.8, y: 2, z: 2 }} lookAtY={0} />
      <ambientLight intensity={0.86} />
      <directionalLight position={[7, 8, 9]} intensity={0.85} />
      <directionalLight position={[-7, 5, 6]} intensity={0.28} color="#93c5fd" />

      <OrbitControls
        enabled={cameraMode === 'orbit'}
        enablePan={false}
        enableZoom
        minDistance={15}
        maxDistance={28}
        minPolarAngle={Math.PI * 0.32}
        maxPolarAngle={Math.PI * 0.68}
      />

      <Text position={[-8, 3.2, 0]} fontSize={0.24} color="#1e3a8a" anchorX="center" anchorY="middle">
        Graph Input
      </Text>
      <Text position={[0.9, 3.2, 0]} fontSize={0.24} color="#334155" anchorX="center" anchorY="middle">
        Quantum Circuit
      </Text>
      <Text position={[8, 3.2, 0]} fontSize={0.24} color="#166534" anchorX="center" anchorY="middle">
        Cut Output
      </Text>

      {data.edges.map(([i, j]) => {
        const isActive = activeStep.phase === 'cost' && activeStep.edge && activeStep.edge[0] === i && activeStep.edge[1] === j;
        return (
          <Line
            key={`input-edge-${i}-${j}`}
            points={[[inputPositions[i].x, inputPositions[i].y, 0], [inputPositions[j].x, inputPositions[j].y, 0]]}
            color={isActive ? '#f97316' : '#94a3b8'}
            lineWidth={isActive ? 2 : 1}
          />
        );
      })}

      {data.edges.map(([i, j]) => {
        const isCut = activePartition[i] !== activePartition[j];
        return (
          <Line
            key={`result-edge-${i}-${j}`}
            points={[[resultPositions[i].x, resultPositions[i].y, 0], [resultPositions[j].x, resultPositions[j].y, 0]]}
            color={isCut ? '#16a34a' : '#94a3b8'}
            lineWidth={isCut ? 2 : 1}
          />
        );
      })}

      {data.nodes.map((node, index) => (
        <NodeSphere
          key={`input-node-${node}`}
          x={inputPositions[index].x}
          y={inputPositions[index].y}
          color="#3b82f6"
          label={`${node}`}
          active={!!activeStep.edge && activeStep.edge.includes(node)}
        />
      ))}

      {data.nodes.map((node, index) => (
        <NodeSphere
          key={`result-node-${node}`}
          x={resultPositions[index].x}
          y={resultPositions[index].y}
          color={activePartition[index] === 0 ? '#3b82f6' : '#f59e0b'}
          label={`${node}`}
          active={activeStep.phase === 'measurement' || activeStep.phase === 'update'}
        />
      ))}

      {laneYs.map((y, index) => (
        <Line key={`wire-${index}`} points={[[-3.2, y, 0], [5.2, y, 0]]} color="#cbd5e1" lineWidth={1} />
      ))}

      {laneYs.map((y, index) => (
        <Text key={`label-${index}`} position={[-3.65, y, 0.04]} fontSize={0.18} color="#334155" anchorX="right" anchorY="middle">
          q{index}
        </Text>
      ))}

      {activeStep.phase === 'superposition' &&
        laneYs.map((y, index) => (
          <HadamardGate key={`h-${index}`} x={-1.2} y={y} isActive />
        ))}

      {activeStep.phase === 'cost' && activeStep.edge && (
        <>
          <Line
            points={[[0.4, laneYs[activeStep.edge[0]], 0], [0.4, laneYs[activeStep.edge[1]], 0]]}
            color={PHASE_COLOR.cost}
            lineWidth={2}
          />
          <LabeledDiscGate x={0.4} y={laneYs[activeStep.edge[0]]} label="C" color={PHASE_COLOR.cost} isActive />
          <LabeledDiscGate x={0.4} y={laneYs[activeStep.edge[1]]} label="ZZ" color={PHASE_COLOR.cost} isActive />
        </>
      )}

      {activeStep.phase === 'mixer' && activeStep.target_qubit !== undefined && (
        <LabeledDiscGate x={2.1} y={laneYs[activeStep.target_qubit]} label="Rx" color={PHASE_COLOR.mixer} isActive />
      )}

      {(activeStep.phase === 'measurement' || activeStep.phase === 'update') &&
        laneYs.map((y, index) => (
          <LabeledDiscGate key={`m-${index}`} x={3.9} y={y} label="M" color={PHASE_COLOR.measurement} isActive />
        ))}

      {activeStep.phase === 'optimizer' && (
        <Text position={[-2.2, 2.35, 0]} fontSize={0.18} color={PHASE_COLOR.optimizer} anchorX="center" anchorY="middle">
          optimizer
        </Text>
      )}

      {activeStep.qubit_summaries.map((summary) => (
        <QubitOrb
          key={`orb-${summary.qubit}`}
          variant="probability"
          x={orbX}
          y={laneYs[summary.qubit]}
          pOne={summary.p_one}
          isActive={activeStep.target_qubit === summary.qubit || activeStep.phase === 'superposition'}
        />
      ))}
    </>
  );
}
