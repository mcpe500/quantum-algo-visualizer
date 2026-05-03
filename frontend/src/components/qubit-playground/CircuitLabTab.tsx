import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  Code2,
  Copy,
  Download,
  Lightbulb,
  Link2,
  Minus,
  Pause,
  Play,
  Plus,
  Repeat2,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { downloadBlob } from '../../utils/download';
import { usePlaybackController } from '../../engine/core/playback';
import {
  buildProbabilityEntries,
  buildStepIndexByPlacementId,
  buildCircuitLayoutModel,
} from '../../engine/circuit-lab';
import { BlochSphere3D } from './BlochSphere';
import type { NamedBlochData } from './QubitStatePreview';
import {
  CIRCUIT_GATE_LIBRARY,
  type CircuitBuilderState,
  type CircuitCodeExportFormat,
  type CircuitGateDefinition,
  type CircuitGateName,
} from './useCircuitBuilder';

interface CircuitLabTabProps {
  builder: CircuitBuilderState;
}

type DragPayload =
  | { type: 'palette'; gate: CircuitGateName }
  | { type: 'placement'; placementId: string };

type InspectorTab = 'visual' | 'code';
type CodePreviewFormat = Exclude<CircuitCodeExportFormat, 'json'>;

const GROUP_LABELS: Record<CircuitGateDefinition['group'], string> = {
  fixed: '1-Qubit Basic',
  parametric: 'Parametrik',
  twoQubit: 'Multi-Qubit',
};

const CODE_FORMATS: CodePreviewFormat[] = ['qiskit', 'cirq', 'projectq'];

const GATE_TILE_CLASSES: Record<CircuitGateDefinition['tone'], string> = {
  blue: 'bg-blue-600 text-white shadow-blue-200/70',
  green: 'bg-emerald-600 text-white shadow-emerald-200/70',
  purple: 'bg-violet-600 text-white shadow-violet-200/70',
};

const GATE_CARD_TONES: Record<CircuitGateDefinition['tone'], string> = {
  blue: 'border-slate-200 bg-white text-slate-900 hover:border-blue-300 hover:shadow-blue-100/80',
  green: 'border-emerald-200 bg-white text-slate-900 hover:border-emerald-300 hover:shadow-emerald-100/80',
  purple: 'border-violet-200 bg-white text-slate-900 hover:border-violet-300 hover:shadow-violet-100/80',
};

const INSIGHT_TONES = {
  cyan: 'border-blue-100 bg-blue-50/90 text-blue-700',
  violet: 'border-violet-100 bg-violet-50/90 text-violet-700',
  amber: 'border-amber-100 bg-amber-50/90 text-amber-700',
} as const;

const STAGE_BACKGROUND_STYLE = {
  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(203, 213, 225, 0.65) 1px, transparent 0)',
  backgroundSize: '24px 24px',
};

function parseDragPayload(event: DragEvent<HTMLElement>): DragPayload | null {
  const rawPayload = event.dataTransfer.getData('application/json');
  if (!rawPayload) return null;

  try {
    return JSON.parse(rawPayload) as DragPayload;
  } catch {
    return null;
  }
}

function getGateDefinition(gate: CircuitGateName): CircuitGateDefinition {
  return CIRCUIT_GATE_LIBRARY.find((entry) => entry.gate === gate)!;
}

function getTargetLabel(gate: CircuitGateName): string {
  switch (gate) {
    case 'CNOT':
      return 'TARGET';
    case 'CPhase':
      return 'PHASE';
    case 'SWAP':
      return 'SWAP';
    default:
      return 'TARGET';
  }
}

