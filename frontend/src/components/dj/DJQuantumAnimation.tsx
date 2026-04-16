import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronRight, Eye, EyeOff, Gauge, Lock, Move3D, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { DJAnimationPayload, DJQuantumTrace, DJTraceStage } from '../../types/dj';

interface DJQuantumAnimationProps {
  data: DJAnimationPayload;
  trace: DJQuantumTrace;
}

const GATE_X = { xGate: -8, hRound1: -4, oracle: 0, hRound2: 4, measure: 8 };

const PHASE_X_RANGE: Record<string, [number, number]> = {
  init: [-10, -6],
  prep: [-6, -2],
  oracle: [-2, 2],
  interference: [2, 6],
  measure: [6, 10],
};

const PHASE_COLOR: Record<string, string> = {
  init: '#2563EB',
  prep: '#10B981',
  oracle: '#F59E0B',
  interference: '#8B5CF6',
  measure: '#EF4444',
};

const PHASE_LABEL: Record<string, string> = {
  init: 'Inisialisasi',
  prep: 'Superposisi',
  oracle: 'Oracle',
  interference: 'Interferensi',
  measure: 'Measurement',
};

const MARKER_STYLE: Record<string, string> = {
  H: 'bg-blue-100 text-blue-700 border-blue-300',
  X: 'bg-red-100 text-red-700 border-red-300',
  M: 'bg-slate-100 text-slate-700 border-slate-300',
  P: 'bg-amber-100 text-amber-700 border-amber-300',
  S: 'bg-violet-100 text-violet-700 border-violet-300',
  '\u25CF': 'bg-violet-200 text-violet-800 border-violet-400',
  '\u2295': 'bg-amber-200 text-amber-800 border-amber-400',
  '-': 'bg-slate-50 text-slate-300 border-slate-200',
};

function getLaneYs(nQubits: number): number[] {
  const total = nQubits + 1;
  return Array.from({ length: total }, (_, i) => ((total - 1) / 2 - i) * 1.45);
}

function getQubitP1(probs: number[], labels: string[], qubitIdx: number, totalQubits: number): number {
  let p1 = 0;
  for (let i = 0; i < probs.length; i++) {
    const bits = labels[i];
    if (bits && bits[totalQubits - 1 - qubitIdx] === '1') {
      p1 += probs[i];
    }
  }
  return p1;
}

function groupStagesByPhase(stages: DJTraceStage[]) {
  const groups: Array<{ phase: string; items: DJTraceStage[] }> = [];
  for (const stage of stages) {
    const last = groups[groups.length - 1];
    if (last && last.phase === stage.phase) {
      last.items.push(stage);
      continue;
    }
    groups.push({ phase: stage.phase, items: [stage] });
  }
  return groups;
}

function computeOrbX(currentStep: number, snapshots: { phase: string }[]): number {
  if (currentStep >= snapshots.length - 1) return GATE_X.measure;
  const snap = snapshots[currentStep];
  const phase = snap.phase;
  const range = PHASE_X_RANGE[phase];
  if (!range) return GATE_X.measure;

  let phaseStart = -1;
  let phaseEnd = -1;
  for (let i = 0; i < snapshots.length; i++) {
    if (snapshots[i].phase === phase) {
      if (phaseStart === -1) phaseStart = i;
      phaseEnd = i;
    }
  }

  const totalInPhase = phaseEnd - phaseStart + 1;
  const stepInPhase = currentStep - phaseStart;
  const frac = totalInPhase > 1 ? stepInPhase / (totalInPhase - 1) : 0.5;
  return range[0] + frac * (range[1] - range[0]);
}

function CameraRig({ mode }: { mode: 'fixed' | 'orbit' }) {
  const { camera } = useThree();

  useEffect(() => {
    if (mode === 'fixed') {
      camera.position.set(0, -0.5, 20);
      camera.lookAt(0, -0.5, 0);
    } else {
      camera.position.set(2, 1.5, 17);
      camera.lookAt(0, -0.5, 0);
    }
    camera.updateProjectionMatrix();
  }, [camera, mode]);

  return null;
}

