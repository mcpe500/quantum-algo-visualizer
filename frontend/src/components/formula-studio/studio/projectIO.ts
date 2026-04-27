import type { CanvasConnection, CanvasNodeData, CanvasState } from './canvas-types';
import { INITIAL_CANVAS_STATE } from './canvas-types';
import { downloadBlob } from '../../../utils/download';

export const FORMULA_STUDIO_PROJECT_VERSION = 1;

export interface FormulaStudioProjectFile {
  app: 'quantum-algo-visualizer';
  kind: 'formula-studio-project';
  version: typeof FORMULA_STUDIO_PROJECT_VERSION;
  exportedAt: string;
  metadata: {
    nodeCount: number;
    connectionCount: number;
  };
  canvas: CanvasState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizeNode(value: unknown): CanvasNodeData | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === 'string' ? value.id : '';
  const kind = value.kind === 'input' || value.kind === 'expression' || value.kind === 'formula'
    ? value.kind
    : 'formula';
  const position = isRecord(value.position) ? value.position : {};
  const width = toNumber(value.width, kind === 'input' ? 220 : kind === 'expression' ? 260 : 280);
  const height = toNumber(value.height, kind === 'input' ? 90 : kind === 'expression' ? 110 : 120);
  if (!id) return null;

  return {
    id,
    kind,
    formulaId: typeof value.formulaId === 'string' ? value.formulaId : undefined,
    position: {
      x: toNumber(position.x, 0),
      y: toNumber(position.y, 0),
    },
    width,
    height,
    customTitle: typeof value.customTitle === 'string' ? value.customTitle : undefined,
    customLatex: typeof value.customLatex === 'string' ? value.customLatex : undefined,
    varName: typeof value.varName === 'string' ? value.varName : undefined,
    varValue: typeof value.varValue === 'string' ? value.varValue : undefined,
    nodeExpression: typeof value.nodeExpression === 'string' ? value.nodeExpression : undefined,
  };
}

function sanitizeConnection(value: unknown, nodeIds: Set<string>): CanvasConnection | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === 'string' ? value.id : '';
  const fromId = typeof value.fromId === 'string' ? value.fromId : '';
  const toId = typeof value.toId === 'string' ? value.toId : '';
  if (!id || !nodeIds.has(fromId) || !nodeIds.has(toId)) return null;

  return {
    id,
    fromId,
    toId,
    relationType: typeof value.relationType === 'string' ? value.relationType : 'related',
    label: typeof value.label === 'string' ? value.label : 'related',
    fromPort: typeof value.fromPort === 'string' ? value.fromPort : undefined,
    toPort: typeof value.toPort === 'string' ? value.toPort : undefined,
  };
}

export function normalizeImportedCanvasState(raw: unknown): CanvasState {
  if (!isRecord(raw)) throw new Error('Format project tidak valid. Root JSON harus berupa object.');

  const nodesRaw = Array.isArray(raw.nodes) ? raw.nodes : [];
  const nodes = nodesRaw.map(sanitizeNode).filter((node): node is CanvasNodeData => node !== null);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const connectionsRaw = Array.isArray(raw.connections) ? raw.connections : [];
  const connections = connectionsRaw
    .map((connection) => sanitizeConnection(connection, nodeIds))
    .filter((connection): connection is CanvasConnection => connection !== null);
  const panOffset = isRecord(raw.panOffset) ? raw.panOffset : INITIAL_CANVAS_STATE.panOffset;

  return {
    nodes,
    connections,
    selectedNodeId: null,
    selectedConnectionId: null,
    panOffset: {
      x: toNumber(panOffset.x, INITIAL_CANVAS_STATE.panOffset.x),
      y: toNumber(panOffset.y, INITIAL_CANVAS_STATE.panOffset.y),
    },
    zoom: Math.max(0.25, Math.min(3, toNumber(raw.zoom, INITIAL_CANVAS_STATE.zoom))),
  };
}

export function createProjectPayload(state: CanvasState): FormulaStudioProjectFile {
  return {
    app: 'quantum-algo-visualizer',
    kind: 'formula-studio-project',
    version: FORMULA_STUDIO_PROJECT_VERSION,
    exportedAt: new Date().toISOString(),
    metadata: {
      nodeCount: state.nodes.length,
      connectionCount: state.connections.length,
    },
    canvas: normalizeImportedCanvasState(state),
  };
}

export function downloadCanvasProject(state: CanvasState): void {
  const payload = createProjectPayload(state);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadBlob(blob, `formula-studio-${stamp}.qav-project`);
}

export async function readProjectFile(file: File): Promise<CanvasState> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('File project bukan JSON valid.');
  }

  if (isRecord(parsed) && parsed.kind === 'formula-studio-project' && isRecord(parsed.canvas)) {
    return normalizeImportedCanvasState(parsed.canvas);
  }

  return normalizeImportedCanvasState(parsed);
}
