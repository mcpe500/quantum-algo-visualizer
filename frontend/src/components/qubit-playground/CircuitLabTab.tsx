import { useEffect, useMemo, useState, type DragEvent } from 'react';
import {
  Box,
  Grip,
  Info,
  Lightbulb,
  Minus,
  MousePointer2,
  Pause,
  Play,
  Plus,
  SkipBack,
  SkipForward,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import { QubitStatePreview } from './QubitStatePreview';
import { StateInfoPanel } from './StateInfoPanel';
import {
  CIRCUIT_GATE_LIBRARY,
  type CircuitBuilderState,
  type CircuitGateDefinition,
  type CircuitGateName,
} from './useCircuitBuilder';

interface CircuitLabTabProps {
  builder: CircuitBuilderState;
}

type DragPayload =
  | { type: 'palette'; gate: CircuitGateName }
  | { type: 'placement'; placementId: string };

const GROUP_LABELS: Record<CircuitGateDefinition['group'], string> = {
  fixed: '1-Qubit Fixed',
  parametric: '1-Qubit Parametric',
  twoQubit: '2-Qubit',
};

const GATE_TONES: Record<CircuitGateDefinition['tone'], string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  purple: 'border-violet-200 bg-violet-50 text-violet-700',
};

const INSIGHT_TONES = {
  cyan: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  violet: 'bg-violet-50 border-violet-200 text-violet-900',
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
} as const;

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

