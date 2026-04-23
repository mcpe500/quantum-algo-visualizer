import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { toPng } from 'html-to-image';
import type { CanvasState, ConnectionMode } from './canvas-types';
import { FORMULA_REGISTRY } from '../registry';
import { canvasReducer } from './useCanvasReducer';
import { calculateAutoLayout, getCanvasBounds } from './canvasUtils';
import { CanvasToolbar } from './CanvasToolbar';
import { NodePalette } from './NodePalette';
import { FormulaNode } from './FormulaNode';
import { ConnectionLines } from './ConnectionLines';
import { ConnectionInspector } from './ConnectionInspector';
import { NodeInspector } from './NodeInspector';

const STORAGE_KEY = 'formula-studio-canvas';

function loadFromStorage(): CanvasState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return null;
}

function saveToStorage(state: CanvasState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

interface DroppableCanvasProps {
  children: React.ReactNode;
  onDrop: (x: number, y: number) => void;
}

const DroppableCanvas: React.FC<DroppableCanvasProps> = ({ children, onDrop }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isOver) {
        const rect = (e.target as HTMLElement).closest('.canvas-area')?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          onDrop(x, y);
        }
      }
    },
    [isOver, onDrop]
  );

  return (
    <div
      ref={setNodeRef}
      className={`canvas-area flex-1 relative overflow-auto bg-slate-900/50 ${isOver ? 'bg-cyan-500/5' : ''}`}
      onPointerUp={handlePointerUp}
      style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}
    >
      {children}
    </div>
  );
};

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
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-80' : ''}`} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

