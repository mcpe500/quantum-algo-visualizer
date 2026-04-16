import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Eye, EyeOff, Gauge, Lock, Move3D, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { DJAnimationPayload, DJQuantumTrace, DJTraceStage } from '../../types/dj';

interface DJQuantumAnimationProps {
  data: DJAnimationPayload;
  trace: DJQuantumTrace;
}

type ZoneKey = 'input' | 'superposition' | 'oracle' | 'interference' | 'output';

const ZONES: Array<{ key: ZoneKey; label: string; x: number; color: string }> = [
  { key: 'input', label: 'INPUT', x: -7.8, color: '#2563EB' },
  { key: 'superposition', label: 'SUPERPOSITION', x: -3.7, color: '#10B981' },
  { key: 'oracle', label: 'ORACLE', x: 0.2, color: '#F59E0B' },
  { key: 'interference', label: 'INTERFERENCE', x: 4.1, color: '#8B5CF6' },
  { key: 'output', label: 'OUTPUT', x: 8.2, color: '#EF4444' },
];

const PHASE_LABEL: Record<string, string> = {
  init: 'Inisialisasi',
  prep: 'Superposisi',
  oracle: 'Oracle',
  interference: 'Interferensi',
  measure: 'Measurement',
};

const PHASE_TO_ZONE: Record<string, ZoneKey> = {
  init: 'input',
  prep: 'superposition',
  oracle: 'oracle',
  interference: 'interference',
  measure: 'output',
};

const MARKER_STYLE: Record<string, string> = {
  H: 'bg-blue-100 text-blue-700 border-blue-300',
  X: 'bg-red-100 text-red-700 border-red-300',
  M: 'bg-slate-100 text-slate-700 border-slate-300',
  P: 'bg-amber-100 text-amber-700 border-amber-300',
  S: 'bg-violet-100 text-violet-700 border-violet-300',
  '●': 'bg-violet-200 text-violet-800 border-violet-400',
  '⊕': 'bg-amber-200 text-amber-800 border-amber-400',
  '-': 'bg-slate-50 text-slate-300 border-slate-200',
};

function zoneX(key: ZoneKey): number {
  return ZONES.find((zone) => zone.key === key)?.x ?? 0;
}

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

function CameraRig({ mode }: { mode: 'fixed' | 'orbit' }) {
  const { camera } = useThree();

  useEffect(() => {
    if (mode === 'fixed') {
      camera.position.set(0, 0, 18.5);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(2.4, 1.8, 15.5);
      camera.lookAt(0, 0, 0);
    }
    camera.updateProjectionMatrix();
  }, [camera, mode]);

  return null;
}

function ZonePanels({ activeZone, laneHeight, showOutput }: {
  activeZone: ZoneKey;
  laneHeight: number;
  showOutput: boolean;
}) {
  return (
    <group>
      {ZONES.map((zone) => {
        const active = zone.key === activeZone || (showOutput && zone.key === 'output');
        return (
          <group key={zone.key} position={[zone.x, 0, -0.7]}>
            <mesh>
              <planeGeometry args={[2.75, laneHeight + 2.45]} />
              <meshStandardMaterial
                color={active ? zone.color : '#E2E8F0'}
                transparent
                opacity={active ? 0.18 : 0.08}
              />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.PlaneGeometry(2.75, laneHeight + 2.45)]} />
              <lineBasicMaterial color={active ? zone.color : '#CBD5E1'} transparent opacity={0.55} />
            </lineSegments>
            <Text
              position={[0, laneHeight / 2 + 1.45, 0.05]}
              fontSize={0.26}
              color={active ? zone.color : '#94A3B8'}
              anchorX="center"
              anchorY="middle"
            >
              {zone.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function LaneGrid({ laneYs, labels }: { laneYs: number[]; labels: string[] }) {
  return (
    <group>
      {laneYs.map((y, i) => (
        <Line
          key={`lane-${labels[i]}`}
          points={[
            [-9.3, y, 0],
            [9.3, y, 0],
          ]}
          color="#94A3B8"
          transparent
          opacity={0.52}
          lineWidth={1}
        />
      ))}

      {laneYs.map((y, i) => (
        <Text
          key={`lane-label-${labels[i]}`}
          position={[-10.15, y, 0.12]}
          fontSize={0.25}
          color="#475569"
          anchorX="right"
          anchorY="middle"
        >
          {labels[i]}
        </Text>
      ))}
    </group>
  );
}

function QubitOrbNode({
  label,
  y,
  pOne,
  targetX,
  ringColor,
}: {
  label: string;
  y: number;
  pOne: number;
  targetX: number;
  ringColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isZero = pOne < 0.15;
  const isOne = pOne > 0.85;
  const isSuper = !isZero && !isOne;
  const color = isSuper ? '#8B5CF6' : isOne ? '#F97316' : '#2563EB';
  const stateText = isSuper ? '0|1' : isOne ? '1' : '0';

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 5.6);
    groupRef.current.position.y = y + (isSuper ? Math.sin(state.clock.elapsedTime * 2.4 + y) * 0.05 : 0);
  });

  return (
    <group ref={groupRef} position={[targetX, y, 0.1]}>
      <mesh>
        <sphereGeometry args={[0.72, 52, 52]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSuper ? 0.34 : 0.22}
          roughness={0.24}
          metalness={0.03}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.87, 0.03, 16, 96]} />
        <meshStandardMaterial color={ringColor} emissive={ringColor} emissiveIntensity={0.25} />
      </mesh>

      <Text
        position={[0, 0, 0.84]}
        fontSize={0.3}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
      >
        {stateText}
      </Text>

      <Text
        position={[0, -1.03, 0.05]}
        fontSize={0.2}
        color="#334155"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

function OracleChamber({ visible, laneHeight }: { visible: boolean; laneHeight: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!visible) return;
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.55;
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.8;
      coreRef.current.rotation.y += delta * 1.05;
    }
  });

  return (
    <group visible={visible} position={[zoneX('oracle'), 0, 0.18]}>
      <mesh>
        <boxGeometry args={[2.35, laneHeight + 1.0, 1.3]} />
        <meshStandardMaterial color="#FEF3C7" transparent opacity={0.28} roughness={0.3} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.35, laneHeight + 1.0, 1.3)]} />
        <lineBasicMaterial color="#F59E0B" transparent opacity={0.92} />
      </lineSegments>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.76, 0.06, 16, 72]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.35} />
      </mesh>
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.42} wireframe />
      </mesh>
    </group>
  );
}

