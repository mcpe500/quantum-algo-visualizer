import type { FormulaDefinition } from '../types';

// ─── node kind ───────────────────────────────────────────────────────────────

export type CanvasNodeKind = 'formula' | 'input' | 'expression';

// ─── core data ───────────────────────────────────────────────────────────────

export interface CanvasNodeData {
  id: string;
  kind: CanvasNodeKind;
  /** Only present when kind === 'formula' */
  formulaId?: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  customTitle?: string;
  customLatex?: string;
  /** kind === 'input': the variable symbol published to the global scope, e.g. "n" */
  varName?: string;
  /** kind === 'input': the string-encoded numeric value, e.g. "4" */
  varValue?: string;
  /** kind === 'expression': the math expression string, e.g. "n*(n+1)/2" */
  nodeExpression?: string;
}

export interface CanvasConnection {
  id: string;
  fromId: string;
  toId: string;
  relationType: string;
  label: string;
  fromPort?: string;
  toPort?: string;
}

export interface CanvasState {
  nodes: CanvasNodeData[];
  connections: CanvasConnection[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  panOffset: { x: number; y: number };
  zoom: number;
}

export type ConnectionMode = 'idle' | 'selecting-source' | 'selecting-target';

export type CanvasAction =
  // ── formula nodes (existing) ──
  | { type: 'ADD_NODE'; formulaId: string; position: { x: number; y: number } }
  // ── new node types ──
  | { type: 'ADD_INPUT_NODE'; position: { x: number; y: number } }
  | { type: 'ADD_EXPRESSION_NODE'; position: { x: number; y: number } }
  | { type: 'UPDATE_INPUT_VAR'; nodeId: string; varName?: string; varValue?: string }
  | { type: 'UPDATE_NODE_EXPRESSION'; nodeId: string; nodeExpression: string }
  // ── shared ──
  | { type: 'MOVE_NODE'; nodeId: string; position: { x: number; y: number } }
  | { type: 'UPDATE_NODE_CONTENT'; nodeId: string; customTitle?: string; customLatex?: string }
  | { type: 'UPDATE_NODE_SIZE'; nodeId: string; width: number; height: number }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'SELECT_NODE'; nodeId: string | null }
  | { type: 'ADD_CONNECTION'; fromId: string; toId: string; relationType: string; label: string }
  | { type: 'UPDATE_CONNECTION'; connectionId: string; relationType?: string; label?: string }
  | { type: 'DELETE_CONNECTION'; connectionId: string }
  | { type: 'SELECT_CONNECTION'; connectionId: string | null }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'LOAD_CANVAS'; state: CanvasState }
  | { type: 'SET_PAN'; offset: { x: number; y: number } }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_CONNECTION_MODE'; mode: ConnectionMode }
  | { type: 'SET_CONNECTION_SOURCE'; nodeId: string | null };

export const INITIAL_CANVAS_STATE: CanvasState = {
  nodes: [],
  connections: [],
  selectedNodeId: null,
  selectedConnectionId: null,
  panOffset: { x: 0, y: 0 },
  zoom: 1.0,
};

/** @deprecated use CanvasNodeData directly */
export interface CanvasNode extends CanvasNodeData {
  formula: FormulaDefinition;
}

export const NODE_WIDTH = 280;
export const INPUT_NODE_WIDTH = 220;
export const EXPRESSION_NODE_WIDTH = 260;
export const NODE_MIN_HEIGHT = 120;
export const ANCHOR_RADIUS = 8;

export const RELATION_COLORS: Record<string, string> = {
  'quantum-version': 'stroke-cyan-400',
  'derived-from': 'stroke-cyan-400',
  'implements': 'stroke-cyan-400',
  'contrast-with': 'stroke-orange-400',
  'compares': 'stroke-orange-400',
  'related': 'stroke-slate-400',
  'same-concept': 'stroke-slate-400',
  'equivalent': 'stroke-purple-400',
  'uses': 'stroke-purple-400',
  'algorithm': 'stroke-purple-400',
  'generalizes': 'stroke-blue-400',
  'specializes': 'stroke-blue-400',
  'computed-by': 'stroke-green-400',
  'result': 'stroke-green-400',
  'encoded-in': 'stroke-green-400',
  'quantized': 'stroke-green-400',
  'discretized': 'stroke-green-400',
  'derives': 'stroke-yellow-400',
  'target': 'stroke-yellow-400',
  'used-in': 'stroke-yellow-400',
  'feeds-into': 'stroke-teal-400',
  'outputs-to': 'stroke-teal-400',
};

export const RELATION_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'related', label: 'Related' },
  { value: 'implements', label: 'Implements' },
  { value: 'derived-from', label: 'Derived From' },
  { value: 'derives', label: 'Derives' },
  { value: 'equivalent', label: 'Equivalent' },
  { value: 'same-concept', label: 'Same Concept' },
  { value: 'uses', label: 'Uses' },
  { value: 'used-in', label: 'Used In' },
  { value: 'result', label: 'Result' },
  { value: 'target', label: 'Target' },
  { value: 'feeds-into', label: 'Feeds Into' },
  { value: 'outputs-to', label: 'Outputs To' },
  { value: 'quantum-version', label: 'Quantum Version' },
  { value: 'specializes', label: 'Specializes' },
  { value: 'generalizes', label: 'Generalizes' },
  { value: 'contrast-with', label: 'Contrast With' },
  { value: 'compares', label: 'Compares' },
  { value: 'algorithm', label: 'Algorithm' },
  { value: 'computed-by', label: 'Computed By' },
  { value: 'encoded-in', label: 'Encoded In' },
  { value: 'quantized', label: 'Quantized' },
  { value: 'discretized', label: 'Discretized' },
];

export const DEFAULT_RELATION_TYPE = 'related';
