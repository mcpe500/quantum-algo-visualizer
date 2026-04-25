import React, { useState, useEffect, useRef } from 'react';
import { FlaskRound } from 'lucide-react';
import type { CanvasNodeData, ConnectionMode } from './canvas-types';
import { ANCHOR_RADIUS } from './canvas-types';
import type { NodeResult } from './graphEngine';

interface ExpressionNodeProps {
  node: CanvasNodeData;
  result: NodeResult | undefined;
  isSelected: boolean;
  isConnectionSource: boolean;
  connectionMode: ConnectionMode;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onConnectionStart: (nodeId: string) => void;
  onConnectionEnd: (nodeId: string) => void;
  onUpdateExpression: (nodeId: string, expr: string) => void;
}

export const ExpressionNode: React.FC<ExpressionNodeProps> = ({
  node,
  result,
  isSelected,
  isConnectionSource,
  connectionMode,
  onSelect,
  onDelete,
  onConnectionStart,
  onConnectionEnd,
  onUpdateExpression,
}) => {
  const [editing, setEditing] = useState(false);
  const [exprInput, setExprInput] = useState(node.nodeExpression ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExprInput(node.nodeExpression ?? '');
  }, [node.nodeExpression]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    onUpdateExpression(node.id, exprInput);
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

  const hasResult = result?.value !== undefined && !result?.error;
  const hasError = !!result?.error;
  const isEmpty = !node.nodeExpression?.trim();

  const borderClass = isConnectionSource
    ? 'border-2 border-amber-300 animate-pulse'
    : isSelected
    ? 'border-2 border-amber-300'
    : hasError
    ? 'border border-red-500/50'
    : hasResult
    ? 'border border-amber-500/70 shadow-amber-500/10 shadow-md'
    : 'border border-amber-500/40';

  return (
    <div
      className={`absolute bg-slate-800/95 rounded-xl shadow-lg backdrop-blur-sm transition-all duration-150 ${borderClass}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
        minHeight: 110,
        zIndex: isSelected || isConnectionSource ? 100 : 10,
      }}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
        <FlaskRound className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Ekspresi</span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
          className="ml-auto text-slate-500 hover:text-red-400 text-xs px-0.5 leading-none"
        >
          ×
        </button>
      </div>

      {/* Expression input */}
      <div className="px-3 pb-1">
        {editing ? (
          <input
            ref={inputRef}
            value={exprInput}
            onChange={(e) => setExprInput(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1.5 bg-slate-700 border border-amber-500/60 rounded-lg text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-400"
            placeholder="n*(n+1)/2"
          />
        ) : (
          <button
            className={`w-full text-left px-2 py-1.5 rounded-lg border text-sm font-mono transition-colors ${
              isEmpty
                ? 'border-dashed border-slate-600/60 text-slate-600 italic hover:border-amber-500/40'
                : 'border-slate-700/60 text-amber-200 hover:border-amber-500/40 bg-slate-900/40'
            }`}
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          >
            {isEmpty ? 'Klik untuk menulis ekspresi...' : (node.nodeExpression ?? '')}
          </button>
        )}
      </div>

      {/* Result area */}
      {!isEmpty && (
        <div className="px-3 pb-2.5">
          {hasResult && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/25 rounded-lg">
              <span className="text-slate-500 text-xs">→</span>
              <span className="text-lg font-bold text-amber-300 tabular-nums font-mono">
                {result!.valueDisplay}
              </span>
              {result!.simplified && result!.simplified !== node.nodeExpression && (
                <span className="text-[10px] text-slate-500 ml-auto truncate max-w-[80px]">
                  ={result!.simplified}
                </span>
              )}
            </div>
          )}
          {hasError && (
            <div className="px-2 py-1.5 bg-red-500/10 border border-red-500/25 rounded-lg">
              <p className="text-[11px] text-red-300 leading-relaxed truncate">{result!.error}</p>
            </div>
          )}
          {!hasResult && !hasError && (
            <div className="px-2 py-1 text-slate-600 text-xs italic">Mendefinisikan...</div>
          )}
        </div>
      )}

      {isEmpty && (
        <div className="px-3 pb-2.5">
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Tulis ekspresi matematis. Gunakan variabel dari node Input.
          </p>
        </div>
      )}

      {/* Connection anchors */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-500 border-2 border-slate-800 cursor-pointer hover:bg-amber-400 transition-colors ${isConnectionSource ? 'bg-amber-300 scale-125' : ''}`}
        style={{ left: -ANCHOR_RADIUS }}
        onClick={handleAnchorClick}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-amber-600 border-2 border-slate-800 cursor-pointer hover:bg-amber-500 transition-colors"
        style={{ right: -ANCHOR_RADIUS }}
        onClick={handleAnchorClick}
      />
    </div>
  );
};
