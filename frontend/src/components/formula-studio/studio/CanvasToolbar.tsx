import React, { useState } from 'react';
import {
  Camera,
  FlaskRound,
  LayoutGrid,
  Variable,
  ZoomIn,
  ZoomOut,
  Link2,
  Unlink,
  Trash2,
  Undo2,
  Redo2,
  Upload,
  Download,
} from 'lucide-react';
import type { ConnectionMode } from './canvas-types';
import type { FormulaStudioScenario } from '../scenarios';

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
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportProject: () => void;
  onImportProject: () => void;
  scenarios: FormulaStudioScenario[];
  onLoadScenario: (scenarioId: string) => void;
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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportProject,
  onImportProject,
  scenarios,
  onLoadScenario,
  zoom,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState('');

  const handleLoadScenario = () => {
    if (!selectedScenarioId) return;
    onLoadScenario(selectedScenarioId);
  };

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

        <div className="flex items-center gap-1.5 px-1.5 py-1 bg-slate-950/40 border border-slate-800/60 rounded-md">
          <select
            value={selectedScenarioId}
            onChange={(event) => setSelectedScenarioId(event.target.value)}
            className="max-w-56 bg-transparent text-xs text-slate-300 focus:outline-none"
            title="Pilih skenario canvas siap pakai di Studio"
          >
            <option value="" className="bg-slate-950 text-slate-300">Pilih skenario Studio...</option>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id} className="bg-slate-950 text-slate-200">
                {scenario.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleLoadScenario}
            disabled={!selectedScenarioId}
            className="px-2 py-1 text-xs font-medium rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Muat skenario ke canvas Studio"
          >
            Muat
          </button>
        </div>

        <div className="w-px h-5 bg-slate-700/50 mx-0.5" />

        <button
          onClick={onToggleConnectionMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
            connectionMode !== 'idle'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
          title="Hubungkan antar node (C)"
        >
          {connectionMode === 'idle' ? <Link2 className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
          {connectionMode === 'idle' ? 'Connect' : 'Cancel'}
        </button>

        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors"
          title="Susun ulang node otomatis (A)"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Auto
        </button>


        <div className="w-px h-5 bg-slate-700/50 mx-0.5" />

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          title="Undo perubahan canvas (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
          title="Redo perubahan canvas (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
          Redo
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
          title="Ambil screenshot canvas"
        >
          <Camera className="w-3.5 h-3.5" />
          Screenshot
        </button>


        <button
          onClick={onExportProject}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors"
          title="Export project Formula Studio sebagai .qav-project"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>

        <button
          onClick={onImportProject}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors"
          title="Import project Formula Studio dari .qav-project"
        >
          <Upload className="w-3.5 h-3.5" />
          Import
        </button>

        <div className="w-px h-5 bg-slate-700/50 mx-0.5" />

        <button
          onClick={onClearCanvas}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
          title="Hapus semua node dan koneksi"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </div>
  );
};