function GateBox({ position, label, color = '#3B82F6', highlight = false, width = 0.9, height = 0.9 }: {
  position: [number, number, number];
  label: string;
  color?: string;
  highlight?: boolean;
  width?: number;
  height?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, height, 0.5]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={highlight ? 0.35 : 0.15}
          roughness={0.1}
          depth={0.3}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[width, height, 0.5]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={highlight ? 0.7 : 0.25} />
      </mesh>
      <Text
        position={[0, height / 2 + 0.25, 0.05]}
        fontSize={0.28}
        color={highlight ? color : '#64748B'}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {label}
      </Text>
    </group>
  );
}

function OracleGateBox({ laneHeight, highlight }: { laneHeight: number; highlight: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.6;
      coreRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group position={[GATE_X.oracle, 0, 0.1]}>
      <mesh>
        <boxGeometry args={[1.8, laneHeight + 1.2, 1.0]} />
        <meshPhysicalMaterial
          color="#1E293B"
          transparent
          opacity={highlight ? 0.7 : 0.5}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[1.9, laneHeight + 1.3, 1.1]} />
        <meshBasicMaterial color="#F59E0B" wireframe transparent opacity={highlight ? 0.5 : 0.2} />
      </mesh>
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.4} wireframe />
      </mesh>
      <Text
        position={[0, laneHeight / 2 + 1.0, 0.6]}
        fontSize={0.3}
        color={highlight ? '#F59E0B' : '#94A3B8'}
        anchorX="center"
        anchorY="middle"
      >
        U_f
      </Text>
    </group>
  );
}

function MeasureBox({ position, highlight }: { position: [number, number, number]; highlight: boolean }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshStandardMaterial color="#64748B" transparent opacity={highlight ? 0.6 : 0.2} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.7, 0.9, 0.4]} />
        <meshBasicMaterial color="#64748B" wireframe transparent opacity={highlight ? 0.5 : 0.15} />
      </mesh>
      <Text
        position={[0, 0.7, 0.05]}
        fontSize={0.22}
        color={highlight ? '#334155' : '#94A3B8'}
        anchorX="center"
        anchorY="middle"
      >
        M
      </Text>
    </group>
  );
}

function CircuitLayout({ laneYs, labels, nQubits, orbX }: {
  laneYs: number[];
  labels: string[];
  nQubits: number;
  orbX: number;
}) {
  const passedX = orbX >= GATE_X.xGate - 0.5;
  const passedH1 = orbX >= GATE_X.hRound1 - 0.5;
  const passedOracle = orbX >= GATE_X.oracle - 1;
  const passedH2 = orbX >= GATE_X.hRound2 - 0.5;
  const passedMeasure = orbX >= GATE_X.measure - 1;
  const laneHeight = laneYs.length > 1 ? Math.abs(laneYs[0] - laneYs[laneYs.length - 1]) : 1.45;

  return (
    <group>
      {laneYs.map((y, i) => (
        <Line
          key={`wire-${labels[i]}`}
          points={[[-10.5, y, -0.05], [10.5, y, -0.05]]}
          color="#CBD5E1"
          lineWidth={1}
        />
      ))}

      {laneYs.map((y, i) => (
        <Text
          key={`wl-${labels[i]}`}
          position={[-11.2, y, 0.1]}
          fontSize={0.24}
          color="#475569"
          anchorX="right"
          anchorY="middle"
        >
          {labels[i]}
        </Text>
      ))}

      <GateBox
        position={[GATE_X.xGate, laneYs[laneYs.length - 1], 0]}
        label="X"
        color="#EF4444"
        highlight={passedX}
        width={0.7}
        height={0.7}
      />

      {laneYs.map((y, i) => (
        <GateBox
          key={`h1-${i}`}
          position={[GATE_X.hRound1, y, 0]}
          label="H"
          color="#3B82F6"
          highlight={passedH1}
        />
      ))}

      <OracleGateBox laneHeight={laneHeight} highlight={passedOracle} />

      {laneYs.slice(0, nQubits).map((y, i) => (
        <GateBox
          key={`h2-${i}`}
          position={[GATE_X.hRound2, y, 0]}
          label="H"
          color="#8B5CF6"
          highlight={passedH2}
        />
      ))}

      {laneYs.slice(0, nQubits).map((y, i) => (
        <MeasureBox
          key={`m-${i}`}
          position={[GATE_X.measure, y, 0]}
          highlight={passedMeasure}
        />
      ))}
    </group>
  );
}

