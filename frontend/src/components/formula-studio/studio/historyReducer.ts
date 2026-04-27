import type { CanvasAction, CanvasState } from './canvas-types';
import { canvasReducer } from './useCanvasReducer';

const MAX_HISTORY_DEPTH = 50;

const HISTORY_ACTION_TYPES = new Set<CanvasAction['type']>([
  'ADD_NODE',
  'ADD_INPUT_NODE',
  'ADD_EXPRESSION_NODE',
  'UPDATE_INPUT_VAR',
  'UPDATE_NODE_EXPRESSION',
  'MOVE_NODE',
  'UPDATE_NODE_CONTENT',
  'UPDATE_NODE_SIZE',
  'DELETE_NODE',
  'ADD_CONNECTION',
  'UPDATE_CONNECTION',
  'DELETE_CONNECTION',
  'CLEAR_CANVAS',
  'LOAD_CANVAS',
]);

export interface CanvasHistoryState {
  past: CanvasState[];
  present: CanvasState;
  future: CanvasState[];
}

export type CanvasHistoryAction =
  | CanvasAction
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET_HISTORY'; state: CanvasState };

function canvasSnapshot(state: CanvasState): string {
  return JSON.stringify({
    nodes: state.nodes,
    connections: state.connections,
    panOffset: state.panOffset,
    zoom: state.zoom,
  });
}

function pushHistory(past: CanvasState[], present: CanvasState): CanvasState[] {
  const nextPast = [...past, present];
  return nextPast.length > MAX_HISTORY_DEPTH
    ? nextPast.slice(nextPast.length - MAX_HISTORY_DEPTH)
    : nextPast;
}

export function createCanvasHistory(initialState: CanvasState): CanvasHistoryState {
  return {
    past: [],
    present: initialState,
    future: [],
  };
}

export function canvasHistoryReducer(
  history: CanvasHistoryState,
  action: CanvasHistoryAction,
): CanvasHistoryState {
  if (action.type === 'UNDO') {
    const previous = history.past[history.past.length - 1];
    if (!previous) return history;
    return {
      past: history.past.slice(0, -1),
      present: previous,
      future: [history.present, ...history.future].slice(0, MAX_HISTORY_DEPTH),
    };
  }

  if (action.type === 'REDO') {
    const next = history.future[0];
    if (!next) return history;
    return {
      past: pushHistory(history.past, history.present),
      present: next,
      future: history.future.slice(1),
    };
  }

  if (action.type === 'RESET_HISTORY') {
    return createCanvasHistory(action.state);
  }

  const nextPresent = canvasReducer(history.present, action);
  const shouldRecord = HISTORY_ACTION_TYPES.has(action.type);

  if (!shouldRecord || canvasSnapshot(nextPresent) === canvasSnapshot(history.present)) {
    return {
      ...history,
      present: nextPresent,
    };
  }

  return {
    past: pushHistory(history.past, history.present),
    present: nextPresent,
    future: [],
  };
}
