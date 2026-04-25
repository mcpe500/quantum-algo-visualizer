import React from 'react';
import type { CanvasConnection } from './canvas-types';
import { RELATION_TYPE_OPTIONS } from './canvas-types';

interface ConnectionInspectorProps {
  connection: CanvasConnection | null;
  onUpdate: (connectionId: string, patch: { relationType?: string; label?: string }) => void;
  onDelete: (connectionId: string) => void;
  onClose: () => void;
}

export const ConnectionInspector: React.FC<ConnectionInspectorProps> = ({
  connection,
  onUpdate,
  onDelete,
  onClose,
}) => {
  if (!connection) return null;

  return (
    <aside className="w-96 shrink-0 border-l border-slate-700/50 bg-slate-900/70 p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Connection</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-xs"
          type="button"
        >
          Close
        </button>
      </div>

      <div className="text-xs text-slate-400 space-y-1">
        <div>
          <span className="text-slate-500">From:</span> {connection.fromId}
        </div>
        <div>
          <span className="text-slate-500">To:</span> {connection.toId}
        </div>
      </div>

      <label className="text-xs text-slate-300 space-y-1">
        <span className="block">Relation Type</span>
        <select
          value={connection.relationType}
          onChange={(e) => onUpdate(connection.id, { relationType: e.target.value })}
          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs"
        >
          {RELATION_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs text-slate-300 space-y-1">
        <span className="block">Label</span>
        <input
          type="text"
          value={connection.label}
          onChange={(e) => onUpdate(connection.id, { label: e.target.value })}
          className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs"
          placeholder="related"
        />
      </label>

      <button
        type="button"
        onClick={() => onDelete(connection.id)}
        className="mt-auto px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-xs hover:bg-red-500/20"
      >
        Delete Connection
      </button>
    </aside>
  );
};