function QubitOrbNode({
  label,
  y,
  pOne,
  targetX,
  phaseColor,
}: {
  label: string;
  y: number;
  pOne: number;
  targetX: number;
  phaseColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const isZero = pOne < 0.15;
  const isOne = pOne > 0.85;
  const isSuper = !isZero && !isOne;
  const color = isSuper ? '#8B5CF6' : isOne ? '#F97316' : '#3B82F6';
  const stateText = isSuper ? '0|1' : isOne ? '1' : '0';

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 4.5);
    const bobY = isSuper ? Math.sin(state.clock.elapsedTime * 2.2 + y) * 0.08 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, y + bobY, delta * 6);

    if (matRef.current) {
      const target = new THREE.Color(color);
      matRef.current.color.lerp(target, delta * 4);
      const tgtOpacity = isSuper ? 0.65 : 1.0;
      matRef.current.opacity += (tgtOpacity - matRef.current.opacity) * delta * 4;
      matRef.current.wireframe = isSuper;
      const tgtEmissive = isSuper ? target : new THREE.Color(0x000000);
      matRef.current.emissive.lerp(tgtEmissive, delta * 4);
      matRef.current.emissiveIntensity += ((isSuper ? 0.5 : 0.15) - matRef.current.emissiveIntensity) * delta * 4;
    }

    if (lightRef.current) {
      lightRef.current.intensity += ((isSuper ? 1.5 : 0) - lightRef.current.intensity) * delta * 4;
      lightRef.current.color.lerp(new THREE.Color(color), delta * 4);
    }
  });

  return (
    <group ref={groupRef} position={[targetX, y, 0.15]}>
      <mesh>
        <sphereGeometry args={[0.52, 36, 36]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={isSuper ? 0.5 : 0.15}
          transparent
          opacity={isSuper ? 0.65 : 1.0}
          wireframe={isSuper}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      <pointLight ref={lightRef} distance={2.5} intensity={0} />

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.65, 0.025, 12, 64]} />
        <meshStandardMaterial color={phaseColor} emissive={phaseColor} emissiveIntensity={0.2} />
      </mesh>

      <Text
        position={[0, 0, 0.65]}
        fontSize={0.24}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {stateText}
      </Text>

      <Text
        position={[0, -0.78, 0.05]}
        fontSize={0.17}
        color="#334155"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

type OracleToken = { input: string; output: number };

function TokenCard3D({ token, index, orbX }: { token: OracleToken; index: number; orbX: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const col = index % 4;
  const row = Math.floor(index / 4);
  const topY = 4.5 - row * 0.55;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const tx = orbX - 1.2 + col * 0.6;
    const ty = topY + Math.sin(t * 1.8 + index) * 0.1;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, tx, delta * 4);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, ty, delta * 4);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0.9, delta * 4);
  });

  return (
    <group ref={groupRef} position={[orbX, topY, 0.9]}>
      <mesh>
        <boxGeometry args={[0.5, 0.28, 0.08]} />
        <meshStandardMaterial
          color={token.output === 1 ? '#FEE2E2' : '#DBEAFE'}
          emissive={token.output === 1 ? '#FCA5A5' : '#93C5FD'}
          emissiveIntensity={0.12}
          roughness={0.3}
        />
      </mesh>
      <Text position={[0, 0.02, 0.05]} fontSize={0.09} color={token.output === 1 ? '#B91C1C' : '#1D4ED8'} anchorX="center" anchorY="middle">
        {token.input}
      </Text>
      <Text position={[0.18, -0.08, 0.05]} fontSize={0.06} color="#475569" anchorX="center" anchorY="middle">
        {token.output}
      </Text>
    </group>
  );
}

