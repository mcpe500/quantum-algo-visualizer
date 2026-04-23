import React from 'react';
import type { CanvasNodeData } from './canvas-types';
import type { FormulaDefinition } from '../types';

interface NodeInspectorProps {
  node: CanvasNodeData | null;
  formula: FormulaDefinition | null;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  formula,
  onDelete,
  onClose,
}) => {
  if (!node || !formula) return null;

  return (
    <aside className="w-72 border-l border-slate-700/50 bg-slate-900/70 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Node</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-xs"
          type="button"
        >
          Close
        </button>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-slate-500">Formula</div>
        <div className="text-sm text-slate-100 font-medium">{formula.title}</div>
        <div className="text-xs text-slate-400">{formula.id}</div>
      </div>

      <div className="space-y-1 text-xs text-slate-400">
        <div>
          <span className="text-slate-500">Category:</span> {formula.category}
        </div>
        <div>
          <span className="text-slate-500">Position:</span>{' '}
          {Math.round(node.position.x)}, {Math.round(node.position.y)}
        </div>
        <div>
          <span className="text-slate-500">Size:</span> {Math.round(node.width)} × {Math.round(node.height)}
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed border border-slate-800/70 rounded p-2 bg-slate-950/40">
        {formula.description}
      </p>

      <button
        type="button"
        onClick={() => onDelete(node.id)}
        className="mt-auto px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-xs hover:bg-red-500/20"
      >
        Delete Node
      </button>
    </aside>
  );
};