export const StudioCanvas: React.FC = () => {
  const [state, dispatch] = React.useReducer(canvasReducer, null, () => {
    const loaded = loadFromStorage();
    return loaded || {
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const dropPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const formulaMap = useMemo(() => {
    const map = new Map<string, (typeof FORMULA_REGISTRY)[0]>();
    FORMULA_REGISTRY.forEach((f) => map.set(f.id, f));
    return map;
  }, []);

  const handleCanvasDrop = useCallback((x: number, y: number) => {
    dropPointRef.current = { x, y };
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta, over } = event;
      const data = active.data.current;
      if (!data) return;

      if (data.type === 'palette-item' && data.formulaId) {
        if (over?.id !== 'canvas-drop-zone') {
          dropPointRef.current = null;
          return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        let screenX: number;
        let screenY: number;

        if (dropPointRef.current) {
          screenX = dropPointRef.current.x;
          screenY = dropPointRef.current.y;
        } else {
          const translated = active.rect.current.translated;
          if (!translated) {
            dropPointRef.current = null;
            return;
          }
          screenX = translated.left - rect.left + translated.width / 2;
          screenY = translated.top - rect.top + translated.height / 2;
        }

        const x = Math.max(0, (screenX - state.panOffset.x) / state.zoom - 140);
        const y = Math.max(0, (screenY - state.panOffset.y) / state.zoom - 60);

        dispatch({ type: 'ADD_NODE', formulaId: data.formulaId, position: { x, y } });
        dropPointRef.current = null;
      } else if (data.type === 'canvas-node' && data.nodeId) {
        const node = state.nodes.find((n) => n.id === data.nodeId);
        if (node) {
          const worldDx = delta.x / state.zoom;
          const worldDy = delta.y / state.zoom;
          dispatch({
            type: 'MOVE_NODE',
            nodeId: data.nodeId,
            position: {
              x: node.position.x + worldDx,
              y: node.position.y + worldDy,
            },
          });
        }
      }
    },
    [state.nodes, state.zoom, state.panOffset.x, state.panOffset.y]
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      if (connectionMode === 'idle') {
        dispatch({ type: 'SELECT_NODE', nodeId });
      }
    },
    [connectionMode]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      dispatch({ type: 'DELETE_NODE', nodeId });
    },
    []
  );

  const handleConnectionStart = useCallback(
    (nodeId: string) => {
      if (connectionMode === 'idle') {
        setConnectionMode('selecting-target');
        setConnectionSourceId(nodeId);
      } else if (connectionMode === 'selecting-source') {
        setConnectionMode('selecting-target');
        setConnectionSourceId(nodeId);
      } else if (connectionMode === 'selecting-target') {
        if (connectionSourceId === nodeId) {
          setConnectionMode('selecting-source');
          setConnectionSourceId(null);
        }
      }
    },
    [connectionMode, connectionSourceId]
  );

  const handleConnectionEnd = useCallback(
    (nodeId: string) => {
      if (connectionMode === 'selecting-target' && connectionSourceId && connectionSourceId !== nodeId) {
        const sourceNode = state.nodes.find((n) => n.id === connectionSourceId);
        const targetNode = state.nodes.find((n) => n.id === nodeId);
        if (sourceNode && targetNode) {
          dispatch({
            type: 'ADD_CONNECTION',
            fromId: connectionSourceId,
            toId: nodeId,
            relationType: 'related',
            label: 'related',
          });
        }
      }
      setConnectionMode('selecting-source');
      setConnectionSourceId(null);
    },
    [connectionMode, connectionSourceId, state.nodes]
  );

  const handleConnectionSelect = useCallback((connectionId: string) => {
    dispatch({ type: 'SELECT_CONNECTION', connectionId });
  }, []);

  const handleConnectionUpdate = useCallback(
    (connectionId: string, patch: { relationType?: string; label?: string }) => {
      dispatch({
        type: 'UPDATE_CONNECTION',
        connectionId,
        relationType: patch.relationType,
        label: patch.label,
      });
    },
    []
  );

  const handleConnectionDelete = useCallback((connectionId: string) => {
    dispatch({ type: 'DELETE_CONNECTION', connectionId });
  }, []);

  const handleClearCanvas = useCallback(() => {
    dispatch({ type: 'CLEAR_CANVAS' });
  }, []);

  const handleAutoLayout = useCallback(() => {
    const newNodes = calculateAutoLayout(state.nodes, state.connections);
    newNodes.forEach((node) => {
      dispatch({ type: 'MOVE_NODE', nodeId: node.id, position: node.position });
    });
  }, [state.nodes, state.connections]);

  const handleScreenshot = useCallback(async () => {
    const canvasArea = canvasRef.current;
    if (!canvasArea) return;

    setIsCapturing(true);
    try {
      const dataUrl = await toPng(canvasArea, {
        backgroundColor: '#0f172a',
        pixelRatio: 2,
      });

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

  const handleZoomIn = useCallback(() => {
    dispatch({ type: 'SET_ZOOM', zoom: state.zoom + 0.1 });
  }, [state.zoom]);

  const handleZoomOut = useCallback(() => {
    dispatch({ type: 'SET_ZOOM', zoom: state.zoom - 0.1 });
  }, [state.zoom]);

  const handleFitView = useCallback(() => {
    if (state.nodes.length === 0) return;
    const bounds = getCanvasBounds(state.nodes);
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const containerWidth = canvasEl.clientWidth;
    const containerHeight = canvasEl.clientHeight;
    const padding = 60;

    const scaleX = (containerWidth - padding * 2) / bounds.width;
    const scaleY = (containerHeight - padding * 2) / bounds.height;
    const newZoom = Math.min(scaleX, scaleY, 1.5);

    dispatch({ type: 'SET_ZOOM', zoom: newZoom });
    dispatch({
      type: 'SET_PAN',
      offset: {
        x: padding - bounds.minX * newZoom,
        y: padding - bounds.minY * newZoom,
      },
    });
  }, [state.nodes]);

  const handleToggleConnectionMode = useCallback(() => {
    if (connectionMode !== 'idle') {
      setConnectionMode('idle');
      setConnectionSourceId(null);
    } else {
      setConnectionMode('selecting-source');
    }
  }, [connectionMode]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        dispatch({ type: 'SELECT_NODE', nodeId: null });
        dispatch({ type: 'SELECT_CONNECTION', connectionId: null });
        if (connectionMode !== 'idle') {
          setConnectionMode('idle');
          setConnectionSourceId(null);
        }
      }
    },
    [connectionMode]
  );

  const selectedNode = useMemo(
    () => state.nodes.find((node) => node.id === state.selectedNodeId) ?? null,
    [state.nodes, state.selectedNodeId]
  );

  const selectedConnection = useMemo(
    () => state.connections.find((conn) => conn.id === state.selectedConnectionId) ?? null,
    [state.connections, state.selectedConnectionId]
  );

  const selectedNodeFormula = useMemo(() => {
    if (!selectedNode) return null;
    return formulaMap.get(selectedNode.formulaId) ?? null;
  }, [selectedNode, formulaMap]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if (isTyping) return;

      if (event.key === 'Escape') {
        dispatch({ type: 'SELECT_NODE', nodeId: null });
        dispatch({ type: 'SELECT_CONNECTION', connectionId: null });
        setConnectionMode('idle');
        setConnectionSourceId(null);
        return;
      }

      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        setConnectionSourceId(null);
        setConnectionMode((prev) => (prev === 'idle' ? 'selecting-source' : 'idle'));
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (state.selectedConnectionId) {
          event.preventDefault();
          dispatch({ type: 'DELETE_CONNECTION', connectionId: state.selectedConnectionId });
          return;
        }
        if (state.selectedNodeId) {
          event.preventDefault();
          dispatch({ type: 'DELETE_NODE', nodeId: state.selectedNodeId });
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.selectedConnectionId, state.selectedNodeId]);

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
          zoom={state.zoom}
        />

        <div className="flex flex-1 overflow-hidden">
          <NodePalette formulas={FORMULA_REGISTRY} />

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
                onSelectConnection={handleConnectionSelect}
              />

              {state.nodes.map((node) => {
                const formula = formulaMap.get(node.formulaId);
                if (!formula) return null;

                return (
                  <DraggableNode key={node.id} nodeId={node.id}>
                    <FormulaNode
                      node={node}
                      formula={formula}
                      isSelected={state.selectedNodeId === node.id}
                      isConnectionSource={connectionSourceId === node.id}
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
                  <div className="text-center">
                    <div className="text-slate-500 text-sm mb-2">Canvas is empty</div>
                    <div className="text-slate-600 text-xs">Drag formulas from the left panel to add them</div>
                  </div>
                </div>
              )}
            </div>
          </DroppableCanvas>

          {selectedConnection && (
            <ConnectionInspector
              connection={selectedConnection}
              onUpdate={handleConnectionUpdate}
              onDelete={handleConnectionDelete}
              onClose={() => dispatch({ type: 'SELECT_CONNECTION', connectionId: null })}
            />
          )}

          {!selectedConnection && selectedNode && selectedNodeFormula && (
            <NodeInspector
              node={selectedNode}
              formula={selectedNodeFormula}
              onDelete={handleNodeDelete}
              onClose={() => dispatch({ type: 'SELECT_NODE', nodeId: null })}
            />
          )}
        </div>

        {connectionMode !== 'idle' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-xs text-cyan-300">
            {connectionMode === 'selecting-source'
              ? 'Click a node to select as connection source'
              : 'Click a node to connect as target'}
          </div>
        )}

        {isCapturing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-sm">Capturing canvas...</div>
          </div>
        )}
      </div>

      <DragOverlay>
        <div className="w-64 h-20 bg-slate-800 border border-cyan-500/50 rounded-lg shadow-xl opacity-90 flex items-center justify-center">
          <div className="text-cyan-400 text-xs">Drop on canvas</div>
        </div>
      </DragOverlay>
    </DndContext>
  );
};
