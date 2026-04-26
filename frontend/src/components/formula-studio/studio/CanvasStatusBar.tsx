import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface CanvasStatusBarProps {
  zoom: number;
  nodeCount: number;
  connectionCount: number;
  selectedItem: string | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export const CanvasStatusBar: React.FC<CanvasStatusBarProps> = ({
  zoom,
  nodeCount,
  connectionCount,
  selectedItem,
  onZoomIn,
  onZoomOut,
  onFitView,
}) => {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-t border-slate-800/60 text-[11px] text-slate-500 select-none shrink-0">
      <div className="flex items-center gap-3">
        <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
        <span>{connectionCount} connection{connectionCount !== 1 ? 's' : ''}</span>
        {selectedItem && (
          <span className="text-cyan-400">Selected: {selectedItem}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onFitView}
          className="px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors font-mono"
          title="Fit to view"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
