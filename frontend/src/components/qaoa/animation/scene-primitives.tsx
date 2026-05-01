import { Line, OrbitControls, Text } from '@react-three/drei';
import { useMemo } from 'react';
import type { QAOAAnimationPayload, QAOAAnimationStep } from '../../../types/qaoa';
import { PHASE_COLOR } from './constants';
import { getPartitionFromBitstring } from './helpers';
import { HadamardGate, CameraRig, LabeledBoxGate, BlochQubitNode } from '../../../shared/components';

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
  const blochQubits = useMemo(() => {
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
    return activeStep.qubit_summaries.flatMap((summary) => {
      if (summary.qubit < 0 || summary.qubit >= data.n_nodes) return [];
      if (!Number.isFinite(summary.theta) || !Number.isFinite(summary.phi) || !Number.isFinite(summary.p_zero)) return [];

      const p0 = clamp(summary.p_zero, 0, 1);
      const bx = Math.sin(summary.theta) * Math.cos(summary.phi);
      const by = Math.sin(summary.theta) * Math.sin(summary.phi);
      const bzTheta = Math.cos(summary.theta);
      const bzProb = clamp(2 * p0 - 1, -1, 1);
      const bz = Math.abs(bzTheta - bzProb) > 0.2 ? bzProb : bzTheta;
      const label = p0 >= 0.85 ? '|0>' : p0 <= 0.15 ? '|1>' : '|psi>';
      return [{
        summary,
        p0,
        blochState: { bx, by, bz, label },
      }];
    });
  }, [activeStep.qubit_summaries, data.n_nodes]);
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
  const gateSize = 0.42;

  // Compute which edges are cut for the active partition
  const cutEdges = useMemo(() => {
    const cuts = new Set<string>();
    if (activePartition) {
      data.edges.forEach(([i, j]) => {
        if (activePartition[i] !== activePartition[j]) {
          cuts.add(`${i}-${j}`);
        }
      });
    }
    return cuts;
  }, [activePartition, data.edges]);

  // Compute cut evolution based on checkpoint iteration
  const cutEvolutionPercent = useMemo(() => {
    const checkpoint = data.checkpoints.find(c => c.key === activeStep.checkpoint_key);
    if (!checkpoint || data.exact.optimal_cut === 0) return 0;
    // Show progress from initial to best cut
    const initialCheckpoint = data.checkpoints.find(c => c.kind === 'initial');
    if (!initialCheckpoint) return 0;
    const progress = checkpoint.expected_cut / data.exact.optimal_cut;
    return Math.min(100, Math.max(0, progress * 100));
  }, [activeStep.checkpoint_key, data.checkpoints, data.exact.optimal_cut]);

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

      {/* Input Graph Label */}
      <Text position={[-8, 3.2, 0]} fontSize={0.24} color="#1e3a8a" anchorX="center" anchorY="middle">
        Graph Input
      </Text>
      {/* Circuit Label */}
      <Text position={[0.9, 3.2, 0]} fontSize={0.24} color="#334155" anchorX="center" anchorY="middle">
        Quantum Circuit
      </Text>
      {/* Cut Output Label */}
      <Text position={[8, 3.2, 0]} fontSize={0.24} color="#166534" anchorX="center" anchorY="middle">
        Cut Output
      </Text>

      {/* Cut Evolution Indicator */}
      <group position={[8, -3.0, 0]}>
        <Text position={[0, 0.4, 0]} fontSize={0.14} color="#64748b" anchorX="center" anchorY="middle">
          Cut Evolution
        </Text>
        <Text position={[0, 0.15, 0]} fontSize={0.18} color="#16a34a" anchorX="center" anchorY="middle">
          {cutEvolutionPercent.toFixed(0)}%
        </Text>
      </group>

      {/* Input Graph Edges */}
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

      {/* Result Graph Edges - Color coded by cut status */}
      {data.edges.map(([i, j]) => {
        const isCut = cutEdges.has(`${i}-${j}`) || cutEdges.has(`${j}-${i}`);
        const isActive = activeStep.phase === 'cost' && activeStep.edge && activeStep.edge[0] === i && activeStep.edge[1] === j;
        return (
          <Line
            key={`result-edge-${i}-${j}`}
            points={[[resultPositions[i].x, resultPositions[i].y, 0], [resultPositions[j].x, resultPositions[j].y, 0]]}
            color={isCut ? '#16a34a' : isActive ? '#f97316' : '#94a3b8'}
            lineWidth={isCut ? 2.5 : isActive ? 2 : 1}
            dashed={isCut}
            dashScale={isCut ? 1 : undefined}
            dashSize={isCut ? 0.15 : undefined}
            gapSize={isCut ? 0.08 : undefined}
          />
        );
      })}

      {/* Input Nodes */}
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

      {/* Result Nodes - Color coded by partition */}
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

      {/* Quantum Circuit Wires */}
      {laneYs.map((y, index) => (
        <Line key={`wire-${index}`} points={[[-3.2, y, 0], [5.2, y, 0]]} color="#cbd5e1" lineWidth={1} />
      ))}

      {/* Wire Labels */}
      {laneYs.map((y, index) => (
        <Text key={`label-${index}`} position={[-3.65, y, 0.04]} fontSize={0.18} color="#334155" anchorX="right" anchorY="middle">
          q{index}
        </Text>
      ))}

      {/* Superposition Layer */}
      {activeStep.phase === 'superposition' &&
        laneYs.map((y, index) => (
          <HadamardGate key={`h-${index}`} x={-1.2} y={y} isActive size={gateSize} />
        ))}

      {/* Cost Layer */}
      {activeStep.phase === 'cost' && activeStep.edge && (
        <>
          <Line
            points={[[0.4, laneYs[activeStep.edge[0]], 0], [0.4, laneYs[activeStep.edge[1]], 0]]}
            color={PHASE_COLOR.cost}
            lineWidth={2}
          />
          <LabeledBoxGate x={0.4} y={laneYs[activeStep.edge[0]]} label="C" color={PHASE_COLOR.cost} size={gateSize} isActive />
          <LabeledBoxGate x={0.4} y={laneYs[activeStep.edge[1]]} label="ZZ" color={PHASE_COLOR.cost} size={gateSize} isActive />
        </>
      )}

      {/* Mixer Layer */}
      {activeStep.phase === 'mixer' && activeStep.target_qubit !== undefined && (
        <LabeledBoxGate x={2.1} y={laneYs[activeStep.target_qubit]} label="RX" color={PHASE_COLOR.mixer} size={gateSize} isActive />
      )}

      {/* Measurement Layer */}
      {(activeStep.phase === 'measurement' || activeStep.phase === 'update') &&
        laneYs.map((y, index) => (
          <LabeledBoxGate key={`m-${index}`} x={3.9} y={y} label="M" color={PHASE_COLOR.measurement} size={gateSize} isActive />
        ))}

      {/* Optimizer Label */}
      {activeStep.phase === 'optimizer' && (
        <Text position={[-2.2, 2.35, 0]} fontSize={0.18} color={PHASE_COLOR.optimizer} anchorX="center" anchorY="middle">
          optimizer
        </Text>
      )}

      {/* Bloch Spheres */}
      {blochQubits.map(({ summary, blochState, p0 }) => (
        <BlochQubitNode
          key={`orb-${summary.qubit}`}
          targetX={orbX}
          y={laneYs[summary.qubit]}
          phaseColor={PHASE_COLOR[activeStep.phase] || '#2563eb'}
          blochState={blochState}
          p0={p0}
        />
      ))}
    </>
  );
}