function OracleTokenRibbon({ truthTable, orbX, visible }: {
  truthTable: OracleToken[];
  orbX: number;
  visible: boolean;
}) {
  const tokens = useMemo(() => truthTable.slice(0, 8), [truthTable]);
  if (!visible) return null;
  return (
    <group>
      {tokens.map((token, index) => (
        <TokenCard3D key={`${token.input}-${index}`} token={token} index={index} orbX={orbX} />
      ))}
    </group>
  );
}

function ResultBoard({ classification, visible }: {
  classification: 'CONSTANT' | 'BALANCED';
  visible: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isConstant = classification === 'CONSTANT';

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = visible ? 1 : 0.001;
    groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, target, delta * 5);
    groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, target, delta * 5);
    groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, target, delta * 5);
  });

  return (
    <group ref={groupRef} position={[GATE_X.measure + 0.5, 0, 0.3]} scale={[0.001, 0.001, 0.001]}>
      <mesh>
        <planeGeometry args={[2.2, 1.8]} />
        <meshStandardMaterial color={isConstant ? '#DBEAFE' : '#FFEDD5'} transparent opacity={0.95} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.2, 1.8)]} />
        <lineBasicMaterial color={isConstant ? '#2563EB' : '#EA580C'} />
      </lineSegments>
      <Text position={[0, 0.28, 0.06]} fontSize={0.28} color={isConstant ? '#1D4ED8' : '#C2410C'} anchorX="center" anchorY="middle">
        {classification}
      </Text>
      <Text position={[0, -0.28, 0.06]} fontSize={0.12} color="#334155" maxWidth={1.8} textAlign="center" anchorX="center" anchorY="middle">
        {isConstant ? 'Semua hasil ukur input = 0' : 'Ada hasil ukur input bukan 0'}
      </Text>
    </group>
  );
}

function StoryScene({
  data,
  currentStep,
  cameraMode,
  showTokens,
}: {
  data: DJAnimationPayload;
  currentStep: number;
  cameraMode: 'fixed' | 'orbit';
  showTokens: boolean;
}) {
  const { snapshots, n_qubits, measurement, truthTable } = {
    snapshots: data.snapshots,
    n_qubits: data.n_qubits,
    measurement: data.measurement,
    truthTable: data.truth_table,
  };
  const snapshot = snapshots[currentStep];
  const storyPhase = snapshot?.phase || 'init';
  const showResult = currentStep >= snapshots.length - 1;

  const laneYs = useMemo(() => getLaneYs(n_qubits), [n_qubits]);
  const laneLabels = useMemo(
    () => [...Array.from({ length: n_qubits }, (_, i) => `q${i}`), 'anc'],
    [n_qubits]
  );

  const qubitStates = useMemo(() => {
    const probs = snapshot?.probabilities || [];
    const labels = snapshot?.labels || [];
    const totalQubits = n_qubits + 1;
    return Array.from({ length: totalQubits }, (_, i) => getQubitP1(probs, labels, i, totalQubits));
  }, [n_qubits, snapshot?.labels, snapshot?.probabilities]);

  const orbX = computeOrbX(currentStep, snapshots);
  const phaseColor = showResult ? PHASE_COLOR.measure : PHASE_COLOR[storyPhase] || '#2563EB';

  return (
    <>
      <CameraRig mode={cameraMode} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 8]} intensity={0.8} />
      <directionalLight position={[-6, 3, 5]} intensity={0.3} color="#BFDBFE" />

      <OrbitControls
        enabled={cameraMode === 'orbit'}
        enablePan={false}
        enableZoom
        minDistance={10}
        maxDistance={24}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
      />

      <CircuitLayout laneYs={laneYs} labels={laneLabels} nQubits={n_qubits} orbX={orbX} />

      {qubitStates.map((pOne, i) => (
        <QubitOrbNode
          key={`orb-${laneLabels[i]}`}
          label={laneLabels[i]}
          y={laneYs[i]}
          pOne={pOne}
          targetX={orbX}
          phaseColor={phaseColor}
        />
      ))}

      <OracleTokenRibbon truthTable={truthTable} orbX={orbX} visible={showTokens && !showResult} />
      <ResultBoard classification={measurement.classification} visible={showResult} />

      <Text
        position={[0, Math.max(...laneYs) + 1.6, 0.2]}
        fontSize={0.3}
        color="#0F172A"
        anchorX="center"
        anchorY="middle"
      >
        {showResult ? 'Output & Measurement' : PHASE_LABEL[storyPhase] || storyPhase}
      </Text>
    </>
  );
}

