import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ChevronRight, Gauge, LoaderCircle, Lock, Move3D, Pause, Play, RotateCcw, SkipForward, Video } from 'lucide-react';
import type { DJAnimationPayload, DJAnimationPartition, DJAnimationStep } from '../../types/dj';
import { downloadBlob } from '../../utils/download';
import { convertWebmToMp4, isFFmpegSupported } from '../../utils/videoConvert';

interface DJQuantumAnimationProps {
  data: DJAnimationPayload;
  onExportingChange?: (isExporting: boolean) => void;
}

const PHASE_COLOR: Record<string, string> = {
  'pre-init': '#94A3B8',
  init: '#2563EB',
  prep: '#10B981',
  oracle: '#F59E0B',
  interference: '#8B5CF6',
  measure: '#EF4444',
};

const PHASE_LABEL: Record<string, string> = {
  'pre-init': 'Keadaan Awal |0⟩',
  init: 'Inisialisasi Register',
  prep: 'Persiapan Ancilla',
  oracle: 'Oracle Nyata',
  interference: 'Interferensi',
  measure: 'Measurement',
};

const SCENE_PHASE_LABEL: Record<string, string> = {
  'pre-init': '|0⟩',
  init: 'Init',
  prep: 'Prep anc',
  oracle: 'Oracle',
  interference: 'H akhir',
  measure: 'Ukur',
};

const PROFILE_LABEL: Record<string, string> = {
  'constant-zero': 'CONSTANT 0',
  'constant-one': 'CONSTANT 1',
  balanced: 'BALANCED',
};

const MARKER_STYLE: Record<string, string> = {
  H: 'bg-blue-100 text-blue-700 border-blue-300',
  X: 'bg-rose-100 text-rose-700 border-rose-300',
  M: 'bg-slate-100 text-slate-700 border-slate-300',
  '●': 'bg-violet-100 text-violet-700 border-violet-300',
  '⊕': 'bg-amber-100 text-amber-700 border-amber-300',
  '-': 'bg-slate-50 text-slate-400 border-slate-200',
};

const EXPORT_FPS = 30;
const DEFAULT_STEP_MS = 1300;
const EXPORT_STEP_MS_MIN = 1400;
const EXPORT_INTRO_MS = 1600;
const EXPORT_OUTRO_MS = 2200;
const EXPORT_VIDEO_WIDTH = 1920;
const EXPORT_VIDEO_HEIGHT = 1080;
const EXPORT_VIDEO_BITRATE = 16_000_000;
const VIDEO_MIME_TYPES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
];

type ExportOverlayMode = 'intro' | 'play' | 'outro';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function waitForAnimationFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

async function waitForAnimationFrames(count = 2) {
  for (let index = 0; index < count; index += 1) {
    await waitForAnimationFrame();
  }
}

async function waitForCanvasReady(
  canvasRef: MutableRefObject<HTMLCanvasElement | null>,
  minWidth: number,
  minHeight: number,
  timeoutMs = 5000,
) {
  const start = performance.now();

  while (performance.now() - start < timeoutMs) {
    const canvas = canvasRef.current;
    if (canvas && canvas.width >= minWidth && canvas.height >= minHeight) {
      return canvas;
    }
    await waitForAnimationFrame();
  }

  throw new Error('Canvas export 1080p belum siap. Coba ulangi beberapa saat lagi.');
}

function getSupportedVideoMimeType() {
  if (typeof MediaRecorder === 'undefined') {
    return null;
  }

  if (typeof MediaRecorder.isTypeSupported !== 'function') {
    return VIDEO_MIME_TYPES[VIDEO_MIME_TYPES.length - 1];
  }

  return VIDEO_MIME_TYPES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? null;
}

function getLaneYs(nQubits: number) {
  const total = nQubits + 1;
  const gap = total >= 5 ? 1.38 : 1.52;
  return Array.from({ length: total }, (_, index) => ((total - 1) / 2 - index) * gap);
}

function getQubitP1(probs: number[], labels: string[], qubitIdx: number, totalQubits: number) {
  let p1 = 0;
  for (let index = 0; index < probs.length; index += 1) {
    const bits = labels[index];
    if (bits && bits[totalQubits - 1 - qubitIdx] === '1') {
      p1 += probs[index];
    }
  }
  return p1;
}

function getColumnLayout(stepCount: number) {
  const span = stepCount <= 10 ? 14 : stepCount <= 18 ? 18 : stepCount <= 26 ? 21 : 24;
  const startX = -span / 2;
  const endX = span / 2;
  const gap = stepCount > 1 ? span / (stepCount - 1) : 0;
  const columnXs = Array.from({ length: stepCount }, (_, index) => (stepCount === 1 ? 0 : startX + index * gap));
  return { startX, endX, gap, columnXs };
}

function formatPercent(value: number) {
  const percent = value * 100;
  if (percent >= 10) return `${percent.toFixed(1)}%`;
  return `${percent.toFixed(2)}%`;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const nextRadius = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + nextRadius, y);
  ctx.lineTo(x + width - nextRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + nextRadius);
  ctx.lineTo(x + width, y + height - nextRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - nextRadius, y + height);
  ctx.lineTo(x + nextRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - nextRadius);
  ctx.lineTo(x, y + nextRadius);
  ctx.quadraticCurveTo(x, y, x + nextRadius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate;
      continue;
    }
    lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function formatCountsSummary(counts: Record<string, number>) {
  return Object.entries(counts)
    .slice(0, 3)
    .map(([state, count]) => `|${state}>:${count}`)
    .join('   ');
}

function hasMarker(step: DJAnimationStep, marker: string, nQubits: number) {
  const wireHasMarker = Array.from({ length: nQubits }, (_, index) => step.wire_markers[String(index)] || '-')
    .some((value) => value === marker);
  return wireHasMarker || step.ancilla_marker === marker;
}

