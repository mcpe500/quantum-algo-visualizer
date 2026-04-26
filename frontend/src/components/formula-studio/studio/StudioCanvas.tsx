import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { toPng } from 'html-to-image';
import type { CanvasState, ConnectionMode } from './canvas-types';
import { FORMULA_REGISTRY } from '../registry';
import { canvasReducer } from './useCanvasReducer';
import { calculateAutoLayout, getCanvasBounds } from './canvasUtils';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasStatusBar } from './CanvasStatusBar';
import { NodePalette } from './NodePalette';
import { FormulaNode } from './FormulaNode';
import { InputNode } from './InputNode';
import { ExpressionNode } from './ExpressionNode';
import { ConnectionLines } from './ConnectionLines';
import { ConnectionInspector } from './ConnectionInspector';
import { NodeInspector } from './NodeInspector';
import { StudioFlowPanel } from './StudioFlowPanel';
import { buildVarScope } from './graphEngine';
import { computeDataflowGraph } from './dataflowEngine';
import { FORMULA_STUDIO_SCENARIOS } from '../scenarios';

const STORAGE_KEY = 'formula-studio-canvas-v2';

function loadFromStorage(): CanvasState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return null;
}

function saveToStorage(state: CanvasState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

/* ─── DroppableCanvas ──────────────────────────────────────────────────── */

interface DroppableCanvasProps {
  children: React.ReactNode;
  onDrop: (x: number, y: number) => void;
}

const DroppableCanvas: React.FC<DroppableCanvasProps> = ({ children, onDrop }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-drop-zone' });

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isOver) {
        const rect = (e.target as HTMLElement).closest('.canvas-area')?.getBoundingClientRect();
        if (rect) onDrop(e.clientX - rect.left, e.clientY - rect.top);
      }
    },
    [isOver, onDrop]
  );

  return (
    <div
      ref={setNodeRef}
      className={`canvas-area flex-1 min-w-0 relative overflow-auto bg-slate-900/50 ${isOver ? 'bg-cyan-500/5' : ''}`}
      onPointerUp={handlePointerUp}
      style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}
    >
      {children}
    </div>
  );
};

/* ─── DraggableNode ────────────────────────────────────────────────────── */

interface DraggableNodeProps {
  nodeId: string;
  children: React.ReactNode;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ nodeId, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `node-${nodeId}`,
    data: { type: 'canvas-node', nodeId },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 1000 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-80' : ''} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

/* ─── StudioCanvas ─────────────────────────────────────────────────────── */

export const StudioCanvas: React.FC = () => {
  const [state, dispatch] = React.useReducer(canvasReducer, null, () => {
    const loaded = loadFromStorage();
    if (loaded) {
      // Migrate: ensure all nodes have `kind`
      return {
        ...loaded,
        nodes: loaded.nodes.map((n) =>
          (n as typeof n & { kind?: string }).kind ? n : { ...n, kind: 'formula' as const }
        ),
      };
    }
    return {
      nodes: [],
      connections: [],
      selectedNodeId: null,
      selectedConnectionId: null,
      panOffset: { x: 0, y: 0 },
      zoom: 1,
    };
  });

  const [connectionMode, setConnectionMode] = React.useState<ConnectionMode>('idle');
  const [connectionSourceId, setConnectionSourceId] = React.useState<string | null>(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [activeScenarioId, setActiveScenarioId] = React.useState<string | null>(null);
  const [activeFlowStepIndex, setActiveFlowStepIndex] = React.useState(0);
  const [paletteCollapsed, setPaletteCollapsed] = React.useState(() => {
    try { return localStorage.getItem('formula-studio-palette-collapsed') === 'true'; } catch { return false; }
  });
  const canvasRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    try { localStorage.setItem('formula-studio-palette-collapsed', String(paletteCollapsed)); } catch { /* ignore */ }
  }, [paletteCollapsed]);