function getGateTip(gate: CircuitGateDefinition): string {
  switch (gate.gate) {
    case 'H':
      return 'Hadamard membuka superposisi sehingga satu qubit bisa menempati kombinasi |0⟩ dan |1⟩ sekaligus.';
    case 'X':
      return 'Pauli-X adalah quantum NOT yang menukar populasi |0⟩ dengan |1⟩.';
    case 'Y':
      return 'Pauli-Y memberi rotasi pada sumbu Y sambil membawa perubahan fase kompleks.';
    case 'Z':
      return 'Pauli-Z menjaga probabilitas ukur, tetapi mengubah fase relatif komponen |1⟩.';
    case 'S':
    case 'T':
      return 'Gerbang fase seperti S dan T penting untuk interferensi serta penyusunan pola phase kickback.';
    case 'Rx':
    case 'Ry':
    case 'Rz':
      return 'Gerbang parametrik memudahkan eksperimen variational karena sudutnya dapat diatur langsung.';
    case 'CNOT':
      return 'Controlled-NOT menghubungkan qubit control dan target, umum dipakai untuk entanglement dan oracle sederhana.';
    case 'SWAP':
      return 'SWAP menukar keadaan dua qubit yang bersebelahan pada kolom yang sama.';
    case 'CPhase':
      return 'Controlled-Phase cocok untuk memicu phase kickback atau menggeser interferensi pada pasangan qubit.';
    default:
      return gate.description;
  }
}

function getStatusMessage(gateCount: number, columnCount: number): string {
  if (gateCount === 0) {
    return 'Drag gate ke grid untuk menyusun algoritma dan mulai membaca perubahan state.';
  }

  return `${gateCount} gate aktif tersebar pada ${columnCount} langkah. Inspector kanan selalu sinkron dengan step aktif.`;
}

function getDisplayedStepLabel(currentStep: number, totalSteps: number): string {
  return `${currentStep + 1} / ${Math.max(totalSteps + 1, 1)}`;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function InspectorBlochCard({ bloch }: { bloch: NamedBlochData }) {
  return (
    <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {bloch.label.toUpperCase()}
        </span>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-mono text-[10px] font-bold text-blue-600">
          {`θ: ${(bloch.theta * 180 / Math.PI).toFixed(1)}°`}
        </span>
      </div>

      <div className="h-40 overflow-hidden rounded-[20px] border border-slate-100 bg-slate-50 shadow-inner">
        <Canvas camera={{ position: [0, 0.3, 5.1], fov: 44 }}>
          <OrbitControls enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} />
          <BlochSphere3D blochData={[bloch]} numQubits={1} />
        </Canvas>
      </div>
    </div>
  );
}