function MarkerBadge({ marker }: { marker: string }) {
  const value = marker || '-';
  const classes = MARKER_STYLE[value] || 'bg-slate-50 text-slate-400 border-slate-200';
  return <span className={`inline-flex min-w-8 justify-center rounded border px-1.5 py-0.5 font-mono text-[10px] ${classes}`}>{value}</span>;
}

function CompactGateTimeline({
  trace,
  activePhase,
  nQubits,
  currentStep,
  onJumpPhase,
}: {
  trace: DJQuantumTrace;
  activePhase: string;
  nQubits: number;
  currentStep: number;
  onJumpPhase: (phase: string) => void;
}) {
  const groups = useMemo(() => groupStagesByPhase(trace.stages), [trace.stages]);
  const activeStage = trace.stages[currentStep];
  const labels = useMemo(
    () => [...Array.from({ length: nQubits }, (_, i) => `q${i}`), 'anc'],
    [nQubits]
  );

  return (
    <div className="px-4 py-2 space-y-1.5">
      <div className="flex items-center gap-1 overflow-x-auto">
        {groups.map((group, i) => {
          const isActive = group.phase === activePhase;
          return (
            <Fragment key={group.phase}>
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />}
              <button
                onClick={() => onJumpPhase(group.phase)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {PHASE_LABEL[group.phase] || group.phase}
                <span className="ml-1 font-normal opacity-70">({group.items.length})</span>
              </button>
            </Fragment>
          );
        })}
      </div>

      {activeStage && (
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-600">
          <span className="shrink-0 font-semibold text-slate-800">
            Step {activeStage.step}: {activeStage.operation}
          </span>
          <span className="text-slate-300">&middot;</span>
          <div className="flex items-center gap-1">
            {labels.map((label, idx) => {
              const marker = idx === nQubits ? activeStage.ancilla_marker : activeStage.wire_markers[String(idx)] || '-';
              return (
                <span key={`mk-${label}`} className="flex items-center gap-0.5 shrink-0">
                  <span className="text-[10px] text-slate-400">{label}</span>
                  <MarkerBadge marker={marker} />
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function DJQuantumAnimation({ data, trace }: DJQuantumAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const [cameraMode, setCameraMode] = useState<'fixed' | 'orbit'>('fixed');
  const [showTokens, setShowTokens] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = data.snapshots.length;
  const snapshot = data.snapshots[currentStep];
  const storyPhase = snapshot?.phase || 'init';
  const activeGatePhase = currentStep >= totalSteps - 1 ? 'measure' : storyPhase;
  const phaseColor = PHASE_COLOR[activeGatePhase] || '#2563EB';
  const isLastStep = currentStep >= totalSteps - 1;

  const stopTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      stopTimer();
      if (currentStep >= totalSteps - 1) setIsPlaying(false);
    }

    return stopTimer;
  }, [currentStep, isPlaying, speed, stopTimer, totalSteps]);

  const handlePlay = () => {
    if (isLastStep) setCurrentStep(0);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopTimer();
  };

  const handleStep = () => {
    setIsPlaying(false);
    stopTimer();
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    stopTimer();
    setCurrentStep(0);
  };

  const handleJumpPhase = useCallback((phase: string) => {
    const idx = trace.stages.findIndex((s) => s.phase === phase);
    if (idx >= 0 && idx < totalSteps) {
      setCurrentStep(idx);
      setIsPlaying(false);
      stopTimer();
    }
  }, [trace.stages, totalSteps, stopTimer]);

  const footerTitle = isLastStep ? 'Measurement & Result' : snapshot?.operation;
  const footerDescription = isLastStep
    ? data.measurement.classification === 'CONSTANT'
      ? 'Semua qubit input terukur 0, maka fungsi diklasifikasikan CONSTANT.'
      : 'Ada qubit input terukur bukan 0, maka fungsi diklasifikasikan BALANCED.'
    : snapshot?.description;

  return (
    <div className="rounded-xl border-2 border-slate-300 bg-white overflow-hidden">
      <header className="px-4 pt-4 pb-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Animasi DJ 3D + Gate Python</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">{data.case_id} - input, gate, oracle, output</h2>
      </header>

      <CompactGateTimeline trace={trace} activePhase={activeGatePhase} nQubits={data.n_qubits} currentStep={currentStep} onJumpPhase={handleJumpPhase} />

      <div className="px-4 pb-2 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-500" />Orb 0</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-orange-500" />Orb 1</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-violet-500" />Orb 0|1</span>
        </div>

        <button
          onClick={() => setShowTokens((prev) => !prev)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"
        >
          {showTokens ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showTokens ? 'Sembunyikan token data oracle' : 'Tampilkan token data oracle'}
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <strong className="text-slate-800">Catatan:</strong> Orb menunjukkan state qubit. Token data oracle hanya contoh data input/output oracle dari dataset, bukan state qubit.
        </div>
      </div>

      <div className="relative mx-4 rounded-xl border border-slate-300 overflow-hidden" style={{ height: '480px' }}>
        <Canvas
          camera={{ position: [0, -0.5, 20], fov: 36, near: 0.1, far: 100 }}
          style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
          gl={{ antialias: true }}
        >
          <StoryScene data={data} currentStep={currentStep} cameraMode={cameraMode} showTokens={showTokens} />
        </Canvas>

        <div className="absolute left-3 top-3">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm"
            style={{
              backgroundColor: `${phaseColor}22`,
              color: phaseColor,
              border: `1px solid ${phaseColor}66`,
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: phaseColor }} />
            {PHASE_LABEL[activeGatePhase] || activeGatePhase}
          </div>
        </div>

        <div className="absolute right-3 top-3">
          <button
            onClick={() => setCameraMode((prev) => (prev === 'fixed' ? 'orbit' : 'fixed'))}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white/95 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-white"
          >
            {cameraMode === 'fixed' ? <Lock className="h-3.5 w-3.5" /> : <Move3D className="h-3.5 w-3.5" />}
            {cameraMode === 'fixed' ? 'Fixed Camera' : 'Orbit Camera'}
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <div className="rounded-lg border border-slate-300 bg-white/95 px-3 py-2 shadow-sm">
            <p className="text-[12px] font-semibold text-slate-800">{footerTitle}</p>
            <p className="mt-0.5 text-[11px] text-slate-600">{footerDescription}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <button onClick={isPlaying ? handlePause : handlePlay} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>

          <button onClick={handleStep} disabled={isLastStep} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-35">
            <SkipForward className="h-4 w-4" />
          </button>

          <button onClick={handleReset} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100">
            <RotateCcw className="h-4 w-4" />
          </button>

          <div className="ml-2 flex flex-1 items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-slate-500" />
            <input
              type="range"
              min={200}
              max={2200}
              step={100}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="h-1 flex-1 accent-violet-600"
            />
            <span className="w-[56px] text-[10px] text-slate-600">{speed}ms</span>
          </div>

          <span className="font-mono text-[11px] text-slate-500">{currentStep + 1}/{totalSteps}</span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%`, backgroundColor: phaseColor }}
          />
        </div>

        {isLastStep && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <div className={`rounded-lg px-5 py-2 text-sm font-bold text-white ${data.measurement.classification === 'CONSTANT' ? 'bg-blue-600' : 'bg-orange-600'}`}>
              {data.measurement.classification}
            </div>

            <div className="flex flex-wrap gap-1">
              {Object.entries(data.measurement.counts).map(([state, count]) => (
                <span key={state} className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px]">
                  |{state}{'>'}:{count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