function getStepHeadline(step: DJAnimationStep) {
  if (step.phase === 'init') return 'Set register awal';
  if (step.phase === 'prep') {
    if (step.ancilla_marker === 'H') return 'Bentuk |−⟩ pada ancilla';
    return 'Masuk ke superposisi';
  }
  if (step.phase === 'oracle') {
    if (step.operation.toLowerCase().includes('flip') && step.focus_input_bits) {
      return `Siapkan kontrol untuk input ${step.focus_input_bits}`;
    }
    if (step.focus_input_bits) return `Terapkan oracle untuk input ${step.focus_input_bits}`;
    return 'Terapkan oracle';
  }
  if (step.phase === 'interference') return 'Gabungkan fase menjadi amplitudo';
  if (step.phase === 'measure') return 'Ukur qubit input';
  return step.operation;
}

function getStepExplanation(step: DJAnimationStep, totalSteps: number) {
  if (step.phase === 'init') {
    return 'Semua qubit mulai dari |0⟩ (vector menunjuk ke North Pole). Gerbang X merotasi ancilla 180° ke |1⟩. Gerbang H merotasi input qubits 90° ke bidang equator (superposisi).';
  }
  if (step.phase === 'prep') {
    if (step.ancilla_marker === 'H') {
      return 'Gerbang H pada ancilla merotasi 90° dari sumbu Z ke sumbu X negatif, membentuk |−⟩ = (|0⟩ − |1⟩)/√2. Vector ancilla sekarang menunjuk ke −X, siap untuk phase kickback.';
    }
    return 'Gerbang Hadamard (H) merotasi vector input 90° ke bidang equator, membentuk superposisi. Semua input diuji sekaligus dalam satu sirkuit.';
  }
  if (step.phase === 'oracle') {
    if (step.operation.toLowerCase().includes('flip') && step.focus_input_bits) {
      return `Gerbang X membalik qubit kontrol dari |0⟩ ke |1⟩ (rotasi 180°). Ini agar pola ${step.focus_input_bits} cocok dengan kondisi MCX yang membutuhkan semua kontrol = 1.`;
    }
    if ((step.operation.toLowerCase().includes('mcx') || step.operation.toLowerCase().includes('cnot')) && step.focus_input_bits) {
      return `MCX gate: semua qubit input = 1abelle menyebabkan phase kickback pada ancilla. Vector ancilla berputar 180° dalam φ. Ini adalah informasi quantum yang dikodekan dalam fase.`;
    }
    if (step.operation.toLowerCase().includes('restore') && step.focus_input_bits) {
      return `Gerbang X merestore qubit kontrol kembali ke |0⟩. Ini membalikkan rotasi 180° sebelumnya, mengembalikan vector ke posisi semula.`;
    }
    return step.description;
  }
  if (step.phase === 'interference') {
    return 'Hadamard akhir merotasi vector input qubits 90° kembali ke sumbu Z. Phase dari oracle menentukan apakah vector menunjuk ke |0⟩ atau |1⟩. Ini mengubah informasi fase menjadi amplitude terukur.';
  }
  if (step.phase === 'measure') {
    return 'Qubit input diukur. Jika semua vector menunjuk ke |0⟩ → CONSTANT. Jika ada vector menunjuk ke |1⟩ → BALANCED. Ini adalah pembacaan hasil akhir algoritma.';
  }
  return step.description || `Langkah ${step.step} dari ${totalSteps}.`;
}

function getStepAccent(step: DJAnimationStep, totalSteps: number) {
  if (step.phase === 'init') return 'Setiap qubit direpresentasikan sebagai Bloch sphere dengan vector yang menunjuk ke состояние quantum.';
  if (step.phase === 'prep') return 'Gerakan fokus pembacaan berpindah ke kolom aktif, bukan qubit berjalan secara fisik.';
  if (step.focus_input_bits) return `Pola dataset aktif: ${step.focus_input_bits}`;
  return `Langkah ${step.step} dari ${totalSteps}`;
}

function getContextGlossary(step: DJAnimationStep, nQubits: number) {
  const notes = [
    'Qubit = Bloch sphere dengan vector state.',
    'Gate menyala = operasi pada kolom itu sedang diterapkan.',
    'Ancilla = qubit bantu untuk phase kickback.',
    'Vector menunjuk ke состояние qubit pada sphere.',
  ];

  if (hasMarker(step, 'H', nQubits)) {
    notes.push('H = Hadamard, merotasi vector 90° untuk membentuk superposisi.');
  }

  if (step.phase === 'prep' && step.ancilla_marker === 'H') {
    notes.push('|−⟩ = (|0⟩ − |1⟩)/√2, vector menunjuk ke −X.');
  }

  if (hasMarker(step, '●', nQubits)) {
    notes.push('● = qubit control yang harus aktif.');
  }

  if (hasMarker(step, '⊕', nQubits)) {
    notes.push('⊕ = target X, biasanya di ancilla.');
  }

  if (step.operation.toLowerCase().includes('mcx') || (hasMarker(step, '●', nQubits) && hasMarker(step, '⊕', nQubits))) {
    notes.push('MCX = multi-controlled X gate.');
  }

  if (step.phase === 'interference') {
    notes.push('H akhir merotasi vector input 90° untuk memisahkan fase.');
  }

  return Array.from(new Set(notes)).slice(0, 6);
}

function getExportNarration(mode: ExportOverlayMode, data: DJAnimationPayload, step: DJAnimationStep) {
  if (mode === 'intro') {
    return {
      headline: 'Cara baca animasi Deutsch-Jozsa',
      detail: 'Setiap qubit direpresentasikan sebagai Bloch sphere. Vector panah menunjuk ke состояние quantum aktual. 1 kolom = 1 operasi sirkuit.',
      accent: 'Gate atau kolom yang menyala berarti operasi sedang diterapkan pada vector qubit.',
    };
  }

  if (mode === 'outro') {
    return {
      headline: `Hasil akhir: ${data.measurement.classification}`,
      detail: data.measurement.classification === 'CONSTANT'
        ? 'Semua qubit input kembali ke 0. Ini berarti oracle memperlakukan semua input secara seragam.'
        : 'Muncul bit input non-zero. Ini berarti oracle memberi pola fase berbeda untuk sebagian input.',
      accent: formatCountsSummary(data.measurement.counts),
    };
  }

  return {
    headline: `${PHASE_LABEL[step.phase] || step.phase} · ${getStepHeadline(step)}`,
    detail: getStepExplanation(step, data.timeline.length),
    accent: getStepAccent(step, data.timeline.length),
  };
}

function drawLegendPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  fill: string,
  textColor = '#E2E8F0',
) {
  ctx.font = '600 13px Inter, Segoe UI, Arial, sans-serif';
  const width = ctx.measureText(label).width + 26;
  roundedRect(ctx, x, y, width, 28, 999);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.fillText(label, x + 13, y + 19);
  return width;
}

function drawVideoFrame({
  ctx,
  sourceCanvas,
  data,
  mode,
  step,
  phaseColor,
}: {
  ctx: CanvasRenderingContext2D;
  sourceCanvas: HTMLCanvasElement;
  data: DJAnimationPayload;
  mode: ExportOverlayMode;
  step: DJAnimationStep;
  phaseColor: string;
}) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const narration = getExportNarration(mode, data, step);
  const overlayPadding = Math.round(width * 0.038);
  const bottomPanelHeight = Math.round(height * 0.23);
  const topPanelHeight = Math.round(height * 0.15);
  const topY = overlayPadding;
  const bottomY = height - bottomPanelHeight - overlayPadding;
  const bodyMaxWidth = width - overlayPadding * 2 - 32;

  const baseGradient = ctx.createLinearGradient(0, 0, 0, height);
  baseGradient.addColorStop(0, '#F8FAFC');
  baseGradient.addColorStop(1, '#E2E8F0');

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, width, height);

  const topGradient = ctx.createLinearGradient(0, 0, 0, topPanelHeight + overlayPadding * 1.5);
  topGradient.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
  topGradient.addColorStop(1, 'rgba(15, 23, 42, 0.18)');
  ctx.fillStyle = topGradient;
  ctx.fillRect(0, 0, width, topPanelHeight + overlayPadding * 1.5);

  const bottomGradient = ctx.createLinearGradient(0, height, 0, height - bottomPanelHeight - overlayPadding * 2);
  bottomGradient.addColorStop(0, 'rgba(15, 23, 42, 0.94)');
  bottomGradient.addColorStop(1, 'rgba(15, 23, 42, 0.2)');
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(0, bottomY - overlayPadding, width, bottomPanelHeight + overlayPadding * 2);

  roundedRect(ctx, overlayPadding, topY, width - overlayPadding * 2, topPanelHeight, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();

  roundedRect(ctx, overlayPadding, bottomY, width - overlayPadding * 2, bottomPanelHeight, 24);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '600 18px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText('VIDEO QUANTUM', overlayPadding + 28, topY + 32);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 30px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText(`Deutsch-Jozsa · ${data.case_id}`, overlayPadding + 28, topY + 68);

  let legendX = overlayPadding + 28;
  const legendY = topY + 88;
  legendX += drawLegendPill(ctx, legendX, legendY, 'Qubit = Bloch sphere', 'rgba(139, 92, 246, 0.20)') + 10;
  legendX += drawLegendPill(ctx, legendX, legendY, 'Gate terang = langkah aktif', 'rgba(59, 130, 246, 0.16)') + 10;
  legendX += drawLegendPill(ctx, legendX, legendY, 'Ancilla = qubit bantu', 'rgba(16, 185, 129, 0.16)') + 10;
  drawLegendPill(ctx, legendX, legendY, '● control / ⊕ target', 'rgba(245, 158, 11, 0.16)');

  roundedRect(ctx, width - overlayPadding - 250, topY + 22, 222, 44, 999);
  ctx.fillStyle = `${phaseColor}55`;
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 17px Inter, Segoe UI, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(PHASE_LABEL[step.phase] || step.phase, width - overlayPadding - 139, topY + 50);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '600 16px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText(`Step ${step.step}/${data.timeline.length}`, overlayPadding + 28, bottomY + 34);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 28px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText(narration.headline, overlayPadding + 28, bottomY + 76);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '500 19px Inter, Segoe UI, Arial, sans-serif';
  const bodyLines = wrapText(ctx, narration.detail, bodyMaxWidth).slice(0, 3);
  bodyLines.forEach((line, index) => {
    ctx.fillText(line, overlayPadding + 28, bottomY + 114 + index * 28);
  });

  ctx.fillStyle = phaseColor;
  ctx.font = '600 17px Inter, Segoe UI, Arial, sans-serif';
  ctx.fillText(narration.accent, overlayPadding + 28, bottomY + bottomPanelHeight - 20);
}

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

