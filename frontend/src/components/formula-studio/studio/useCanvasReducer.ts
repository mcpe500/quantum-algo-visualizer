import type { CanvasState, CanvasAction } from './canvas-types';
import { INITIAL_CANVAS_STATE } from './canvas-types';

function generateId(): string {
  return crypto.randomUUID();
}

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'ADD_NODE': {
      const newNode = {
        id: generateId(),
        formulaId: action.formulaId,
        position: action.position,
        width: 280,
        height: 120,
      };
      return {
        ...state,
        nodes: [...state.nodes, newNode],
        selectedNodeId: newNode.id,
        selectedConnectionId: null,
      };
    }

    case 'MOVE_NODE': {
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === action.nodeId
            ? { ...node, position: action.position }
            : node
        ),
      };
    }

    case 'UPDATE_NODE_CONTENT': {
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === action.nodeId
            ? {
                ...node,
                customTitle: action.customTitle ?? node.customTitle,
                customLatex: action.customLatex ?? node.customLatex,
              }
            : node
        ),
      };
    }

    case 'UPDATE_NODE_SIZE': {
      return {
        ...state,
        nodes: state.nodes.map((node) =>
          node.id === action.nodeId
            ? { ...node, width: action.width, height: action.height }
            : node
        ),
      };
    }

    case 'DELETE_NODE': {
      const removedConnectionIds = new Set(
        state.connections
          .filter((conn) => conn.fromId === action.nodeId || conn.toId === action.nodeId)
          .map((conn) => conn.id)
      );
      return {
        ...state,
        nodes: state.nodes.filter((node) => node.id !== action.nodeId),
        connections: state.connections.filter(
          (conn) => conn.fromId !== action.nodeId && conn.toId !== action.nodeId
        ),
        selectedNodeId: state.selectedNodeId === action.nodeId ? null : state.selectedNodeId,
        selectedConnectionId:
          state.selectedConnectionId && removedConnectionIds.has(state.selectedConnectionId)
            ? null
            : state.selectedConnectionId,
      };
    }

    case 'SELECT_NODE': {
      return {
        ...state,
        selectedNodeId: action.nodeId,
        selectedConnectionId: null,
      };
    }

    case 'ADD_CONNECTION': {
      const existingConnection = state.connections.find(
        (c) => c.fromId === action.fromId && c.toId === action.toId
      );
      if (existingConnection) return state;

      const newConnection = {
        id: generateId(),
        fromId: action.fromId,
        toId: action.toId,
        relationType: action.relationType,
        label: action.label,
      };
      return {
        ...state,
        connections: [...state.connections, newConnection],
        selectedConnectionId: newConnection.id,
        selectedNodeId: null,
      };
    }

    case 'UPDATE_CONNECTION': {
      return {
        ...state,
        connections: state.connections.map((conn) =>
          conn.id === action.connectionId
            ? {
                ...conn,
                relationType: action.relationType ?? conn.relationType,
                label: action.label ?? conn.label,
              }
            : conn
        ),
      };
    }

    case 'DELETE_CONNECTION': {
      return {
        ...state,
        connections: state.connections.filter((conn) => conn.id !== action.connectionId),
        selectedConnectionId: state.selectedConnectionId === action.connectionId ? null : state.selectedConnectionId,
      };
    }

    case 'SELECT_CONNECTION': {
      return {
        ...state,
        selectedConnectionId: action.connectionId,
        selectedNodeId: null,
      };
    }

    case 'CLEAR_CANVAS': {
      return {
        ...INITIAL_CANVAS_STATE,
      };
    }

    case 'LOAD_CANVAS': {
      return action.state;
    }

    case 'SET_PAN': {
      return {
        ...state,
        panOffset: action.offset,
      };
    }

    case 'SET_ZOOM': {
      const clampedZoom = Math.max(0.5, Math.min(2, action.zoom));
      return {
        ...state,
        zoom: clampedZoom,
      };
    }

    default:
      return state;
  }
}
