import React from 'react';
import { X, Camera, LayoutGrid, ZoomIn, ZoomOut, Maximize, Link2, Unlink } from 'lucide-react';
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
  zoom,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/50">
      <div className="flex items-center gap-2">
        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors"
          title="Auto-arrange nodes"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Auto Layout
        </button>

        <div className="w-px h-5 bg-slate-600/50" />

        <button
          onClick={onToggleConnectionMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            connectionMode !== 'idle'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
          title="Draw connections between nodes"
        >
          {connectionMode === 'idle' ? <Link2 className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
          {connectionMode === 'idle' ? 'Connect' : 'Cancel'}
        </button>
      </div>

      <div className="flex items-center gap-1 px-3 py-1 bg-slate-900/50 rounded-md">
        <button
          onClick={onZoomOut}
          className="p-1 text-slate-400 hover:text-white transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={onZoomIn}
          className="p-1 text-slate-400 hover:text-white transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onFitView}
          className="p-1 text-slate-400 hover:text-white transition-colors ml-1"
          title="Fit to view"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onScreenshot}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors"
          title="Capture canvas as image"
        >
          <Camera className="w-3.5 h-3.5" />
          Screenshot
        </button>

        <button
          onClick={onClearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
          title="Clear all nodes and connections"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </div>
  );
};