  useEffect(() => { saveToStorage(state); }, [state]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  /* ── derived data ── */

  const formulaMap = useMemo(() => {
    const map = new Map<string, (typeof FORMULA_REGISTRY)[0]>();
    FORMULA_REGISTRY.forEach((f) => map.set(f.id, f));
    return map;
  }, []);

  /** Global variable scope from all input nodes */
  const varScope = useMemo(() => buildVarScope(state.nodes), [state.nodes]);

  /** Connection-aware computation results used by node badges and flow labels. */
  const dataflowGraph = useMemo(
    () => computeDataflowGraph(state.nodes, state.connections, varScope),
    [state.nodes, state.connections, varScope]
  );

  const graphResults = dataflowGraph.results;

  const activeScenario = useMemo(
    () => FORMULA_STUDIO_SCENARIOS.find((scenario) => scenario.id === activeScenarioId) ?? null,
    [activeScenarioId]
  );

  const activeFlowStep = activeScenario?.flowSteps[activeFlowStepIndex];

  const activeFlowNodeIds = useMemo(
    () => new Set(activeFlowStep?.nodeIds ?? []),
    [activeFlowStep]
  );

  const activeFlowConnectionIds = useMemo(
    () => new Set(activeFlowStep?.connectionIds ?? []),
    [activeFlowStep]
  );

  const selectedNode = useMemo(
    () => state.nodes.find((n) => n.id === state.selectedNodeId) ?? null,
    [state.nodes, state.selectedNodeId]
  );

  const selectedConnection = useMemo(
    () => state.connections.find((c) => c.id === state.selectedConnectionId) ?? null,
    [state.connections, state.selectedConnectionId]
  );

  /** Only meaningful for formula nodes */
  const selectedNodeFormula = useMemo(() => {
    if (!selectedNode || selectedNode.kind !== 'formula' || !selectedNode.formulaId) return null;
    return formulaMap.get(selectedNode.formulaId) ?? null;
  }, [selectedNode, formulaMap]);

  /* ── helpers for new node placement ── */

  function centerPosition() {
    const el = canvasRef.current;
    if (!el) return { x: 100, y: 100 };
    const cx = el.clientWidth / 2;
    const cy = el.clientHeight / 2;
    return {
      x: Math.max(0, (cx - state.panOffset.x) / state.zoom - 110),
      y: Math.max(0, (cy - state.panOffset.y) / state.zoom - 50),
    };
  }

  /* ── DnD from palette ── */

  const handleCanvasDrop = useCallback((_x: number, _y: number) => {
    // No longer needed — drop coordinates from dnd-kit are authoritative
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta, over } = event;
      const data = active.data.current;
      if (!data) return;

      if (data.type === 'palette-item' && data.formulaId) {
        if (over?.id !== 'canvas-drop-zone') return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const translated = active.rect.current.translated;
        if (!translated) return;

        const screenX = translated.left - rect.left + translated.width / 2;
        const screenY = translated.top - rect.top + translated.height / 2;

        const x = Math.max(0, (screenX - state.panOffset.x) / state.zoom - 140);
        const y = Math.max(0, (screenY - state.panOffset.y) / state.zoom - 60);
        dispatch({ type: 'ADD_NODE', formulaId: data.formulaId, position: { x, y } });

      } else if (data.type === 'canvas-node' && data.nodeId) {
        const node = state.nodes.find((n) => n.id === data.nodeId);
        if (node) {
          dispatch({
            type: 'MOVE_NODE',
            nodeId: data.nodeId,
            position: {
              x: node.position.x + delta.x / state.zoom,
              y: node.position.y + delta.y / state.zoom,
            },
          });
        }
      }
    },
    [state.nodes, state.zoom, state.panOffset.x, state.panOffset.y]
  );

  /* ── node handlers ── */