export default function CircuitLabTab({ builder }: CircuitLabTabProps) {
  const {
    numQubits,
    columnCount,
    placements,
    selectedPlacementId,
    selectedPlacement,
    canIncreaseQubits,
    canDecreaseQubits,
    statevector,
    blochCards,
    playbackFrames,
    insights,
    increaseQubits,
    decreaseQubits,
    addColumn,
    removeColumn,
    clearCircuit,
    placeGate,
    movePlacement,
    removePlacementAt,
    selectPlacement,
    updateSelectedAngle,
    updateSelectedTargetRow,
    canPlaceGate,
    getCellState,
    exportCircuitCode,
    decomposition,
    decompositionSummary,
  } = builder;

  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('visual');
  const [exportFormat, setExportFormat] = useState<CodePreviewFormat>('qiskit');

  const totalSteps = Math.max(playbackFrames.length - 1, 0);
  const {
    state: playback,
    play,
    pause,
    jump,
    reset: resetPlayback,
  } = usePlaybackController(totalSteps, 900);
  const currentStep = playback.currentStep;
  const isPlaying = playback.isPlaying;

  const groupedGates = useMemo(() => {
    return {
      fixed: CIRCUIT_GATE_LIBRARY.filter((gate) => gate.group === 'fixed'),
      parametric: CIRCUIT_GATE_LIBRARY.filter((gate) => gate.group === 'parametric'),
      twoQubit: CIRCUIT_GATE_LIBRARY.filter((gate) => gate.group === 'twoQubit'),
    };
  }, []);

  const selectedGateDefinition = useMemo(() => {
    if (!selectedPlacement) return null;
    return getGateDefinition(selectedPlacement.gate);
  }, [selectedPlacement]);

  const activeDraggedGate = useMemo(() => {
    if (!dragPayload) return null;
    if (dragPayload.type === 'palette') {
      return getGateDefinition(dragPayload.gate);
    }

    const draggedPlacement = placements.find((placement) => placement.id === dragPayload.placementId);
    return draggedPlacement ? getGateDefinition(draggedPlacement.gate) : null;
  }, [dragPayload, placements]);

  const renderedInsights = insights.length > 0
    ? insights
    : [
        {
          id: 'empty',
          title: 'Keadaan basis murni.',
          description: 'Belum ada interaksi kuantum kompleks. Tambahkan gate untuk melihat superposisi atau entanglement.',
          tone: 'cyan' as const,
        },
      ];

  const activeFrame = playbackFrames[currentStep] ?? playbackFrames[0];
  const previewStatevector = activeFrame?.statevector ?? statevector;
  const previewBlochCards = activeFrame?.blochCards ?? blochCards;
  const activePlacementId = activeFrame?.placementId ?? null;
  const activeColumn = activeFrame?.column ?? 0;
  const activeCode = exportCircuitCode(exportFormat);
  const jsonProject = exportCircuitCode('json');

  const probabilityEntries = useMemo(
    () => buildProbabilityEntries(previewStatevector, numQubits),
    [numQubits, previewStatevector]
  );

  const stepIndexByPlacementId = useMemo(
    () => buildStepIndexByPlacementId(playbackFrames),
    [playbackFrames]
  );

  const selectedAngle = selectedPlacement?.angle ?? selectedGateDefinition?.defaultAngle ?? Math.PI / 4;
  const statusMessage = useMemo(() => getStatusMessage(placements.length, columnCount), [columnCount, placements.length]);
  const displayedStep = getDisplayedStepLabel(currentStep, totalSteps);
  const occupiedColumns = useMemo(
    () => buildCircuitLayoutModel(placements).occupiedColumns,
    [placements]
  );

  useEffect(() => {
    if (!selectedPlacementId) return;
    const stepIndex = stepIndexByPlacementId.get(selectedPlacementId);
    if (stepIndex !== undefined) {
      queueMicrotask(() => jump(stepIndex));
    }
  }, [selectedPlacementId, stepIndexByPlacementId, jump]);

  const startPaletteDrag = (event: DragEvent<HTMLDivElement>, gate: CircuitGateName) => {
    const payload: DragPayload = { type: 'palette', gate };
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    setDragPayload(payload);
  };

  const startPlacementDrag = (event: DragEvent<HTMLButtonElement>, placementId: string) => {
    const payload: DragPayload = { type: 'placement', placementId };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    setDragPayload(payload);
  };

  const clearDragState = () => {
    setDragPayload(null);
    setHoveredCell(null);
  };

  const jumpToStep = (stepIndex: number) => {
    pause();
    jump(Math.max(0, Math.min(stepIndex, totalSteps)));
  };

  const togglePlayback = () => {
    if (totalSteps === 0) return;
    if (!isPlaying && currentStep >= totalSteps) {
      resetPlayback();
      play();
    } else if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handlePlacementSelection = (placementId: string) => {
    selectPlacement(placementId);
    const stepIndex = stepIndexByPlacementId.get(placementId);
    if (stepIndex !== undefined) {
      jump(stepIndex);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, row: number, column: number) => {
    const payload = parseDragPayload(event) ?? dragPayload;
    if (!payload) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = payload.type === 'palette' ? 'copy' : 'move';
    setHoveredCell(`${row}-${column}`);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, row: number, column: number) => {
    event.preventDefault();
    const payload = parseDragPayload(event) ?? dragPayload;
    if (!payload) {
      clearDragState();
      return;
    }

    if (payload.type === 'palette') {
      placeGate(payload.gate, row, column);
    } else {
      movePlacement(payload.placementId, row, column);
    }

    clearDragState();
  };

  const handleCopyCurrentCode = async () => {
    await copyText(activeCode);
  };

  const handleSaveJson = () => {
    downloadBlob(new Blob([jsonProject], { type: 'application/json' }), `quantum-studio-project-q${numQubits}-c${columnCount}.json`);
  };

  return (
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="flex min-h-[780px] flex-col lg:h-[calc(100vh-220px)]">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-200">
                Q
              </div>
              <div className="text-lg font-bold tracking-tight text-slate-900">
                Studio<span className="text-blue-600">Lab</span>
              </div>
            </div>

            <div className="hidden h-7 w-px bg-slate-200 lg:block" />

            <div className="hidden min-w-0 flex-wrap items-center gap-3 lg:flex">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Qubits</span>
                <button
                  type="button"
                  onClick={decreaseQubits}
                  disabled={!canDecreaseQubits}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-600 transition-colors hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-5 text-center text-sm font-bold text-blue-600">{numQubits}</span>
                <button
                  type="button"
                  onClick={increaseQubits}
                  disabled={!canIncreaseQubits}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-600 transition-colors hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Steps</span>
                <button
                  type="button"
                  onClick={removeColumn}
                  disabled={columnCount <= 4}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-600 transition-colors hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-5 text-center text-sm font-bold text-blue-600">{columnCount}</span>
                <button
                  type="button"
                  onClick={addColumn}
                  disabled={columnCount >= 10}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-600 transition-colors hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <button
              type="button"
              onClick={handleSaveJson}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Save JSON</span>
            </button>
            <button
              type="button"
              onClick={handleCopyCurrentCode}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copy Code</span>
            </button>
            <button
              type="button"
              onClick={() => {
                clearCircuit();
                selectPlacement(null);
                resetPlayback();
              }}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white lg:w-[280px] lg:border-b-0 lg:border-r">
            <div className="px-4 pb-3 pt-4">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Gerbang Quantum</h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-6">
                {(Object.keys(groupedGates) as Array<keyof typeof groupedGates>).map((groupKey) => {
                  const groupLayout = groupKey === 'fixed' ? 'grid grid-cols-2 gap-2.5' : 'space-y-2.5';

                  return (
                    <div key={groupKey} className="space-y-2.5">
                      <p className="text-sm font-semibold text-slate-600">{GROUP_LABELS[groupKey]}</p>
                      <div className={groupLayout}>
                        {groupedGates[groupKey].map((gate) => (
                          <div
                            key={gate.gate}
                            draggable
                            onDragStart={(event) => startPaletteDrag(event, gate.gate)}
                            onDragEnd={clearDragState}
                            className={`select-none rounded-2xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ${GATE_CARD_TONES[gate.tone]}`}
                          >
                            <div className={`flex ${groupKey === 'fixed' ? 'flex-col items-center gap-1.5 text-center' : 'items-center justify-between gap-3'}`}>
                              <div>
                                <div className={`font-bold ${groupKey === 'fixed' ? 'text-lg text-blue-600' : gate.tone === 'purple' ? 'text-base text-violet-600' : 'text-base text-emerald-600'}`}>
                                  {gate.symbol}
                                </div>
                                <div className="text-[10px] leading-4 text-slate-400">
                                  {groupKey === 'fixed' ? gate.fullName : gate.description.split('.')[0]}
                                </div>
                              </div>

                              {groupKey !== 'fixed' && gate.defaultAngle !== undefined && (
                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600">
                                  π/4
                                </span>
                              )}

                              {groupKey === 'twoQubit' && gate.defaultAngle === undefined && (
                                <span className="text-violet-300">
                                  {gate.gate === 'SWAP' ? <Repeat2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                                </span>
                              )}

                              {groupKey === 'twoQubit' && gate.defaultAngle !== undefined && (
                                <span className="rounded-md bg-violet-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-violet-600">
                                  π/4
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-auto border-t border-slate-100 p-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <h4 className="text-xs font-bold text-blue-700">Status Studio</h4>
                <p className="mt-1 text-[11px] leading-5 text-blue-600/80">{statusMessage}</p>
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-hidden bg-slate-50" style={STAGE_BACKGROUND_STYLE}>
            <div className="flex h-full min-h-0 items-center justify-center overflow-auto p-6 lg:p-10 xl:p-12">
              <div className="rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-[0_30px_80px_rgba(148,163,184,0.18)] lg:p-10">
                <div className="flex min-w-fit flex-col gap-6">
                  {Array.from({ length: numQubits }, (_, row) => (
                    <div key={`row-${row}`} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 font-mono text-sm font-semibold text-slate-300">
                        q{row}
                      </div>

                      {Array.from({ length: columnCount }, (_, column) => {
                        const cellState = getCellState(row, column);
                        const cellKey = `${row}-${column}`;
                        const isHovered = hoveredCell === cellKey;
                        const invalidTwoQubitDrop = Boolean(
                          isHovered && activeDraggedGate && activeDraggedGate.numQubits === 2 && !canPlaceGate(activeDraggedGate.gate, row)
                        );
                        const placementDefinition = cellState ? getGateDefinition(cellState.placement.gate) : null;
                        const controlRow = cellState?.placement.row;
                        const targetRow = cellState?.placement.targetRow;
                        const targetIsAbove = targetRow !== undefined && controlRow !== undefined && targetRow < controlRow;
                        const targetIsBelow = targetRow !== undefined && controlRow !== undefined && targetRow > controlRow;
                        const isSelected = cellState?.placement.id === selectedPlacementId;
                        const isActiveStep = cellState?.placement.id === activePlacementId;
                        const isActiveColumn = activeColumn === column;
                        const isTwoQubitGate = placementDefinition?.numQubits === 2;

                        return (
                          <div
                            key={cellKey}
                            onDragOver={(event) => handleDragOver(event, row, column)}
                            onDragLeave={() => {
                              if (hoveredCell === cellKey) {
                                setHoveredCell(null);
                              }
                            }}
                            onDrop={(event) => handleDrop(event, row, column)}
                            onClick={() => {
                              if (cellState) {
                                handlePlacementSelection(cellState.placement.id);
                              }
                            }}
                            className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 transition-all ${
                              cellState?.role === 'secondary'
                                ? `${isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'} ${isActiveStep ? 'shadow-[0_0_0_4px_rgba(59,130,246,0.14)]' : ''}`
                                : cellState?.role === 'primary'
                                  ? `${isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'} ${isActiveStep ? 'shadow-[0_0_0_4px_rgba(59,130,246,0.14)]' : ''}`
                                  : invalidTwoQubitDrop
                                    ? 'border-amber-300 bg-amber-50'
                                    : isHovered || isActiveColumn
                                      ? 'border-blue-400 bg-blue-50'
                                      : 'border-dashed border-slate-300 bg-white/95'
                            }`}
                          >
                            {isTwoQubitGate && cellState?.role === 'primary' && (
                              <>
                                <div
                                  className={`absolute left-1/2 z-0 w-0.5 -translate-x-1/2 ${isActiveStep ? 'bg-blue-400' : 'bg-violet-300'}`}
                                  style={targetIsAbove
                                    ? { bottom: '50%', height: 'calc(100% + 24px)' }
                                    : { top: '50%', height: 'calc(100% + 24px)' }
                                  }
                                />
                                {placementDefinition?.gate === 'SWAP' ? (
                                  <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-2xl font-semibold text-violet-600">×</div>
                                ) : (
                                  <div className={`absolute left-1/2 top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${isActiveStep ? 'bg-blue-600' : 'bg-violet-600'}`} />
                                )}
                              </>
                            )}

                            {isTwoQubitGate && cellState?.role === 'secondary' && (
                              <>
                                <div
                                  className={`absolute left-1/2 z-0 w-0.5 -translate-x-1/2 ${isActiveStep ? 'bg-blue-400' : 'bg-violet-300'}`}
                                  style={targetIsBelow
                                    ? { top: '-24px', height: 'calc(50% + 24px)' }
                                    : { bottom: '-24px', height: 'calc(50% + 24px)' }
                                  }
                                />
                                {placementDefinition?.gate === 'SWAP' ? (
                                  <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-2xl font-semibold text-violet-600">×</div>
                                ) : placementDefinition?.gate === 'CNOT' ? (
                                  <div className={`absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-white text-xl font-semibold ${isActiveStep ? 'border-blue-500 text-blue-600' : 'border-violet-500 text-violet-600'}`}>
                                    +
                                  </div>
                                ) : (
                                  <div className={`absolute left-1/2 top-1/2 z-10 flex h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-white px-2 text-[10px] font-semibold tracking-wide ${isActiveStep ? 'border-blue-200 text-blue-700' : 'border-violet-200 text-violet-700'}`}>
                                    φ
                                  </div>
                                )}
                              </>
                            )}

                            {!cellState && (
                              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                                {invalidTwoQubitDrop ? 'Need 2+ qubits' : ''}
                              </span>
                            )}

                            {cellState?.role === 'primary' && placementDefinition && !isTwoQubitGate && (
                              <button
                                type="button"
                                draggable
                                onDragStart={(event) => startPlacementDrag(event, cellState.placement.id)}
                                onDragEnd={clearDragState}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePlacementSelection(cellState.placement.id);
                                }}
                                className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold shadow-lg transition-transform hover:scale-[1.02] ${GATE_TILE_CLASSES[placementDefinition.tone]}`}
                              >
                                {placementDefinition.symbol}
                              </button>
                            )}

                            {cellState?.role === 'primary' && placementDefinition && isTwoQubitGate && (
                              <button
                                type="button"
                                draggable
                                onDragStart={(event) => startPlacementDrag(event, cellState.placement.id)}
                                onDragEnd={clearDragState}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePlacementSelection(cellState.placement.id);
                                }}
                                className={`absolute left-1/2 ${targetIsAbove ? 'bottom-2' : 'top-2'} z-20 flex h-10 min-w-[52px] -translate-x-1/2 items-center justify-center rounded-2xl px-3 text-sm font-bold shadow-lg ${GATE_TILE_CLASSES[placementDefinition.tone]}`}
                              >
                                {placementDefinition.symbol}
                              </button>
                            )}

                            {cellState?.role === 'secondary' && placementDefinition && isTwoQubitGate && (
                              <div className="absolute bottom-2 right-2 z-20 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400 shadow-sm">
                                {getTargetLabel(placementDefinition.gate)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          <aside className="flex w-full shrink-0 flex-col border-t border-slate-200 bg-white lg:w-[340px] lg:border-l lg:border-t-0 xl:w-[360px]">
            <div className="flex shrink-0 border-b border-slate-100 px-4">
              <button
                type="button"
                onClick={() => setInspectorTab('visual')}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  inspectorTab === 'visual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Visualize
              </button>
              <button
                type="button"
                onClick={() => setInspectorTab('code')}
                className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  inspectorTab === 'code'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Source Code
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {inspectorTab === 'visual' ? (
                <div className="space-y-6">
                  <section>
                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Bloch Sphere Monitor
                    </h3>
                    <div className="space-y-4">
                      {previewBlochCards.map((bloch) => (
                        <InspectorBlochCard key={bloch.label} bloch={bloch} />
                      ))}
                    </div>
                  </section>

                  <section className="border-t border-slate-100 pt-6">
                    <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Probability Dist.
                    </h3>
                    <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
                      <div className="flex min-h-[128px] items-end gap-2 overflow-x-auto px-2">
                        {probabilityEntries.map((entry) => (
                          <div key={entry.basis} className="flex min-w-[26px] flex-1 flex-col items-center justify-end gap-2">
                            <div
                              className="w-full rounded-t-lg bg-blue-500 transition-[height] duration-500"
                              style={{ height: `${Math.max(entry.probability * 100, 2)}%` }}
                            />
                            <span className="font-mono text-[9px] font-bold text-slate-400">{entry.basis}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <section className="border-t border-slate-100 pt-6">
                    <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      Automated Insights
                    </h3>
                    <div className="space-y-2">
                      {renderedInsights.map((insight) => (
                        <article key={insight.id} className={`rounded-2xl border p-3 ${INSIGHT_TONES[insight.tone]}`}>
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{insight.title}</p>
                          <p className="mt-1 text-[11px] leading-5 opacity-90">{insight.description}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="border-t border-slate-100 pt-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-slate-400" />
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Gate Inspector</h3>
                    </div>

                    {!selectedPlacement || !selectedGateDefinition ? (
                      <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                        Pilih gate di stage untuk melihat detail, mengubah sudut gerbang parametrik, atau menghapusnya dari sirkuit.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Gate</p>
                              <h4 className="mt-1 text-base font-semibold text-slate-900">{selectedGateDefinition.fullName}</h4>
                            </div>
                            <span className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-sm font-bold text-slate-700">
                              {selectedGateDefinition.symbol}
                            </span>
                          </div>

                          <dl className="mt-4 space-y-2 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-3">
                              <dt>Qubits</dt>
                              <dd className="font-medium text-slate-900">
                                {selectedPlacement.targetRow !== undefined
                                  ? `q${selectedPlacement.row} → q${selectedPlacement.targetRow}`
                                  : `q${selectedPlacement.row}`}
                              </dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <dt>Column</dt>
                              <dd className="font-medium text-slate-900">{selectedPlacement.column + 1}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <dt>Playback step</dt>
                              <dd className="font-medium text-slate-900">{stepIndexByPlacementId.get(selectedPlacement.id) ?? '-'}</dd>
                            </div>
                          </dl>
                        </div>

                        {selectedGateDefinition.defaultAngle !== undefined && (
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Angle (radian)</span>
                            <input
                              type="number"
                              step="0.01"
                              value={selectedAngle}
                              onChange={(event) => updateSelectedAngle(Number(event.target.value))}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400"
                            />
                          </label>
                        )}

                        {selectedPlacement.targetRow !== undefined && (
                          <label className="block space-y-2">
                            <span className="text-sm font-medium text-slate-700">Target Qubit</span>
                            <select
                              value={selectedPlacement.targetRow}
                              onChange={(event) => updateSelectedTargetRow(Number(event.target.value))}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400"
                            >
                              {Array.from({ length: numQubits }, (_, i) => i).filter(i => i !== selectedPlacement.row).map(i => (
                                <option key={i} value={i}>q{i}</option>
                              ))}
                            </select>
                          </label>
                        )}

                        <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                          {getGateTip(selectedGateDefinition)}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            removePlacementAt(selectedPlacement.row, selectedPlacement.column);
                            selectPlacement(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Remove Gate
                        </button>
                      </div>
                    )}
                  </section>
                </div>
              ) : (
                <div className="flex h-full min-h-[480px] flex-col">
                  <div className="mb-4 flex items-center gap-2">
                    {CODE_FORMATS.map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setExportFormat(format)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                          exportFormat === format
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {format === 'projectq' ? 'ProjectQ' : format === 'cirq' ? 'Cirq' : 'Qiskit'}
                      </button>
                    ))}
                  </div>

                  <section className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Decomposition + Optimization</h3>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                        {decomposition.optimizedGateCount} ops
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-slate-600">{decompositionSummary}</pre>
                    {decomposition.optimizedGates.length > 0 && (
                      <div className="mt-3 max-h-32 overflow-auto rounded-xl border border-slate-200 bg-white p-2">
                        {decomposition.optimizedGates.map((gate, index) => (
                          <div key={`${gate.sourcePlacementId}-${index}`} className="flex items-center justify-between gap-3 py-1 font-mono text-[10px] text-slate-600">
                            <span>{index + 1}. {gate.gate} q{gate.row}{gate.targetRow !== undefined ? ` -> q${gate.targetRow}` : ''}</span>
                            <span>{gate.angle !== undefined ? gate.angle.toFixed(3) : gate.note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="flex-1 overflow-hidden rounded-2xl bg-slate-950 p-4 shadow-inner">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-400">
                        <Code2 className="h-3.5 w-3.5" />
                        {exportFormat === 'projectq' ? 'ProjectQ Source' : exportFormat === 'cirq' ? 'Cirq Source' : 'Qiskit Source'}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCurrentCode}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>

                    <pre className="h-full overflow-auto pr-2 font-mono text-[11px] leading-6 text-blue-300">
                      <code>{activeCode}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 lg:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-8">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => jumpToStep(currentStep - 1)}
                disabled={currentStep <= 0}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                disabled={totalSteps === 0}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
              </button>
              <button
                type="button"
                onClick={() => jumpToStep(currentStep + 1)}
                disabled={currentStep >= totalSteps}
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                <span>Start State</span>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-blue-600">Step {displayedStep}</span>
                <span>Final Output</span>
              </div>

              <input
                type="range"
                min={0}
                max={Math.max(totalSteps, 0)}
                value={currentStep}
                step={1}
                onChange={(event) => jumpToStep(Number(event.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
              />
            </div>

            <div className="min-w-[180px] text-right">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">State Vector</p>
              <div className="font-mono text-sm font-bold text-blue-600 truncate">{activeFrame?.ket ?? '|0⟩'}</div>
              <div className="mt-1 text-[11px] text-slate-400">
                {occupiedColumns} kolom aktif dari {columnCount} langkah
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
