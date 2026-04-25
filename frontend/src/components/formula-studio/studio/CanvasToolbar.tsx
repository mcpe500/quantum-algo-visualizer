import React from 'react';
import {
  Camera,
  FlaskRound,
  LayoutGrid,
  Variable,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Link2,
  Unlink,
  MousePointer2,
  Trash2,
  Screenshot,
} from 'lucide-react';
import type { ConnectionMode } from './canvas-types';

interface CanvasToolbarProps {
  connectionMode: ConnectionMode;
  onToggleConnectionMode: () => void;
  onClearCanvas: () => void;
  onScreenshot: () => void;
  onAutoLayout: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onAddInputNode: () => void;
  onAddExpressionNode: () => void;
  zoom: number;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  connectionMode,
  onToggleConnectionMode,
  onClearCanvas,
  onScreenshot,
  onAutoLayout,
  onZoomIn,
  onZoomOut,
  onFitView,
  onAddInputNode,
  onAddExpressionNode,
  zoom,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800/60 gap-2">
      {/* LEFT: Primary node creation */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onAddInputNode}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-teal-500/15 border border-teal-500/40 text-teal-300 hover:bg-teal-500/25 hover:border-teal-400/60 transition-colors"
          title="Tambah node variabel input (I)"
        >
          <Variable className="w-3.5 h-3.5" />
          Input
        </button>

        <button
          onClick={onAddExpressionNode}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 hover:border-amber-400/60 transition-colors"
          title="Tambah node ekspresi komputasi (E)"
        >
          <FlaskRound className="w-3.5 h-3.5" />
          Ekspresi
        </button>

        <div className="w-px h-5 bg-slate-700/50 mx-0.5" />

        <button
          onClick={onToggleConnectionMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            connectionMode !== 'idle'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
          title="Draw connections between nodes (C)"
        >
          {connectionMode === 'idle' ? <Link2 className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
          {connectionMode === 'idle' ? 'Connect' : 'Cancel'}
        </button>

        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors"
          title="Auto-arrange nodes (A)"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Auto
        </button>
      </div>

      {/* CENTER: View controls */}
      <div className="flex items-center gap-1 px-2 py-1 bg-slate-950/50 rounded-md border border-slate-800/60">
        <button
          onClick={onZoomOut}
          className="p-1 text-slate-400 hover:text-white transition-colors"
          title="Zoom out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onFitView}
          className="text-xs text-slate-400 w-10 text-center tabular-nums hover:text-white transition-colors"
          title="Fit to view (F)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          className="p-1 text-slate-400 hover:text-white transition-colors"
          title="Zoom in (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* RIGHT: Utility actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onScreenshot}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors"
          title="Capture canvas as image"
        >
          <Camera className="w-3.5 h-3.5" />
          Screenshot
        </button>

        <div className="w-px h-5 bg-slate-700/50 mx-0.5" />

        <button
          onClick={onClearCanvas}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
          title="Clear all nodes and connections"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </div>
  );
};