function GateTile({
  x,
  y,
  label,
  color,
  size,
  active,
}: {
  x: number;
  y: number;
  label: string;
  color: string;
  size: number;
  active: boolean;
}) {
  return (
    <group position={[x, y, 0.08]}>
      <mesh>
        <boxGeometry args={[size, size, 0.24]} />
        <meshStandardMaterial color={color} transparent opacity={active ? 0.36 : 0.18} roughness={0.18} metalness={0.18} />
      </mesh>
      <mesh>
        <boxGeometry args={[size, size, 0.24]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={active ? 0.8 : 0.4} />
      </mesh>
      <Text position={[0, 0, 0.13]} fontSize={size * 0.35} color={active ? '#0F172A' : '#475569'} anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

function ControlDot({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <mesh position={[x, y, 0.1]}>
      <sphereGeometry args={[active ? 0.18 : 0.14, 18, 18]} />
      <meshStandardMaterial color="#7C3AED" emissive="#7C3AED" emissiveIntensity={active ? 0.35 : 0.1} />
    </mesh>
  );
}

function TargetMarker({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <group position={[x, y, 0.1]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.02, 12, 48]} />
        <meshStandardMaterial color="#D97706" emissive="#D97706" emissiveIntensity={active ? 0.32 : 0.08} />
      </mesh>
      <Line points={[[0, -0.18, 0.04], [0, 0.18, 0.04]]} color="#D97706" lineWidth={1.2} />
      <Line points={[[(-0.18), 0, 0.04], [0.18, 0, 0.04]]} color="#D97706" lineWidth={1.2} />
    </group>
  );
}

function StageColumn({
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
        if (marker === 'H') return <GateTile key={`${step.step}-${index}-H`} x={x} y={y} label="H" color="#2563EB" size={plateSize} active={active} />;
        if (marker === 'X') return <GateTile key={`${step.step}-${index}-X`} x={x} y={y} label="X" color="#E11D48" size={plateSize} active={active} />;
        if (marker === 'M') return <GateTile key={`${step.step}-${index}-M`} x={x} y={y} label="M" color="#475569" size={plateSize} active={active || isFinalMeasure} />;
        if (marker === '●') return <ControlDot key={`${step.step}-${index}-dot`} x={x} y={y} active={active} />;
        if (marker === '⊕') return <TargetMarker key={`${step.step}-${index}-target`} x={x} y={y} active={active} />;
        return null;
      })}
    </group>
  );
}

function BlochSphereNode({
  y,
  targetX,
  phaseColor,
  blochState,
}: {
  y: number;
  targetX: number;
  phaseColor: string;
  blochState: { bx: number; by: number; bz: number; label: string };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const arrowRef = useRef<THREE.Group>(null);
  const currentDirRef = useRef(new THREE.Vector3(0, 1, 0));

  const { bx, by, bz, label } = blochState;

  const isZero = Math.abs(bz - 1) < 0.05;
  const isOne = Math.abs(bz + 1) < 0.05;
  const isSuper = !isZero && !isOne;
  const color = isSuper ? '#8B5CF6' : isOne ? '#F97316' : '#2563EB';

  const targetDir = new THREE.Vector3(bx, bz, by);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, delta * 4.4);
    const bob = isSuper ? Math.sin(state.clock.elapsedTime * 2.4 + y) * 0.07 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, y + bob, delta * 5.5);

    if (matRef.current) {
      const target = new THREE.Color(color);
      matRef.current.color.lerp(target, delta * 4.6);
      matRef.current.emissive.lerp(target, delta * 3.8);
      matRef.current.emissiveIntensity += (((isSuper ? 0.48 : 0.15)) - matRef.current.emissiveIntensity) * delta * 4;
      matRef.current.opacity += (((isSuper ? 0.68 : 0.96)) - matRef.current.opacity) * delta * 4;
      matRef.current.wireframe = isSuper;
    }

    if (arrowRef.current) {
      currentDirRef.current.lerp(targetDir, delta * 4.0);
      currentDirRef.current.normalize();
      arrowRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), currentDirRef.current);
    }
  });

  return (
    <group ref={groupRef} position={[targetX, y, 0.32]}>
      <mesh>
        <sphereGeometry args={[0.38, 26, 26]} />
        <meshStandardMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={isSuper ? 0.48 : 0.15} transparent opacity={isSuper ? 0.68 : 0.96} wireframe={isSuper} roughness={0.24} metalness={0.18} />
      </mesh>

      <mesh ref={arrowRef} position={[0, 0, 0]}>
        <group>
          <mesh position={[0, 0.22, 0]}>
            <coneGeometry args={[0.055, 0.14, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.16, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
          </mesh>
        </group>
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.025, 12, 48]} />
        <meshStandardMaterial color={phaseColor} emissive={phaseColor} emissiveIntensity={0.22} />
      </mesh>

      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>

      <Text position={[0, -0.52, 0]} fontSize={0.16} color={color} anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

function ResultBoard({ x, classification, visible }: { x: number; classification: 'CONSTANT' | 'BALANCED'; visible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const isConstant = classification === 'CONSTANT';

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const scale = visible ? 1 : 0.001;
    groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, scale, delta * 5);
    groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, scale, delta * 5);
    groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, scale, delta * 5);
  });

  return (
    <group ref={groupRef} position={[x, 0, 0.18]} scale={[0.001, 0.001, 0.001]}>
      <mesh>
        <planeGeometry args={[2.6, 1.9]} />
        <meshStandardMaterial color={isConstant ? '#DBEAFE' : '#FFEDD5'} transparent opacity={0.96} />
      </mesh>
      <Text position={[0, 0.32, 0.04]} fontSize={0.28} color={isConstant ? '#1D4ED8' : '#C2410C'} anchorX="center" anchorY="middle">
        {classification}
      </Text>
      <Text position={[0, -0.18, 0.04]} fontSize={0.13} color="#334155" anchorX="center" anchorY="middle" maxWidth={2.1} textAlign="center">
        {isConstant ? 'Semua bit input kembali ke 0.' : 'Ada bit input non-zero setelah interferensi.'}
      </Text>
    </group>
  );
}

function StoryScene({
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

      {data.partitions.map((partition) => {
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
        // const sphereOffset = currentStep === 0 ? 0 : Math.min(gap * 0.35, 0.6);
        const sphereOffset = 0;
        return (
          <BlochSphereNode
            key={`orb-${index}`}
            y={laneYs[index]}
            targetX={columnXs[currentStep] + sphereOffset}
            phaseColor={phaseColor}
            blochState={
              blochStates && blochStates[index]
                ? blochStates[index]
                : { bx: 0, by: 0, bz: pOne < 0.15 ? 1 : pOne > 0.85 ? -1 : 0, label: pOne < 0.15 ? '|0⟩' : pOne > 0.85 ? '|1⟩' : '0|1' }
            }
          />
        );
      })}

      <ResultBoard x={resultX} classification={data.measurement.classification} visible={showResult} />
    </>
  );
}