type OracleToken = {
  input: string;
  output: number;
};

function TokenCard3D({ token, index, zone }: { token: OracleToken; index: number; zone: ZoneKey }) {
  const groupRef = useRef<THREE.Group>(null);
  const totalCols = 4;
  const col = index % totalCols;
  const row = Math.floor(index / totalCols);
  const startY = 4.1 - row * 0.6;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    let targetX = zoneX('input') - 0.9 + col * 0.62;
    let targetY = startY;
    let targetZ = 0.95;

    if (zone === 'superposition') {
      targetX = zoneX('superposition') - 0.8 + col * 0.55;
      targetY = startY + Math.sin(t * 2 + index) * 0.14;
    } else if (zone === 'oracle') {
      targetX = zoneX('oracle') - 0.8 + col * 0.55;
      targetY = startY - 0.2 + Math.cos(t * 2.2 + index) * 0.08;
    } else if (zone === 'interference') {
      targetX = zoneX('interference') - 0.65 + col * 0.5;
      targetY = startY - 0.35;
      targetZ = 0.8;
    }

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 5);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 5);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, delta * 5);
  });

  return (
    <group ref={groupRef} position={[zoneX('input'), startY, 0.95]}>
      <mesh>
        <boxGeometry args={[0.95, 0.36, 0.12]} />
        <meshStandardMaterial
          color={token.output === 1 ? '#FEE2E2' : '#DBEAFE'}
          emissive={token.output === 1 ? '#FCA5A5' : '#93C5FD'}
          emissiveIntensity={0.15}
          roughness={0.28}
        />
      </mesh>
      <Text
        position={[0, 0.02, 0.07]}
        fontSize={0.12}
        color={token.output === 1 ? '#B91C1C' : '#1D4ED8'}
        anchorX="center"
        anchorY="middle"
      >
        {token.input}
      </Text>
      <Text
        position={[0.31, -0.11, 0.07]}
        fontSize={0.08}
        color="#475569"
        anchorX="center"
        anchorY="middle"
      >
        out={token.output}
      </Text>
    </group>
  );
}