function getGateTip(gate: CircuitGateDefinition): string {
  switch (gate.gate) {
    case 'H':
      return 'Hadamard cocok untuk membuka superposisi, jadi amplitudo tersebar ke beberapa basis state.';
    case 'X':
      return 'Pauli-X adalah quantum NOT yang membalik |0⟩ dan |1⟩ pada qubit target.';
    case 'Y':
      return 'Pauli-Y memutar state pada sumbu Y sekaligus membawa fase kompleks.';
    case 'Z':
      return 'Pauli-Z mengubah fase komponen |1⟩ tanpa mengubah probabilitas ukur secara langsung.';
    case 'S':
    case 'T':
      return 'Gerbang fase ini penting untuk interferensi dan penyusunan phase kickback yang terkontrol.';
    case 'Rx':
    case 'Ry':
    case 'Rz':
      return 'Rotasi parametrik berguna untuk eksperimen variational karena sudutnya bisa di-tuning.';
    case 'CNOT':
      return 'Controlled-NOT mengikat control dan target, sering dipakai untuk entanglement dan oracle sederhana.';
    case 'SWAP':
      return 'SWAP menukar keadaan dua qubit yang bersebelahan dalam satu kolom sirkuit.';
    case 'CPhase':
      return 'Controlled-Phase cocok untuk memicu phase kickback atau interferensi fase pada pasangan qubit.';
    default:
      return gate.description;
  }
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

function formatPlaybackSummary(currentStep: number, totalSteps: number): string {
  return `${currentStep}/${totalSteps}`;
}

export default function CircuitLabTab({ builder }: CircuitLabTabProps) {
  const {
    numQubits,
    columnCount,
    placements,
    selectedPlacementId,
    selectedPlacement,
    statevector,
    blochCards,
    playbackFrames,
    insights,
    setNumQubits,
    addColumn,
    removeColumn,
    clearCircuit,
    placeGate,
    movePlacement,
    removePlacementAt,
    selectPlacement,
    updateSelectedAngle,
    canPlaceGate,
    getCellState,
  } = builder;

  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
          title: 'Circuit masih kosong',
          description: 'Tarik gate ke grid untuk mulai melihat perubahan statevector, Bloch sphere, dan insight otomatis.',
          tone: 'cyan' as const,
        },
      ];

  const totalSteps = Math.max(playbackFrames.length - 1, 0);
  const activeFrame = playbackFrames[currentStep] ?? playbackFrames[0];
  const previewStatevector = activeFrame?.statevector ?? statevector;
  const previewBlochCards = activeFrame?.blochCards ?? blochCards;
  const activePlacementId = activeFrame?.placementId ?? null;
  const activeColumn = activeFrame?.column ?? null;

  const stepIndexByPlacementId = useMemo(() => {
    const map = new Map<string, number>();
    playbackFrames.forEach((frame) => {
      if (frame.placementId) {
        map.set(frame.placementId, frame.stepIndex);
      }
    });
    return map;
  }, [playbackFrames]);

  const selectedAngle = selectedPlacement?.angle ?? selectedGateDefinition?.defaultAngle ?? Math.PI / 4;
  const previewSubtitle = activeFrame?.column === null
    ? 'Snapshot awal sebelum gate diterapkan ke state |0...0⟩.'
    : `Step ${formatPlaybackSummary(currentStep, totalSteps)} · ${activeFrame.label}`;

  useEffect(() => {
    setCurrentStep((value) => Math.min(value, totalSteps));
    if (totalSteps === 0) {
      setIsPlaying(false);
    }
  }, [totalSteps]);

  useEffect(() => {
    if (!selectedPlacementId) return;
    const stepIndex = stepIndexByPlacementId.get(selectedPlacementId);
    if (stepIndex !== undefined) {
      setCurrentStep(stepIndex);
    }
  }, [selectedPlacementId, stepIndexByPlacementId]);

  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return;
    if (currentStep >= totalSteps) {
      setIsPlaying(false);
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentStep((value) => Math.min(value + 1, totalSteps));
    }, 900);

    return () => window.clearInterval(timer);
  }, [currentStep, isPlaying, totalSteps]);

  useEffect(() => {
    if (isPlaying && currentStep >= totalSteps) {
      setIsPlaying(false);
    }
  }, [currentStep, isPlaying, totalSteps]);

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
    setIsPlaying(false);
    setCurrentStep(Math.max(0, Math.min(stepIndex, totalSteps)));
  };

  const togglePlayback = () => {
    if (totalSteps === 0) return;
    if (!isPlaying && currentStep >= totalSteps) {
      setCurrentStep(0);
    }
    setIsPlaying((value) => !value);
  };

  const handlePlacementSelection = (placementId: string) => {
    selectPlacement(placementId);
    const stepIndex = stepIndexByPlacementId.get(placementId);
    if (stepIndex !== undefined) {
      setCurrentStep(stepIndex);
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

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qubits</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {[1, 2, 3].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNumQubits(value)}
                    className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
                      numQubits === value
                        ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Columns</span>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
                <button
                  type="button"
                  onClick={removeColumn}
                  disabled={columnCount <= 4}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[88px] text-center text-sm font-medium text-slate-700">
                  {columnCount} columns
                </span>
                <button
                  type="button"
                  onClick={addColumn}
                  disabled={columnCount >= 10}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              <MousePointer2 className="h-3.5 w-3.5 text-slate-400" />
              Drag & drop gate ke grid, lalu replay langkahnya.
            </div>

            <button
              type="button"
              onClick={() => {
                clearCircuit();
                selectPlacement(null);
                setCurrentStep(0);
                setIsPlaying(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Gate Palette</h3>
                <p className="mt-1 text-sm text-slate-500">Pilih gerbang satu qubit, rotasi parametrik, atau interaksi dua qubit.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400">
                <Grip className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-5">
              {(Object.keys(groupedGates) as Array<keyof typeof groupedGates>).map((groupKey) => {
                const groupLayout = groupKey === 'fixed' ? 'grid grid-cols-2 gap-2.5' : 'space-y-2.5';

                return (
                  <div key={groupKey} className="space-y-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {GROUP_LABELS[groupKey]}
                    </div>
                    <div className={groupLayout}>
                      {groupedGates[groupKey].map((gate) => (
                        <div
                          key={gate.gate}
                          draggable
                          onDragStart={(event) => startPaletteDrag(event, gate.gate)}
                          onDragEnd={clearDragState}
                          className={`cursor-grab rounded-2xl border p-3 transition-transform hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.99] ${GATE_TONES[gate.tone]}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-semibold">{gate.symbol}</div>
                              <div className="text-sm font-semibold text-slate-900">{gate.fullName}</div>
                            </div>
                            {gate.defaultAngle !== undefined && (
                              <span className="rounded-full border border-current/20 bg-white/80 px-2 py-0.5 text-[11px] font-medium">
                                θ=π/4
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-600">{gate.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-cyan-600" />
              <h3 className="text-lg font-semibold text-slate-900">Automated Insights</h3>
            </div>

            <div className="space-y-3">
              {renderedInsights.map((insight) => (
                <article
                  key={insight.id}
                  className={`rounded-2xl border p-3 transition-colors ${INSIGHT_TONES[insight.tone]}`}
                >
                  <h4 className="text-sm font-semibold">{insight.title}</h4>
                  <p className="mt-1 text-sm leading-6 opacity-90">{insight.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Circuit Canvas</h3>
                <p className="text-sm text-slate-500">Gate dua qubit otomatis memakai row yang dipilih dan row tepat di bawahnya.</p>
              </div>
              <div className="text-xs font-medium text-slate-400">Susun dari kiri ke kanan, lalu gunakan playback untuk membaca tiap langkah.</div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
              <div className="min-w-[720px] space-y-3">
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `72px repeat(${columnCount}, minmax(0, 1fr))` }}
                >
                  <div />
                  {Array.from({ length: columnCount }, (_, column) => (
                    <div
                      key={`header-${column}`}
                      className={`rounded-lg px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                        activeColumn === column
                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                          : 'text-slate-500'
                      }`}
                    >
                      c{column + 1}
                    </div>
                  ))}
                </div>

                {Array.from({ length: numQubits }, (_, row) => (
                  <div
                    key={`row-${row}`}
                    className="grid items-center gap-3"
                    style={{ gridTemplateColumns: `72px repeat(${columnCount}, minmax(0, 1fr))` }}
                  >
                    <div className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm">
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
                          className={`relative h-[72px] overflow-visible rounded-2xl border transition-all ${
                            cellState?.role === 'primary'
                              ? `border-solid ${GATE_TONES[placementDefinition?.tone ?? 'blue']} ${isSelected ? 'ring-2 ring-indigo-300' : ''} ${isActiveStep ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.14)]' : ''}`
                              : cellState?.role === 'secondary'
                                ? `border-slate-200 bg-slate-50 text-slate-500 ${isSelected ? 'ring-2 ring-indigo-300' : ''} ${isActiveStep ? 'shadow-[0_0_0_2px_rgba(59,130,246,0.14)]' : ''}`
                                : invalidTwoQubitDrop
                                  ? 'border-amber-300 bg-amber-50'
                                  : isHovered
                                    ? 'border-cyan-300 bg-cyan-50'
                                    : isActiveColumn
                                      ? 'border-blue-100 bg-blue-50/50'
                                      : 'border-dashed border-slate-200 bg-white'
                          }`}
                        >
                          <div className={`absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 ${isActiveColumn ? 'bg-blue-200' : 'bg-slate-200'}`} />

                          {isTwoQubitGate && cellState?.role === 'primary' && (
                            <>
                              <div className={`absolute left-1/2 top-1/2 z-0 w-0.5 -translate-x-1/2 ${isActiveStep ? 'bg-blue-400' : 'bg-violet-300'}`} style={{ height: 'calc(100% + 16px)' }} />
                              {placementDefinition?.gate === 'SWAP' ? (
                                <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold text-violet-700">×</div>
                              ) : (
                                <div className={`absolute left-1/2 top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white ${isActiveStep ? 'bg-blue-600' : 'bg-violet-600'}`} />
                              )}
                            </>
                          )}

                          {isTwoQubitGate && cellState?.role === 'secondary' && (
                            <>
                              <div className={`absolute left-1/2 top-[-16px] z-0 w-0.5 -translate-x-1/2 ${isActiveStep ? 'bg-blue-400' : 'bg-violet-300'}`} style={{ height: 'calc(50% + 16px)' }} />
                              {placementDefinition?.gate === 'SWAP' ? (
                                <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold text-violet-700">×</div>
                              ) : placementDefinition?.gate === 'CNOT' ? (
                                <div className={`absolute left-1/2 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 ${isActiveStep ? 'border-blue-500 text-blue-600' : 'border-violet-500 text-violet-600'} bg-white text-lg font-semibold`}>+</div>
                              ) : (
                                <div className={`absolute left-1/2 top-1/2 z-10 flex h-8 min-w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border px-2 text-[10px] font-semibold tracking-wide ${isActiveStep ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>
                                  φ
                                </div>
                              )}
                            </>
                          )}

                          {!cellState && (
                            <div className="relative z-10 flex h-full items-center justify-center text-xs font-medium text-slate-400">
                              {invalidTwoQubitDrop ? 'Need q+1' : isHovered ? 'Release' : 'Drop'}
                            </div>
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
                              className="relative z-10 m-1.5 flex h-[calc(100%-12px)] w-[calc(100%-12px)] items-center justify-between gap-2 rounded-xl border border-current/20 bg-white/90 px-3 text-left shadow-sm"
                            >
                              <div>
                                <div className="text-base font-semibold text-slate-900">{placementDefinition.symbol}</div>
                                <div className="text-xs font-medium text-slate-600">{placementDefinition.fullName}</div>
                              </div>
                              <Grip className="h-4 w-4 shrink-0 text-slate-400" />
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
                              className="absolute inset-x-1.5 top-1.5 z-20 flex items-center justify-between rounded-xl border border-white/70 bg-white/90 px-2.5 py-1.5 text-left shadow-sm"
                            >
                              <div>
                                <div className="text-xs font-semibold text-slate-900">{placementDefinition.symbol}</div>
                                <div className="text-[11px] font-medium text-slate-600">{placementDefinition.fullName}</div>
                              </div>
                              <Grip className="h-4 w-4 shrink-0 text-slate-400" />
                            </button>
                          )}

                          {cellState?.role === 'secondary' && placementDefinition && isTwoQubitGate && (
                            <div className="absolute right-2 top-2 z-20 rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
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
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => jumpToStep(currentStep - 1)}
                    disabled={currentStep <= 0}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlayback}
                    disabled={totalSteps === 0}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => jumpToStep(currentStep + 1)}
                    disabled={currentStep >= totalSteps}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 px-1 lg:px-4">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(totalSteps, 0)}
                    value={currentStep}
                    step={1}
                    onChange={(event) => jumpToStep(Number(event.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
                  />
                </div>

                <div className="min-w-[86px] text-right font-mono text-sm font-bold text-blue-600">
                  STEP {formatPlaybackSummary(currentStep, totalSteps)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {activeFrame?.column === null ? 'Initial Snapshot' : `Active Column · c${activeFrame.column + 1}`}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-900">{activeFrame?.label ?? 'Initial state'}</h3>
                  </div>

                  {activeFrame && activeFrame.phenomena.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {activeFrame.phenomena.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {activeFrame?.summary ?? 'Sistem berada pada state awal sebelum replay berjalan.'}
                </p>

                <div className="mt-3 rounded-xl bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300">
                  {activeFrame?.ket ?? '|0⟩'}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <WandSparkles className="h-5 w-5 text-violet-600" />
              <h3 className="text-lg font-semibold text-slate-900">Step-by-Step Trace</h3>
            </div>

            <div className="max-h-[440px] space-y-3 overflow-auto pr-1">
              {playbackFrames.map((frame) => {
                const isCurrentFrame = frame.stepIndex === currentStep;

                return (
                  <button
                    key={`${frame.placementId ?? 'initial'}-${frame.stepIndex}`}
                    type="button"
                    onClick={() => jumpToStep(frame.stepIndex)}
                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                      isCurrentFrame
                        ? 'border-blue-200 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${
                        isCurrentFrame
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-500'
                      }`}>
                        {frame.stepIndex}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">{frame.label}</p>
                          <span className="text-xs font-medium text-slate-500">
                            {frame.column === null ? 'initial' : `c${frame.column + 1}`}
                          </span>
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-600">{frame.summary}</p>
                        <div className="mt-3 rounded-xl bg-slate-950 px-3 py-2 font-mono text-[11px] text-cyan-300">
                          {frame.ket}
                        </div>

                        {frame.phenomena.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {frame.phenomena.map((item) => (
                              <span
                                key={item}
                                className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <QubitStatePreview
            title="Live Qubit Preview"
            subtitle={previewSubtitle}
            blochCards={previewBlochCards}
            statevector={previewStatevector}
            compact
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-slate-500" />
              <h3 className="text-lg font-semibold text-slate-900">Selected Gate</h3>
            </div>

            {!selectedPlacement || !selectedGateDefinition ? (
              <p className="text-sm leading-6 text-slate-500">
                Klik gate di grid untuk melihat detail, mengubah angle gerbang parametrik, atau menghapusnya dari circuit.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gate</p>
                      <h4 className="mt-1 text-base font-semibold text-slate-900">{selectedGateDefinition.fullName}</h4>
                    </div>
                    <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm font-semibold text-slate-700">
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
                      <dd className="font-medium text-slate-900">c{selectedPlacement.column + 1}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Playback step</dt>
                      <dd className="font-medium text-slate-900">
                        {stepIndexByPlacementId.get(selectedPlacement.id) ?? '-'}
                      </dd>
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400"
                    />
                  </label>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  {getGateTip(selectedGateDefinition)}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    removePlacementAt(selectedPlacement.row, selectedPlacement.column);
                    selectPlacement(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove selected gate
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Current Snapshot</h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {activeFrame?.summary ?? 'Sistem berada pada state awal.'}
            </div>
          </section>
        </div>
      </div>

      <StateInfoPanel
        statevector={statevector}
        blochData={blochCards}
        numQubits={numQubits}
        historyLength={playbackFrames.length}
        currentStepDescription="Final state after full circuit replay"
      />
    </div>
  );
}