function MarkerBadge({ marker }: { marker: string }) {
  const value = marker || '-';
  const classes = MARKER_STYLE[value] || 'bg-slate-50 text-slate-400 border-slate-200';
  return <span className={`inline-flex min-w-8 justify-center rounded border px-1.5 py-0.5 font-mono text-[11px] ${classes}`}>{value}</span>;
}

function PhaseStepper({
  partitions,
  activePhase,
  activeStep,
  onJumpPhase,
  disabled,
}: {
  partitions: DJAnimationPartition[];
  activePhase: string;
  activeStep: DJAnimationStep;
  onJumpPhase: (phase: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="px-4 pb-4 pt-2 space-y-2">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {partitions.map((partition, index) => {
          const isActive = partition.phase === activePhase;
          return (
            <div key={`${partition.phase}-${partition.start_col}`} className="flex items-center gap-1.5 shrink-0">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
              <button
                onClick={() => onJumpPhase(partition.phase)}
                disabled={disabled}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                  isActive
                    ? 'border-violet-400 bg-violet-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {PHASE_LABEL[partition.phase] || partition.label}
                <span className="ml-1 opacity-80">({partition.count})</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Active Column</p>
        <p className="mt-1 text-[15px] font-semibold text-slate-900">Step {activeStep.step} · {activeStep.operation}</p>
        <p className="mt-1 text-[13px] leading-6 text-slate-600">{activeStep.description}</p>
      </div>
    </div>
  );
}

function ActiveMarkerStrip({ step, nQubits }: { step: DJAnimationStep; nQubits: number }) {
  const labels = [...Array.from({ length: nQubits }, (_, index) => `q${index}`), 'ancilla'];

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {labels.map((label, index) => {
        const marker = index === nQubits ? step.ancilla_marker : step.wire_markers[String(index)] || '-';
        return (
          <span key={`${label}-${marker}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
            <span className="text-[11px] font-medium text-slate-500">{label}</span>
            <MarkerBadge marker={marker} />
          </span>
        );
      })}
    </div>
  );
}

function ReadingGuideCard({ step, nQubits }: { step: DJAnimationStep; nQubits: number }) {
  const notes = getContextGlossary(step, nQubits);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cara Baca Animasi</p>
      <p className="mt-2 text-[16px] font-semibold text-slate-900">{getStepHeadline(step)}</p>
      <p className="mt-2 text-[14px] leading-7 text-slate-600">{getStepExplanation(step, step.step)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {notes.map((note) => (
          <span key={note} className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] leading-5 text-slate-600">
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}

function DetailCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-[16px] font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-[12px] leading-5 text-slate-600">{hint}</p>
    </div>
  );
}

function TruthTablePanel({
  data,
  activeBits,
}: {
  data: DJAnimationPayload;
  activeBits: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Dataset JSON Render</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <DetailCard label="Profil" value={PROFILE_LABEL[data.oracle_summary.profile]} hint="Diambil langsung dari sebaran 0 dan 1 pada truth table." />
        <DetailCard label="Truth Table" value={`${data.oracle_summary.total_inputs} input`} hint={`1 sebanyak ${data.oracle_summary.ones_count}, 0 sebanyak ${data.oracle_summary.zeros_count}.`} />
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
        <div className="grid grid-cols-[1fr_72px_88px] gap-2 border-b border-slate-200 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span>Input</span>
          <span>f(x)</span>
          <span>Status</span>
        </div>
        <div className="max-h-[340px] overflow-auto px-2 py-2">
          {data.truth_table.map((entry) => {
            const isActive = activeBits === entry.input;
            return (
              <div
                key={entry.input}
                className={`grid grid-cols-[1fr_72px_88px] items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors ${
                  isActive
                    ? 'bg-violet-100 ring-1 ring-violet-300'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <span className="font-mono font-semibold tracking-[0.2em] text-slate-800">{entry.input}</span>
                <span className={`inline-flex w-fit rounded-full px-2 py-1 text-[12px] font-semibold ${entry.output === 1 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                  {entry.output}
                </span>
                <span className="text-[12px] text-slate-500">{isActive ? 'sedang dipakai' : 'dataset'}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FinalAmplitudePanel({ data }: { data: DJAnimationPayload }) {
  const topStates = [...data.input_probabilities]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 6);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Distribusi Input Setelah Interferensi</p>
      <div className="mt-3 space-y-2">
        {topStates.map((entry) => (
          <div key={entry.input_bits}>
            <div className="flex items-center justify-between text-[13px] text-slate-700">
              <span className="font-mono font-semibold tracking-[0.18em]">{entry.input_bits}</span>
              <span>{formatPercent(entry.probability)}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(entry.probability * 100, 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MeasurementPanel({ data }: { data: DJAnimationPayload }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Measurement Nyata</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1.5 text-[13px] font-semibold text-white ${data.measurement.classification === 'CONSTANT' ? 'bg-blue-600' : 'bg-orange-600'}`}>
          {data.measurement.classification}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] text-slate-600">{data.measurement.shots} shots</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(data.measurement.counts).map(([state, count]) => (
          <span key={state} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[12px] text-slate-700">
            |{state}⟩ : {count}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DJQuantumAnimation({ data, onExportingChange }: DJQuantumAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_STEP_MS);
  const [cameraMode, setCameraMode] = useState<'fixed' | 'orbit'>('fixed');
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentStepRef = useRef(currentStep);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const exportRendererCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const exportAnimationFrameRef = useRef<number | null>(null);

  const totalSteps = data.timeline.length;
  const activeStep = data.timeline[currentStep];
  const activePhase = activeStep.phase;
  const phaseColor = PHASE_COLOR[activePhase] || '#2563EB';
  const isLastStep = currentStep >= totalSteps - 1;
  const canvasHeight = data.n_qubits >= 4 || totalSteps > 18 ? 560 : 520;
  const supportedVideoMimeType = useMemo(() => getSupportedVideoMimeType(), []);
  const ffmpegReady = useMemo(() => isFFmpegSupported(), []);

  const stopTimer = useCallback(() => {
    if (!timerRef.current) return;
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    onExportingChange?.(isExporting);
  }, [isExporting, onExportingChange]);

  useEffect(() => {
    return () => {
      onExportingChange?.(false);
    };
  }, [onExportingChange]);

  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      timerRef.current = setInterval(() => {
        setCurrentStep((previous) => {
          if (previous >= totalSteps - 1) {
            setIsPlaying(false);
            return previous;
          }
          return previous + 1;
        });
      }, speed);
    } else {
      stopTimer();
      if (currentStep >= totalSteps - 1) setIsPlaying(false);
    }

    return stopTimer;
  }, [currentStep, isPlaying, speed, stopTimer, totalSteps]);

  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    setExportError(null);
    stopTimer();
  }, [data.case_id, stopTimer]);

  useEffect(() => {
    return () => {
      stopTimer();
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
      }
    };
  }, [stopTimer]);

  const handlePlay = () => {
    if (isExporting) return;
    if (isLastStep) setCurrentStep(0);
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (isExporting) return;
    setIsPlaying(false);
    stopTimer();
  };

  const handleStep = () => {
    if (isExporting) return;
    setIsPlaying(false);
    stopTimer();
    setCurrentStep((previous) => Math.min(previous + 1, totalSteps - 1));
  };

  const handleReset = () => {
    if (isExporting) return;
    setIsPlaying(false);
    stopTimer();
    setCurrentStep(0);
  };

  const handleJumpPhase = useCallback((phase: string) => {
    if (isExporting) return;
    const index = data.timeline.findIndex((step) => step.phase === phase);
    if (index >= 0) {
      setCurrentStep(index);
      setIsPlaying(false);
      stopTimer();
    }
  }, [data.timeline, isExporting, stopTimer]);

  const handleExportVideo = useCallback(async () => {
    if (isExporting) return;

    if (!supportedVideoMimeType || typeof MediaRecorder === 'undefined') {
      setExportError('Browser ini belum mendukung export video WebM dari canvas. Gunakan Chrome, Edge, atau Firefox terbaru.');
      return;
    }

    const previousStep = currentStepRef.current;
    const previousSpeed = speedRef.current;
    const previousPlaying = isPlayingRef.current;
    const exportStepMs = Math.max(previousSpeed, EXPORT_STEP_MS_MIN);
    const compositorCanvas = document.createElement('canvas');
    const exportWidth = EXPORT_VIDEO_WIDTH;
    const exportHeight = EXPORT_VIDEO_HEIGHT;
    const compositorContext = compositorCanvas.getContext('2d', { alpha: false });

    if (!compositorContext) {
      setExportError('Gagal membuat canvas komposit untuk export video.');
      return;
    }

    compositorCanvas.width = exportWidth;
    compositorCanvas.height = exportHeight;

    let overlayMode: ExportOverlayMode = 'intro';
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let sourceCanvas: HTMLCanvasElement | null = null;
    const chunks: BlobPart[] = [];
    let cancelled = false;

    try {
      stream = compositorCanvas.captureStream(EXPORT_FPS);
      recorder = new MediaRecorder(stream, {
        mimeType: supportedVideoMimeType,
        videoBitsPerSecond: EXPORT_VIDEO_BITRATE,
      });
    } catch {
      setExportError('Recorder browser gagal diinisialisasi untuk export video WebM.');
      return;
    }

    const recorderPromise = new Promise<Blob>((resolve, reject) => {
      recorder!.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder!.onerror = () => {
        reject(new Error('Recorder browser gagal membuat video WebM.'));
      };

      recorder!.onstop = () => {
        resolve(new Blob(chunks, { type: supportedVideoMimeType }));
      };
    });

    const drawCompositeFrame = () => {
      if (cancelled) return;
      if (!sourceCanvas) {
        exportAnimationFrameRef.current = window.requestAnimationFrame(drawCompositeFrame);
        return;
      }
      const exportStep = data.timeline[currentStepRef.current] ?? data.timeline[0];
      const exportPhaseColor = PHASE_COLOR[exportStep.phase] || '#2563EB';

      drawVideoFrame({
        ctx: compositorContext,
        sourceCanvas,
        data,
        mode: overlayMode,
        step: exportStep,
        phaseColor: exportPhaseColor,
      });

      exportAnimationFrameRef.current = window.requestAnimationFrame(drawCompositeFrame);
    };

    setExportError(null);
    setIsExporting(true);

    try {
      stopTimer();
      setIsPlaying(false);
      setCurrentStep(0);
      setSpeed(exportStepMs);
      await waitForAnimationFrames(2);

      sourceCanvas = await waitForCanvasReady(
        exportRendererCanvasRef,
        EXPORT_VIDEO_WIDTH,
        EXPORT_VIDEO_HEIGHT,
      );
      await waitForAnimationFrames(3);

      drawCompositeFrame();
      recorder?.start(250);

      await wait(EXPORT_INTRO_MS);

      overlayMode = 'play';
      setCurrentStep(0);
      await waitForAnimationFrames(2);
      setIsPlaying(true);

      const playbackDurationMs = Math.max(totalSteps - 1, 0) * exportStepMs + Math.round(exportStepMs * 0.6);
      await wait(playbackDurationMs);

      setIsPlaying(false);
      stopTimer();
      setCurrentStep(totalSteps - 1);
      await waitForAnimationFrames(3);

      overlayMode = 'outro';
      await wait(EXPORT_OUTRO_MS);

      cancelled = true;
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
        exportAnimationFrameRef.current = null;
      }

      recorder?.stop();
      const videoBlob = await recorderPromise;
      downloadBlob(videoBlob, `dj_${data.case_id}_video-quantum.webm`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export video gagal dijalankan.');
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    } finally {
      cancelled = true;
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
        exportAnimationFrameRef.current = null;
      }
      stream?.getTracks().forEach((track) => track.stop());
      exportRendererCanvasRef.current = null;

      setSpeed(previousSpeed);
      setCurrentStep(previousStep);
      setIsPlaying(false);
      await waitForAnimationFrames(2);

      if (previousPlaying && previousStep < totalSteps - 1) {
        setIsPlaying(true);
      }

      setIsExporting(false);
    }
  }, [data, isExporting, stopTimer, supportedVideoMimeType, totalSteps]);

  const handleExportMp4 = useCallback(async () => {
    if (isExporting) return;

    if (!supportedVideoMimeType || typeof MediaRecorder === 'undefined') {
      setExportError('Browser ini belum mendukung perekaman video. Gunakan Chrome, Edge, atau Firefox terbaru.');
      return;
    }

    if (!ffmpegReady) {
      setExportError('Browser ini tidak mendukung konversi MP4 di sisi klien. Gunakan Chrome, Edge, atau Firefox terbaru.');
      return;
    }

    const previousStep = currentStepRef.current;
    const previousSpeed = speedRef.current;
    const previousPlaying = isPlayingRef.current;
    const exportStepMs = Math.max(previousSpeed, EXPORT_STEP_MS_MIN);
    const compositorCanvas = document.createElement('canvas');
    const exportWidth = EXPORT_VIDEO_WIDTH;
    const exportHeight = EXPORT_VIDEO_HEIGHT;
    const compositorContext = compositorCanvas.getContext('2d', { alpha: false });

    if (!compositorContext) {
      setExportError('Gagal membuat canvas komposit untuk export video.');
      return;
    }

    compositorCanvas.width = exportWidth;
    compositorCanvas.height = exportHeight;

    let overlayMode: ExportOverlayMode = 'intro';
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let sourceCanvas: HTMLCanvasElement | null = null;
    const chunks: BlobPart[] = [];
    let cancelled = false;

    try {
      stream = compositorCanvas.captureStream(EXPORT_FPS);
      recorder = new MediaRecorder(stream, {
        mimeType: supportedVideoMimeType,
        videoBitsPerSecond: EXPORT_VIDEO_BITRATE,
      });
    } catch {
      setExportError('Recorder browser gagal diinisialisasi.');
      return;
    }

    const recorderPromise = new Promise<Blob>((resolve, reject) => {
      recorder!.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder!.onerror = () => {
        reject(new Error('Recorder browser gagal merekam video.'));
      };

      recorder!.onstop = () => {
        resolve(new Blob(chunks, { type: supportedVideoMimeType }));
      };
    });

    const drawCompositeFrame = () => {
      if (cancelled) return;
      if (!sourceCanvas) {
        exportAnimationFrameRef.current = window.requestAnimationFrame(drawCompositeFrame);
        return;
      }
      const exportStep = data.timeline[currentStepRef.current] ?? data.timeline[0];
      const exportPhaseColor = PHASE_COLOR[exportStep.phase] || '#2563EB';

      drawVideoFrame({
        ctx: compositorContext,
        sourceCanvas,
        data,
        mode: overlayMode,
        step: exportStep,
        phaseColor: exportPhaseColor,
      });

      exportAnimationFrameRef.current = window.requestAnimationFrame(drawCompositeFrame);
    };

    setExportError(null);
    setIsExporting(true);
    setIsConverting(false);

    try {
      stopTimer();
      setIsPlaying(false);
      setCurrentStep(0);
      setSpeed(exportStepMs);
      await waitForAnimationFrames(2);

      sourceCanvas = await waitForCanvasReady(
        exportRendererCanvasRef,
        EXPORT_VIDEO_WIDTH,
        EXPORT_VIDEO_HEIGHT,
      );
      await waitForAnimationFrames(3);

      drawCompositeFrame();
      recorder?.start(250);

      await wait(EXPORT_INTRO_MS);

      overlayMode = 'play';
      setCurrentStep(0);
      await waitForAnimationFrames(2);
      setIsPlaying(true);

      const playbackDurationMs = Math.max(totalSteps - 1, 0) * exportStepMs + Math.round(exportStepMs * 0.6);
      await wait(playbackDurationMs);

      setIsPlaying(false);
      stopTimer();
      setCurrentStep(totalSteps - 1);
      await waitForAnimationFrames(3);

      overlayMode = 'outro';
      await wait(EXPORT_OUTRO_MS);

      cancelled = true;
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
        exportAnimationFrameRef.current = null;
      }

      recorder?.stop();
      const webmBlob = await recorderPromise;

      setIsConverting(true);
      const mp4Blob = await convertWebmToMp4(webmBlob);
      downloadBlob(mp4Blob, `dj_${data.case_id}_video-quantum.mp4`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export MP4 gagal. Pastikan menggunakan Chrome atau Edge terbaru.');
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop();
      }
    } finally {
      cancelled = true;
      if (exportAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(exportAnimationFrameRef.current);
        exportAnimationFrameRef.current = null;
      }
      stream?.getTracks().forEach((track) => track.stop());
      exportRendererCanvasRef.current = null;

      setSpeed(previousSpeed);
      setCurrentStep(previousStep);
      setIsPlaying(false);
      setIsConverting(false);
      await waitForAnimationFrames(2);

      if (previousPlaying && previousStep < totalSteps - 1) {
        setIsPlaying(true);
      }

      setIsExporting(false);
    }
  }, [data, isExporting, stopTimer, supportedVideoMimeType, totalSteps, ffmpegReady]);

  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-white overflow-hidden">
      <header className="px-5 pt-5 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Animasi Deutsch-Jozsa Three.js</p>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">{data.case_id} · circuit timeline dari dataset asli</h2>
            <p className="mt-2 text-[14px] leading-7 text-slate-600">
              Susunan kolom sirkuit dibangkitkan dari truth table JSON, trace kolom aktual, dan statevector tiap langkah. Tidak lagi memakai scaffold oracle tetap.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <DetailCard label="Qubit" value={`${data.total_qubits}`} hint={`${data.n_qubits} input + 1 ancilla`} />
            <DetailCard label="Kolom" value={`${totalSteps}`} hint="Setiap kolom = 1 langkah visual aktual." />
            <DetailCard label="Oracle 1" value={`${data.oracle_summary.ones_count}`} hint="Jumlah input yang memicu f(x)=1." />
            <DetailCard label="Shots" value={`${data.measurement.shots}`} hint="Hasil measurement backend nyata." />
          </div>
        </div>
      </header>

      <PhaseStepper partitions={data.partitions} activePhase={activePhase} activeStep={activeStep} onJumpPhase={handleJumpPhase} disabled={isExporting || isConverting} />

      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-600">
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-blue-500" />|0⟩ (North)</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-orange-500" />|1⟩ (South)</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-violet-500" />Superposisi</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-600" />MCX control</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />MCX target</span>
              </div>

              <button
                onClick={() => setCameraMode((previous) => (previous === 'fixed' ? 'orbit' : 'fixed'))}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {cameraMode === 'fixed' ? <Lock className="h-3.5 w-3.5" /> : <Move3D className="h-3.5 w-3.5" />}
                {cameraMode === 'fixed' ? 'Fixed Camera' : 'Orbit Camera'}
              </button>
            </div>

            <div className="relative border-t border-slate-200">
              <div className="absolute left-4 top-4 z-10">
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold shadow-sm"
                  style={{
                    backgroundColor: `${phaseColor}18`,
                    borderColor: `${phaseColor}55`,
                    color: phaseColor,
                  }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: phaseColor }} />
                  {PHASE_LABEL[activePhase] || activePhase}
                </div>
              </div>

              <div style={{ height: `${canvasHeight}px` }}>
                <Canvas
                  camera={{ position: [0, 0, 21.5], fov: 38, near: 0.1, far: 100 }}
                  style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
                  gl={{ antialias: true }}
                >
                  <StoryScene data={data} currentStep={currentStep} cameraMode={cameraMode} />
                </Canvas>
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">Gate Aktif</p>
              <p className="mt-1 text-[18px] font-semibold text-slate-900">Step {activeStep.step} · {activeStep.operation}</p>
              <p className="mt-2 text-[14px] leading-7 text-slate-600">{activeStep.description}</p>
              {activeStep.focus_input_bits && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[13px] text-violet-700">
                  <span className="font-semibold">Fokus dataset:</span>
                  <span className="font-mono tracking-[0.2em]">{activeStep.focus_input_bits}</span>
                </div>
              )}
              <ActiveMarkerStrip step={activeStep} nQubits={data.n_qubits} />
            </div>
          </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={isPlaying ? handlePause : handlePlay} disabled={isExporting} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-35">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                </button>

                <button onClick={handleStep} disabled={isLastStep || isExporting} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35">
                  <SkipForward className="h-4 w-4" />
                </button>

                <button onClick={handleReset} disabled={isExporting} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35">
                  <RotateCcw className="h-4 w-4" />
                </button>

                <div className="ml-1 flex min-w-[220px] flex-1 items-center gap-2">
                  <Gauge className="h-4 w-4 text-slate-500" />
                  <input type="range" min={250} max={2000} step={100} value={speed} disabled={isExporting} onChange={(event) => setSpeed(Number(event.target.value))} className="h-1.5 flex-1 accent-violet-600 disabled:cursor-not-allowed disabled:opacity-40" />
                  <span className="w-[62px] text-[11px] text-slate-600">{speed}ms</span>
                </div>

                <span className="font-mono text-[12px] text-slate-500">{currentStep + 1}/{totalSteps}</span>

                <button
                  onClick={handleExportVideo}
                  disabled={isExporting || !supportedVideoMimeType}
                  className="ml-auto inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-3.5 py-2 text-[12px] font-semibold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isExporting && !isConverting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  {isExporting && !isConverting ? 'Merekam...' : 'WebM 1080p'}
                </button>

                <button
                  onClick={handleExportMp4}
                  disabled={isExporting || !supportedVideoMimeType || !ffmpegReady}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isConverting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  {isConverting ? 'Mengkonversi ke MP4...' : 'MP4 1080p'}
                </button>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / totalSteps) * 100}%`, backgroundColor: phaseColor }} />
              </div>

              <div className="mt-3 flex flex-wrap items-start justify-between gap-3 text-[12px] leading-6 text-slate-500">
                <p>
                  WebM = instant. MP4 = rekam lalu konversi via FFmpeg.wasm (~5-15 detik). Keduanya merekam canvas 1920x1080.
                </p>
                {!supportedVideoMimeType && (
                  <p className="text-rose-600">
                    Browser belum mendukung export video. Gunakan Chrome, Edge, atau Firefox terbaru.
                  </p>
                )}
                {!ffmpegReady && (
                  <p className="text-amber-600">
                    MP4 tidak tersedia di browser ini. Gunakan browser modern yang mendukung WebAssembly + Worker.
                  </p>
                )}
                {exportError && (
                  <p className="text-rose-600">
                    {exportError}
                  </p>
                )}
              </div>
            </div>
        </div>

        <div className="space-y-4">
          <ReadingGuideCard step={activeStep} nQubits={data.n_qubits} />
          <TruthTablePanel data={data} activeBits={activeStep.focus_input_bits} />
          <FinalAmplitudePanel data={data} />
          <MeasurementPanel data={data} />
        </div>
      </div>

      {isExporting && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: '0',
            width: `${EXPORT_VIDEO_WIDTH}px`,
            height: `${EXPORT_VIDEO_HEIGHT}px`,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <Canvas
            dpr={1}
            camera={{ position: [0, 0, 21.5], fov: 38, near: 0.1, far: 100 }}
            style={{ width: `${EXPORT_VIDEO_WIDTH}px`, height: `${EXPORT_VIDEO_HEIGHT}px` }}
            gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setPixelRatio(1);
              gl.setSize(EXPORT_VIDEO_WIDTH, EXPORT_VIDEO_HEIGHT, false);
              exportRendererCanvasRef.current = gl.domElement;
            }}
          >
            <StoryScene data={data} currentStep={currentStep} cameraMode={cameraMode} />
          </Canvas>
        </div>
      )}
    </div>
  );
}