  const handleNodeSelect = useCallback((nodeId: string) => {
    if (connectionMode === 'idle') dispatch({ type: 'SELECT_NODE', nodeId });
  }, [connectionMode]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    dispatch({ type: 'DELETE_NODE', nodeId });
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, patch: { customTitle?: string; customLatex?: string }) => {
    dispatch({ type: 'UPDATE_NODE_CONTENT', nodeId, ...patch });
  }, []);

  const handleUpdateInputVar = useCallback((nodeId: string, varName: string, varValue: string) => {
    dispatch({ type: 'UPDATE_INPUT_VAR', nodeId, varName, varValue });
  }, []);

  const handleUpdateExpression = useCallback((nodeId: string, nodeExpression: string) => {
    dispatch({ type: 'UPDATE_NODE_EXPRESSION', nodeId, nodeExpression });
  }, []);

  /* ── toolbar node-add handlers ── */

  const handleAddInputNode = useCallback(() => {
    dispatch({ type: 'ADD_INPUT_NODE', position: centerPosition() });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.panOffset, state.zoom]);

  const handleAddExpressionNode = useCallback(() => {
    dispatch({ type: 'ADD_EXPRESSION_NODE', position: centerPosition() });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.panOffset, state.zoom]);

  /* ── connection handlers ── */

  const handleConnectionStart = useCallback((nodeId: string) => {
    if (connectionMode === 'idle' || connectionMode === 'selecting-source') {
      setConnectionMode('selecting-target');
      setConnectionSourceId(nodeId);
    } else if (connectionMode === 'selecting-target' && connectionSourceId === nodeId) {
      setConnectionMode('selecting-source');
      setConnectionSourceId(null);
    }
  }, [connectionMode, connectionSourceId]);

  const handleConnectionEnd = useCallback((nodeId: string) => {
    const success = connectionMode === 'selecting-target' && connectionSourceId && connectionSourceId !== nodeId;

    if (success) {
      dispatch({ type: 'ADD_CONNECTION', fromId: connectionSourceId, toId: nodeId, relationType: 'feeds-into', label: '→' });
      // Reset to selecting-source for chaining connections
      setConnectionMode('selecting-source');
      setConnectionSourceId(null);
    }
    // If failed (same node clicked, etc) - stay in selecting-target, don't reset
  }, [connectionMode, connectionSourceId]);

  const handleConnectionSelect = useCallback((connectionId: string) => {
    dispatch({ type: 'SELECT_CONNECTION', connectionId });
  }, []);

  const handleConnectionUpdate = useCallback((connectionId: string, patch: { relationType?: string; label?: string }) => {
    dispatch({ type: 'UPDATE_CONNECTION', connectionId, ...patch });
  }, []);

  const handleConnectionDelete = useCallback((connectionId: string) => {
    dispatch({ type: 'DELETE_CONNECTION', connectionId });
  }, []);

  /* ── canvas controls ── */

  const handleClearCanvas = useCallback(() => {
    dispatch({ type: 'CLEAR_CANVAS' });
    setActiveScenarioId(null);
    setActiveFlowStepIndex(0);
  }, []);

  const handleLoadScenario = useCallback((scenarioId: string) => {
    const scenario = FORMULA_STUDIO_SCENARIOS.find((item) => item.id === scenarioId);
    if (!scenario) return;

    const nextState = JSON.parse(JSON.stringify(scenario.state)) as CanvasState;
    dispatch({ type: 'LOAD_CANVAS', state: nextState });
    setConnectionMode('idle');
    setConnectionSourceId(null);
    setActiveScenarioId(scenarioId);
    setActiveFlowStepIndex(0);
  }, []);

  const handleAutoLayout = useCallback(() => {
    calculateAutoLayout(state.nodes, state.connections).forEach((node) => {
      dispatch({ type: 'MOVE_NODE', nodeId: node.id, position: node.position });
    });
  }, [state.nodes, state.connections]);

  const handleScreenshot = useCallback(async () => {
    const canvasArea = canvasRef.current;
    if (!canvasArea) return;
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(canvasArea, { backgroundColor: '#0f172a', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `formula-canvas-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Screenshot failed:', err);
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const handleZoomIn = useCallback(() => { dispatch({ type: 'SET_ZOOM', zoom: state.zoom + 0.1 }); }, [state.zoom]);
  const handleZoomOut = useCallback(() => { dispatch({ type: 'SET_ZOOM', zoom: state.zoom - 0.1 }); }, [state.zoom]);

  const handleFitView = useCallback(() => {
    if (state.nodes.length === 0) return;
    const bounds = getCanvasBounds(state.nodes);
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const padding = 60;
    const scaleX = (canvasEl.clientWidth - padding * 2) / bounds.width;
    const scaleY = (canvasEl.clientHeight - padding * 2) / bounds.height;
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    dispatch({ type: 'SET_ZOOM', zoom: newZoom });
    dispatch({ type: 'SET_PAN', offset: { x: padding - bounds.minX * newZoom, y: padding - bounds.minY * newZoom } });
  }, [state.nodes]);

  const handleToggleConnectionMode = useCallback(() => {
    if (connectionMode !== 'idle') { setConnectionMode('idle'); setConnectionSourceId(null); }
    else setConnectionMode('selecting-source');
  }, [connectionMode]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      dispatch({ type: 'SELECT_NODE', nodeId: null });
      dispatch({ type: 'SELECT_CONNECTION', connectionId: null });
      if (connectionMode !== 'idle') { setConnectionMode('idle'); setConnectionSourceId(null); }
    }
  }, [connectionMode]);

  /* ── keyboard shortcuts ── */

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      const currentState = stateRef.current;

      if (event.key === 'Escape') {
        dispatch({ type: 'SELECT_NODE', nodeId: null });
        dispatch({ type: 'SELECT_CONNECTION', connectionId: null });
        setConnectionMode('idle');
        setConnectionSourceId(null);
        return;
      }
      if (event.key.toLowerCase() === 'c') { event.preventDefault(); setConnectionSourceId(null); setConnectionMode(p => p === 'idle' ? 'selecting-source' : 'idle'); return; }
      if (event.key.toLowerCase() === 'a') { event.preventDefault(); calculateAutoLayout(currentState.nodes, currentState.connections).forEach(n => dispatch({ type: 'MOVE_NODE', nodeId: n.id, position: n.position })); return; }
      if (event.key.toLowerCase() === 'f') { event.preventDefault(); handleFitView(); return; }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); dispatch({ type: 'SET_ZOOM', zoom: currentState.zoom + 0.1 }); return; }
      if (event.key === '-') { event.preventDefault(); dispatch({ type: 'SET_ZOOM', zoom: currentState.zoom - 0.1 }); return; }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (currentState.selectedConnectionId) { event.preventDefault(); dispatch({ type: 'DELETE_CONNECTION', connectionId: currentState.selectedConnectionId }); return; }
        if (currentState.selectedNodeId) { event.preventDefault(); dispatch({ type: 'DELETE_NODE', nodeId: currentState.selectedNodeId }); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /* ── render ── */

  const selectedItemName = selectedConnection
    ? 'Connection'
    : selectedNode
    ? (selectedNodeFormula?.title ?? selectedNode.kind)
    : null;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full">
        <CanvasToolbar
          connectionMode={connectionMode}
          onToggleConnectionMode={handleToggleConnectionMode}
          onClearCanvas={handleClearCanvas}
          onScreenshot={handleScreenshot}
          onAutoLayout={handleAutoLayout}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onAddInputNode={handleAddInputNode}
          onAddExpressionNode={handleAddExpressionNode}
          scenarios={FORMULA_STUDIO_SCENARIOS}
          onLoadScenario={handleLoadScenario}
          zoom={state.zoom}
        />

        <div className="flex flex-1 overflow-hidden">
          <NodePalette
            formulas={FORMULA_REGISTRY}
            collapsed={paletteCollapsed}
            onToggleCollapse={() => setPaletteCollapsed((p) => !p)}
          />

          <DroppableCanvas onDrop={handleCanvasDrop}>
            <div
              ref={canvasRef}
              className="relative w-full h-full"
              style={{
                transform: `translate(${state.panOffset.x}px, ${state.panOffset.y}px) scale(${state.zoom})`,
                transformOrigin: 'top left',
              }}
              onClick={handleCanvasClick}
            >
              <ConnectionLines
                connections={state.connections}
                nodes={state.nodes}
                selectedConnectionId={state.selectedConnectionId}
                activeConnectionIds={activeFlowConnectionIds}
                nodeResults={graphResults}
                onSelectConnection={handleConnectionSelect}
              />

              {state.nodes.map((node) => {
                const isSelected = state.selectedNodeId === node.id;
                const isSource = connectionSourceId === node.id;
                const result = graphResults.get(node.id);

                if (node.kind === 'input') {
                  return (
                    <DraggableNode key={node.id} nodeId={node.id}>
                      <InputNode
                        node={node}
                        result={result}
                        isSelected={isSelected}
                        isConnectionSource={isSource}
                        isFlowActive={activeFlowNodeIds.has(node.id)}
                        connectionMode={connectionMode}
                        onSelect={handleNodeSelect}
                        onDelete={handleNodeDelete}
                        onConnectionStart={handleConnectionStart}
                        onConnectionEnd={handleConnectionEnd}
                        onUpdateVar={handleUpdateInputVar}
                      />
                    </DraggableNode>
                  );
                }

                if (node.kind === 'expression') {
                  return (
                    <DraggableNode key={node.id} nodeId={node.id}>
                      <ExpressionNode
                        node={node}
                        result={result}
                        isSelected={isSelected}
                        isConnectionSource={isSource}
                        isFlowActive={activeFlowNodeIds.has(node.id)}
                        connectionMode={connectionMode}
                        onSelect={handleNodeSelect}
                        onDelete={handleNodeDelete}
                        onConnectionStart={handleConnectionStart}
                        onConnectionEnd={handleConnectionEnd}
                        onUpdateExpression={handleUpdateExpression}
                      />
                    </DraggableNode>
                  );
                }

                // formula node
                const formula = node.formulaId ? formulaMap.get(node.formulaId) : undefined;
                if (!formula) return null;

                return (
                  <DraggableNode key={node.id} nodeId={node.id}>
                    <FormulaNode
                      node={node}
                      formula={formula}
                      isSelected={isSelected}
                      isConnectionSource={isSource}
                      isFlowActive={activeFlowNodeIds.has(node.id)}
                      result={result}
                      connectionMode={connectionMode}
                      onSelect={handleNodeSelect}
                      onDelete={handleNodeDelete}
                      onConnectionStart={handleConnectionStart}
                      onConnectionEnd={handleConnectionEnd}
                    />
                  </DraggableNode>
                );
              })}

              {state.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center space-y-3">
                    <div className="text-slate-500 text-sm font-medium">Canvas kosong</div>
                    <div className="text-slate-600 text-xs leading-relaxed space-y-1">
                      <p>Klik <span className="text-teal-400 font-medium">Input</span> untuk mendefinisikan variabel</p>
                      <p>Klik <span className="text-amber-400 font-medium">Ekspresi</span> untuk menulis formula</p>
                      <p>atau drag formula dari panel kiri</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {activeScenario && (
              <StudioFlowPanel
                scenario={activeScenario}
                activeStepIndex={activeFlowStepIndex}
                onStepChange={setActiveFlowStepIndex}
                onClose={() => setActiveScenarioId(null)}
              />
            )}
          </DroppableCanvas>

          {/* Right inspector — always present to prevent layout shift */}
          <div className="shrink-0 h-full">
            {selectedConnection ? (
              <ConnectionInspector
                connection={selectedConnection}
                onUpdate={handleConnectionUpdate}
                onDelete={handleConnectionDelete}
                onClose={() => dispatch({ type: 'SELECT_CONNECTION', connectionId: null })}
              />
            ) : selectedNode ? (
              <NodeInspector
                node={selectedNode}
                formula={selectedNodeFormula}
                computedResult={graphResults.get(selectedNode.id)}
                varScope={varScope}
                onUpdate={handleNodeUpdate}
                onUpdateInputVar={handleUpdateInputVar}
                onUpdateExpression={handleUpdateExpression}
                onDelete={handleNodeDelete}
                onClose={() => dispatch({ type: 'SELECT_NODE', nodeId: null })}
              />
            ) : (
              <aside className="w-96 shrink-0 border-l border-slate-700/50 bg-slate-900/80 flex flex-col gap-0 overflow-y-auto text-slate-100">
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-300">Tidak ada seleksi</div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pilih node atau koneksi di canvas untuk melihat detail dan properti.
                    </p>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>

        <CanvasStatusBar
          zoom={state.zoom}
          nodeCount={state.nodes.length}
          connectionCount={state.connections.length}
          selectedItem={selectedItemName}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
        />

        {connectionMode !== 'idle' && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-300 pointer-events-none">
            {connectionMode === 'selecting-source' ? 'Klik node sumber koneksi' : 'Klik node target koneksi'}
          </div>
        )}

        {isCapturing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
            <div className="text-white text-sm">Mengambil screenshot...</div>
          </div>
        )}
      </div>

      <DragOverlay>
        <div className="w-64 h-20 bg-slate-800 border border-cyan-500/50 rounded-lg shadow-xl opacity-90 flex items-center justify-center">
          <div className="text-cyan-400 text-xs">Drop di canvas</div>
        </div>
      </DragOverlay>
    </DndContext>
  );
};