function OracleTokenRibbon({ truthTable, zone, visible }: {
  truthTable: OracleToken[];
  zone: ZoneKey;
  visible: boolean;
}) {
  const tokens = useMemo(() => truthTable.slice(0, 8), [truthTable]);

  if (!visible) return null;

  return (
    <group>
      {tokens.map((token, index) => (
        <TokenCard3D key={`${token.input}-${index}`} token={token} index={index} zone={zone} />
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
    <group ref={groupRef} position={[zoneX('output'), 0, 0.24]} scale={[0.001, 0.001, 0.001]}>
      <mesh>
        <planeGeometry args={[2.5, 2.1]} />
        <meshStandardMaterial color={isConstant ? '#DBEAFE' : '#FFEDD5'} transparent opacity={0.95} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.5, 2.1)]} />
        <lineBasicMaterial color={isConstant ? '#2563EB' : '#EA580C'} />
      </lineSegments>
      <Text
        position={[0, 0.34, 0.06]}
        fontSize={0.32}
        color={isConstant ? '#1D4ED8' : '#C2410C'}
        anchorX="center"
        anchorY="middle"
      >
        {classification}
      </Text>
      <Text
        position={[0, -0.34, 0.06]}
        fontSize={0.14}
        color="#334155"
        maxWidth={2.05}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
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
  const storyZone = PHASE_TO_ZONE[storyPhase] || 'input';
  const showResult = currentStep >= snapshots.length - 1;
  const panelZone = showResult ? 'output' : storyZone;
  const orbZone = storyZone;

  const laneYs = useMemo(() => getLaneYs(n_qubits), [n_qubits]);
  const laneLabels = useMemo(
    () => [...Array.from({ length: n_qubits }, (_, i) => `q${i}`), 'anc'],
    [n_qubits]
  );
  const laneHeight = Math.abs(laneYs[0] - laneYs[laneYs.length - 1]);

  const qubitStates = useMemo(() => {
    const probs = snapshot?.probabilities || [];
    const labels = snapshot?.labels || [];
    const totalQubits = n_qubits + 1;
    return Array.from({ length: totalQubits }, (_, i) => getQubitP1(probs, labels, i, totalQubits));
  }, [n_qubits, snapshot?.labels, snapshot?.probabilities]);

  const ringColor = ZONES.find((zone) => zone.key === panelZone)?.color || '#2563EB';

  return (
    <>
      <CameraRig mode={cameraMode} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 7, 7]} intensity={0.65} />
      <directionalLight position={[-5, 2, 5]} intensity={0.35} color="#BFDBFE" />

      <OrbitControls
        enabled={cameraMode === 'orbit'}
        enablePan={false}
        enableZoom
        minDistance={10}
        maxDistance={22}
        minPolarAngle={Math.PI * 0.33}
        maxPolarAngle={Math.PI * 0.65}
      />

      <ZonePanels activeZone={panelZone} laneHeight={laneHeight} showOutput={showResult} />
      <LaneGrid laneYs={laneYs} labels={laneLabels} />

      {qubitStates.map((pOne, i) => (
        <QubitOrbNode
          key={`orb-${laneLabels[i]}`}
          label={laneLabels[i]}
          y={laneYs[i]}
          pOne={pOne}
          targetX={zoneX(orbZone)}
          ringColor={ringColor}
        />
      ))}

      <OracleChamber visible={storyZone === 'oracle'} laneHeight={laneHeight} />
      <OracleTokenRibbon truthTable={truthTable} zone={storyZone} visible={showTokens && storyZone !== 'output'} />
      <ResultBoard classification={measurement.classification} visible={showResult} />

      <Text
        position={[0, laneHeight / 2 + 2.05, 0.3]}
        fontSize={0.34}
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

function StageCard({ stage, nQubits, active }: { stage: DJTraceStage; nQubits: number; active: boolean }) {
  const labels = useMemo(
    () => [...Array.from({ length: nQubits }, (_, i) => `q${i}`), 'anc'],
    [nQubits]
  );

  return (
    <div className={`min-w-[176px] rounded-lg border p-3 ${active ? 'border-violet-400 bg-violet-50 shadow-sm' : 'border-slate-200 bg-white'}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Step {stage.step}</p>
      <p className="mt-1 text-[12px] font-semibold text-slate-800 leading-snug">{stage.operation}</p>
      <div className="mt-3 space-y-1.5">
        {labels.map((label, idx) => {
          const marker = idx === nQubits ? stage.ancilla_marker : stage.wire_markers[String(idx)] || '-';
          return (
            <div key={`${stage.step}-${label}`} className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-500">{label}</span>
              <MarkerBadge marker={marker} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GateTimeline({
  trace,
  activePhase,
  nQubits,
}: {
  trace: DJQuantumTrace;
  activePhase: string;
  nQubits: number;
}) {
  const groups = useMemo(() => groupStagesByPhase(trace.stages), [trace.stages]);
  const activeGroup = groups.find((group) => group.phase === activePhase) || groups[0];

  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="grid gap-3 lg:grid-cols-[1.5fr,1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Gate dari Python</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">Fase aktif: {PHASE_LABEL[activePhase] || activePhase}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {activeGroup.items.map((stage) => (
              <span key={`active-op-${stage.step}`} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] text-violet-700">
                {stage.operation}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Legend</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
            <span><strong>Orb</strong> = state qubit</span>
            <span><strong>Timeline</strong> = gate asli Python</span>
            <span><strong>0 / 1 / 0|1</strong> = state orb</span>
            <span><strong>Token data</strong> = input oracle opsional</span>
          </div>
        </div>
      </div>

      {groups.map((group) => (
        <div key={`group-${group.phase}`} className={`rounded-xl border p-3 ${group.phase === activePhase ? 'border-violet-300 bg-violet-50/60' : 'border-slate-200 bg-slate-50/70'}`}>
          <div className="mb-3 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${group.phase === activePhase ? 'bg-violet-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {PHASE_LABEL[group.phase] || group.phase}
            </span>
            <span className="text-[11px] text-slate-500">{group.items.length} gate step</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {group.items.map((stage) => (
              <StageCard key={`stage-card-${stage.step}`} stage={stage} nQubits={nQubits} active={group.phase === activePhase} />
            ))}
          </div>
        </div>
      ))}
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
  const phaseColor = ZONES.find((zone) => zone.key === PHASE_TO_ZONE[activeGatePhase])?.color || '#2563EB';
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

      <GateTimeline trace={trace} activePhase={activeGatePhase} nQubits={data.n_qubits} />

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

      <div className="relative mx-4 rounded-xl border border-slate-300 overflow-hidden" style={{ height: '560px' }}>
        <Canvas
          camera={{ position: [0, 0, 18.5], fov: 34, near: 0.1, far: 100 }}
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
