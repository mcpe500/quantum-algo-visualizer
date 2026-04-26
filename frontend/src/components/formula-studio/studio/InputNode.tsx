import React, { useState, useEffect, useRef } from 'react';
import { Variable, Wifi } from 'lucide-react';
import type { CanvasNodeData, ConnectionMode } from './canvas-types';
import { ANCHOR_RADIUS } from './canvas-types';
import type { NodeResult } from './graphEngine';

interface InputNodeProps {
  node: CanvasNodeData;
  result: NodeResult | undefined;
  isSelected: boolean;
  isConnectionSource: boolean;
  isFlowActive?: boolean;
  connectionMode: ConnectionMode;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onConnectionStart: (nodeId: string) => void;
  onConnectionEnd: (nodeId: string) => void;
  onUpdateVar: (nodeId: string, varName: string, varValue: string) => void;
}

export const InputNode: React.FC<InputNodeProps> = ({
  node,
  result,
  isSelected,
  isConnectionSource,
  isFlowActive = false,
  connectionMode,
  onSelect,
  onDelete,
  onConnectionStart,
  onConnectionEnd,
  onUpdateVar,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [editingValue, setEditingValue] = useState(false);
  const [nameInput, setNameInput] = useState(node.varName ?? 'x');
  const [valueInput, setValueInput] = useState(node.varValue ?? '0');
  const nameRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  // sync if node prop changes externally
  useEffect(() => {
    setNameInput(node.varName ?? 'x');
    setValueInput(node.varValue ?? '0');
  }, [node.varName, node.varValue]);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  useEffect(() => {
    if (editingValue) valueRef.current?.focus();
  }, [editingValue]);

  const commitName = () => {
    setEditingName(false);
    const name = nameInput.trim() || 'x';
    setNameInput(name);
    onUpdateVar(node.id, name, valueInput);
  };

  const commitValue = () => {
    setEditingValue(false);
    onUpdateVar(node.id, nameInput, valueInput);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectionMode === 'selecting-target') {
      onConnectionEnd(node.id);
    } else if (connectionMode === 'selecting-source') {
      onConnectionStart(node.id);
    } else {
      onSelect(node.id);
    }
  };

  const handleAnchorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectionMode === 'idle' || connectionMode === 'selecting-source') {
      onConnectionStart(node.id);
    } else if (connectionMode === 'selecting-target') {
      onConnectionEnd(node.id);
    }
  };

  const borderClass = isConnectionSource
    ? 'border-2 border-teal-300 animate-pulse'
    : isFlowActive
    ? 'border-2 border-cyan-300 ring-4 ring-cyan-400/20 shadow-lg shadow-cyan-500/20'
    : isSelected
    ? 'border-2 border-teal-200'
    : 'border border-teal-500/60';

  const hasValue = result?.value !== undefined;

  return (
    <div
      className={`absolute bg-slate-800/95 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-150 ${borderClass}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
        minHeight: 90,
        zIndex: isSelected || isConnectionSource ? 100 : 10,
      }}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
        <Variable className="w-3 h-3 text-teal-400 shrink-0" />
        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Input</span>
        {hasValue && (
          <Wifi className="w-3 h-3 text-teal-400 ml-auto opacity-60" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
          className="ml-auto text-slate-500 hover:text-red-400 text-xs px-0.5 leading-none"
        >
          ×
        </button>
      </div>

      {/* Variable = value row */}
      <div className="flex items-center gap-2 px-3 pb-2.5">
        {/* Variable name */}
        {editingName ? (
          <input
            ref={nameRef}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); e.stopPropagation(); }}
            onClick={(e) => e.stopPropagation()}
            className="w-16 px-1.5 py-1 bg-slate-700 border border-teal-500/60 rounded text-sm font-mono text-teal-200 focus:outline-none"
          />
        ) : (
          <button
            className="px-2 py-1 bg-teal-500/10 border border-teal-500/30 rounded text-sm font-mono font-bold text-teal-300 hover:bg-teal-500/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); setEditingName(true); }}
            title="Click to rename variable"
          >
            {nameInput}
          </button>
        )}

        <span className="text-slate-500 text-sm font-light">=</span>

        {/* Value */}
        {editingValue ? (
          <input
            ref={valueRef}
            type="number"
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            onBlur={commitValue}
            onKeyDown={(e) => { if (e.key === 'Enter') commitValue(); e.stopPropagation(); }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-1.5 py-1 bg-slate-700 border border-teal-500/60 rounded text-sm font-mono text-slate-100 focus:outline-none"
          />
        ) : (
          <button
            className="flex-1 text-left px-2 py-1 bg-slate-900/60 border border-slate-700/60 rounded text-sm font-mono text-emerald-300 hover:border-teal-500/40 transition-colors"
            onClick={(e) => { e.stopPropagation(); setEditingValue(true); }}
            title="Click to set value"
          >
            {valueInput || '0'}
          </button>
        )}
      </div>

      {/* Connection anchors */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-teal-500 border-2 border-slate-800 cursor-pointer hover:bg-teal-400 transition-colors ${isConnectionSource ? 'bg-teal-300 scale-125' : ''}`}
        style={{ left: -ANCHOR_RADIUS }}
        onClick={handleAnchorClick}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-teal-600 border-2 border-slate-800 cursor-pointer hover:bg-teal-500 transition-colors"
        style={{ right: -ANCHOR_RADIUS }}
        onClick={handleAnchorClick}
      />
    </div>
  );
};
