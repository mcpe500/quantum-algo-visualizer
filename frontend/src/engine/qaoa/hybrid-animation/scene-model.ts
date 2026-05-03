/**
 * QAOA Hybrid Animation Scene Model Engine.
 * Builds scene objects for a given active step index.
 */

import type { QAOAAnimationPayload, QAOAAnimationStep } from '../../../types/qaoa';

export interface QaoaProblemGraphScene {
  adjacencyMatrix: number[][];
  nodes: number[];
  edges: [number, number][];
  nNodes: number;
}

export interface QaoaCircuitScene {
  pLayers: number;
  nQubits: number;
  gamma: number[];
  beta: number[];
  layer?: number;
  edge?: [number, number];
  targetQubit?: number;
}

export interface QaoaCostMixerScene {
  expectedCut: number;
  bestSoFar: number;
  operation: string;
  phase: string;
  dominantBitstring?: string;
  dominantCut?: number;
  dominantProbability?: number;
  candidateBitstring?: string;
  cutValue?: number;
}

export interface QaoaSceneLabels {
  checkpointLabel: string;
  checkpointKind: string;
  phaseLabel: string;
  stepLabel: string;
  iterationLabel: string;
}

export interface QaoaCameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

export interface QaoaSceneModel {
  graph: QaoaProblemGraphScene;
  circuit: QaoaCircuitScene;
  costMixer: QaoaCostMixerScene;
  labels: QaoaSceneLabels;
  camera: QaoaCameraPreset;
}

const PHASE_CAMERA_PRESETS: Record<string, QaoaCameraPreset> = {
  optimizer: { position: [0, 3, 8], target: [0, 0, 0] },
  superposition: { position: [4, 2, 6], target: [0, 0, 0] },
  cost: { position: [-3, 2, 7], target: [0, 0, 0] },
  mixer: { position: [3, 3, 5], target: [0, 0, 0] },
  measurement: { position: [0, 4, 6], target: [0, 0, 0] },
  update: { position: [2, 2, 8], target: [0, 0, 0] },
};

export function buildQaoaSceneModel(data: QAOAAnimationPayload, activeStepIndex: number): QaoaSceneModel {
  const step = data.timeline[activeStepIndex] ?? data.timeline[0];

  const graph: QaoaProblemGraphScene = {
    adjacencyMatrix: data.adjacency_matrix,
    nodes: data.nodes,
    edges: data.edges,
    nNodes: data.n_nodes,
  };

  const circuit: QaoaCircuitScene = {
    pLayers: data.p_layers,
    nQubits: data.n_nodes,
    gamma: step.gamma,
    beta: step.beta,
    layer: step.layer,
    edge: step.edge,
    targetQubit: step.target_qubit,
  };

  const costMixer: QaoaCostMixerScene = {
    expectedCut: step.expected_cut,
    bestSoFar: step.best_so_far,
    operation: step.operation,
    phase: step.phase,
    dominantBitstring: step.dominant_probability !== undefined ? step.candidate_bitstring : undefined,
    dominantCut: step.cut_value,
    dominantProbability: step.dominant_probability,
    candidateBitstring: step.candidate_bitstring,
    cutValue: step.cut_value,
  };

  const labels: QaoaSceneLabels = {
    checkpointLabel: step.checkpoint_label,
    checkpointKind: step.checkpoint_kind,
    phaseLabel: step.phase,
    stepLabel: `Step ${step.step}`,
    iterationLabel: `Iteration ${step.iteration}`,
  };

  const camera = PHASE_CAMERA_PRESETS[step.phase] ?? PHASE_CAMERA_PRESETS.optimizer;

  return {
    graph,
    circuit,
    costMixer,
    labels,
    camera,
  };
}
